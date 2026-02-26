import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { envs } from "@utils/env";
import KafkaService from "@service/kafkaService";
import db from "@db/index";
const DB: any = db;
const { Sensor, Session, MeasurementType } = DB;

class SocketService {
  private io: Server;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
      },
    });
  }

  public initialize() {
    this.io.on("connection", (socket) => {
      socket.on("join-session", (data: { token: string; topic: string }) => {
        try {
          jwt.verify(data.token, envs.JWT_SECRET);
          socket.join(data.topic);
          console.log(`Client joined topic: ${data.topic}`);
          socket.emit("joined", { topic: data.topic });
        } catch (error) {
          console.error("Invalid JWT token for socket connection:", error);
          socket.disconnect();
        }
      });
      socket.on("disconnect", () => {
        console.log("Client disconnected");
      });
    });
  }
  public sendDataToRoom(topic: string, data: any) {
    this.io.to(topic).emit("new-data", data);
    console.log(`Sent data to topic ${topic}:`, data);
  }
  public async startKafkaConsumer() {
    try {
      const kakfaService = await KafkaService.getInstance();
      if (!kakfaService) {
        throw new Error("Kafka unavailable");
      }
      kakfaService.registerTopic("sensor-data", async (data) => {
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
        }
      });
      await kakfaService.startConsuming();
      console.log("Kafka consumer started");
    } catch (error) {
      console.error("Error starting Kafka consumer:", error);
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Retry after 5 seconds
      await this.startKafkaConsumer(); // Retry connection
    }
  }
  // Map sensorTopic → sessionId pour tracker les sessions actives
  private activeSessions: Map<string, string> = new Map();
  // Map measureType name → id
  private measurementTypesMap: Map<string, string> = new Map();

  private async getMeasurementTypesMap(): Promise<void> {
    if (this.measurementTypesMap.size > 0) return;
    const types = await MeasurementType.findAll();
    types.forEach((mt: any) => {
      this.measurementTypesMap.set(mt.dataValues.name, mt.dataValues.id);
    });
  }

  private async handleSessionStart(data: any): Promise<void> {
    const baseTopic = data.sensorTopic.replace("/sensor", "");
    const sensor = await Sensor.findOne({ where: { topic: baseTopic } });
    if (!sensor) {
      console.warn(`⚠️ [SessionStart] Capteur inconnu pour topic: ${baseTopic}`);
      return;
    }
    const session = await Session.create({
      idSensor: sensor.id,
      idFog: "fog-service",
      createdAt: new Date(data.timestamp),
    });
    this.activeSessions.set(data.sensorTopic, session.id);
    console.log(`▶️ [Session] Créée pour ${baseTopic} — id: ${session.id}`);
  }

  private async handleSensorData(data: any): Promise<void> {
    await this.getMeasurementTypesMap();
    const sessionId = this.activeSessions.get(data.sensorTopic);
    if (!sessionId) {
      console.warn(`⚠️ [SensorData] Pas de session active pour: ${data.sensorTopic}`);
      return;
    }
    const baseTopic = data.sensorTopic.replace("/sensor", "");
    const sensor = await Sensor.findOne({ where: { topic: baseTopic } });
    if (!sensor) return;

    for (const entry of data.measures) {
      for (const measure of entry.measures) {
        const idMeasurementType = this.measurementTypesMap.get(measure.measureType);
        if (!idMeasurementType) continue;
        await db.sensordata.create({
          time: entry.timestamp,
          idSensor: sensor.id,
          idMeasurementType,
          value: measure.value,
        });
      }
    }
    this.sendDataToRoom(data.sensorTopic, data);
    console.log(`💾 [SensorData] Données stockées pour ${baseTopic}`);
  }

  private async handleSessionStop(data: any): Promise<void> {
    const sessionId = this.activeSessions.get(data.sensorTopic);
    if (!sessionId) return;
    await Session.update(
      { endedAt: new Date(data.timestamp) },
      { where: { id: sessionId } }
    );
    this.activeSessions.delete(data.sensorTopic);
    console.log(`⏹️ [Session] Clôturée pour ${data.sensorTopic}`);
  }

  public emitSensorStatus(sensorName: string, status: string) {
    this.io.emit("sensor-status", { sensorName, status });
    console.log(`Emitted sensor status for sensor ${sensorName}:`, status);
  }
}

export default SocketService;
