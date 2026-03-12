import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { envs } from "@utils/env";
import KafkaService from "@service/kafkaService";
import db from "@db/index";
import type { Sensor } from "#/sensor";
import type { MeasurementTypeModel } from "#/measurementType";
import { addDiscoveredTopic } from "@service/discorverdSensorSevice";
import { addDiscoveredMeasurement } from "@service/discoverdMeasurementService";
import * as dlq from "@service/dlqService";
import { activeSessionsTotal } from "@middlewares/metrics";

const { Sensor: SensorModel, Session, MeasurementType } = db;

// ---------- Kafka message payload types ----------

interface KafkaMeasure {
  measureType: string;
  value: number;
}

interface KafkaDataEntry {
  timestamp: number;
  measures: KafkaMeasure[];
}

interface KafkaStartPayload {
  type: "start";
  sensorTopic: string;
  timestamp: number;
}

interface KafkaDataPayload {
  type: "data";
  sensorTopic: string;
  measures: KafkaDataEntry[];
}

interface KafkaStopPayload {
  type: "stop";
  sensorTopic: string;
  timestamp: number;
}

type KafkaPayload = KafkaStartPayload | KafkaDataPayload | KafkaStopPayload;

class SocketService {
  private io: Server;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:8080",
        credentials: true,
      },
    });
  }

  public initialize() {
    this.io.on("connection", (socket) => {
      socket.on("join-session", (data: { token: string; topic: string }) => {
        try {
          jwt.verify(data.token, envs.JWT_SECRET);
          socket.join(data.topic);
          socket.emit("joined", { topic: data.topic });
        } catch (error) {
          console.error("Invalid JWT token for socket connection:", error);
          socket.disconnect();
        }
      });
    });
  }
  public sendDataToRoom(topic: string, data: KafkaPayload) {
    this.io.to(topic).emit("new-data", data);
  }
  private kafkaRetryCount = 0;
  private static readonly KAFKA_MAX_RETRIES = 10;
  private static readonly KAFKA_RETRY_BASE_MS = 1_000;
  private static readonly KAFKA_MAX_RETRY_DELAY_MS = 30_000;

  public async startKafkaConsumer(): Promise<void> {
    try {
      const kafkaService = await KafkaService.getInstance();
      if (!kafkaService) {
        throw new Error("Kafka unavailable");
      }
      kafkaService.registerTopic("sensor-data", async (data: KafkaPayload) => {
        try {
          if (data.type === "start") {
            await this.handleSessionStart(data);
          } else if (data.type === "data") {
            await this.handleSensorData(data);
          } else if (data.type === "stop") {
            await this.handleSessionStop(data);
          }
        } catch (error) {
          console.error("❌ [Kafka] Erreur traitement message:", error);
          dlq.push(data);
        }
      });
      await kafkaService.startConsuming();
      this.kafkaRetryCount = 0;
      console.log("Kafka consumer started");
      await dlq.flush(async (data: KafkaPayload) => {
        if (data.type === "start") await this.handleSessionStart(data);
        else if (data.type === "data") await this.handleSensorData(data);
        else if (data.type === "stop") await this.handleSessionStop(data);
      });
    } catch (error) {
      this.kafkaRetryCount++;
      if (this.kafkaRetryCount > SocketService.KAFKA_MAX_RETRIES) {
        console.error(
          `❌ [Kafka] Abandon après ${SocketService.KAFKA_MAX_RETRIES} tentatives. Le service démarre sans Kafka.`
        );
        return;
      }
      const delay = Math.min(
        Math.pow(2, this.kafkaRetryCount) * SocketService.KAFKA_RETRY_BASE_MS,
        SocketService.KAFKA_MAX_RETRY_DELAY_MS
      );
      console.error(
        `❌ [Kafka] Erreur (tentative ${this.kafkaRetryCount}/${
          SocketService.KAFKA_MAX_RETRIES
        }), retry dans ${delay / 1000}s:`,
        error
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      await this.startKafkaConsumer();
    }
  }
  // Map sensorTopic → sessionId pour tracker les sessions actives
  private activeSessions: Map<string, string> = new Map();
  // Guard against duplicate session creation for the same topic when two START messages arrive concurrently
  private sessionCreationInProgress: Set<string> = new Set();
  // Map measureType name → id
  private measurementTypesMap: Map<string, string> = new Map();

  private measurementTypesCacheTime: Date | null = null;

  private TTL = 5 * 60 * 1000; // 5 minutes

  private async getMeasurementTypesMap(): Promise<void> {
    const now = new Date();
    if (
      this.measurementTypesMap.size > 0 &&
      this.measurementTypesCacheTime &&
      now.getTime() - this.measurementTypesCacheTime.getTime() < this.TTL
    )
      return;
    const types = await MeasurementType.findAll();
    types.forEach((mt: MeasurementTypeModel) => {
      this.measurementTypesMap.set(mt.dataValues.name, mt.dataValues.id);
    });
    this.measurementTypesCacheTime = now;
  }

  private async handleSessionStart(data: KafkaStartPayload): Promise<void> {
    if (
      this.activeSessions.has(data.sensorTopic) ||
      this.sessionCreationInProgress.has(data.sensorTopic)
    ) {
      console.warn(
        `⚠️ [SessionStart] Session déjà active ou en cours de création pour: ${data.sensorTopic}`
      );
      return;
    }

    this.sessionCreationInProgress.add(data.sensorTopic);
    try {
      const baseTopic = data.sensorTopic.replace("/sensor", "");
      const sensorInstance = await SensorModel.findOne({
        where: { topic: baseTopic },
      });
      if (!sensorInstance) {
        console.warn(
          `⚠️ [SessionStart] Capteur inconnu pour topic: ${baseTopic}`
        );
        addDiscoveredTopic(baseTopic);
        return;
      }
      const sensor = sensorInstance.dataValues as Sensor;
      const session = await Session.create({
        idSensor: sensor.id,
        idFog: "fog-service",
        createdAt: new Date(data.timestamp),
      });
      this.activeSessions.set(
        data.sensorTopic,
        (session.dataValues as { id: string }).id
      );
      activeSessionsTotal.inc();
      console.log(
        `▶️ [Session] Créée pour ${baseTopic} — id: ${session.dataValues.id}`
      );
    } finally {
      this.sessionCreationInProgress.delete(data.sensorTopic);
    }
  }

  private async handleSensorData(data: KafkaDataPayload): Promise<void> {
    await this.getMeasurementTypesMap();
    const sessionId = this.activeSessions.get(data.sensorTopic);
    if (!sessionId) {
      console.warn(
        `⚠️ [SensorData] Pas de session active pour: ${data.sensorTopic}`
      );
      return;
    }
    const baseTopic = data.sensorTopic.replace("/sensor", "");
    const sensorInstance = await SensorModel.findOne({
      where: { topic: baseTopic },
    });
    if (!sensorInstance) {
      addDiscoveredTopic(baseTopic);
      return;
    }
    const sensor = sensorInstance.dataValues as Sensor;

    for (const entry of data.measures) {
      for (const measure of entry.measures) {
        const idMeasurementType = this.measurementTypesMap.get(
          measure.measureType
        );
        if (!idMeasurementType) {
          addDiscoveredMeasurement(measure.measureType);
          console.warn(
            `⚠️ [SensorData] Type de mesure inconnu: ${measure.measureType}`
          );
          continue;
          // eslint-disable-next-line prettier/prettier
        };
        await db.sensordata.create({
          time: new Date(Math.floor(entry.timestamp / 1000)),
          idSensor: sensor.id,
          idMeasurementType,
          value: measure.value,
        });
      }
    }
    this.sendDataToRoom(data.sensorTopic, data);
  }

  private async handleSessionStop(data: KafkaStopPayload): Promise<void> {
    const sessionId = this.activeSessions.get(data.sensorTopic);
    if (!sessionId) return;
    await Session.update(
      { endedAt: new Date(data.timestamp) },
      { where: { id: sessionId } }
    );
    this.activeSessions.delete(data.sensorTopic);
    activeSessionsTotal.dec();
    console.log(`⏹️ [Session] Clôturée pour ${data.sensorTopic}`);
  }

  public emitSensorStatus(sensorName: string, status: string) {
    this.io.emit("sensor-status", { sensorName, status });
  }

  public async close(): Promise<void> {
    const now = new Date();
    for (const [, sessionId] of this.activeSessions) {
      await Session.update({ endedAt: now }, { where: { id: sessionId } });
    }
    console.log(
      `${this.activeSessions.size} session(s) clôturée(s) au shutdown`
    );
    activeSessionsTotal.set(0);
    this.activeSessions.clear();
    this.io.close();
    const kafkaService = await KafkaService.getInstance();
    if (kafkaService) {
      await kafkaService.disconnect();
    }
    console.log("SocketService fermé proprement");
  }
}

export default SocketService;
