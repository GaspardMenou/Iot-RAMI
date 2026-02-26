import mqtt, { MqttClient } from "mqtt";
import { BROKER_INFO, TOPICS, MESSAGE_FIELDS, COMMANDS } from "./constants";
import KafkaService from "./kafkaProducer";

class MqttFog {
  private static instance: MqttFog | undefined;
  private mqttClient!: MqttClient;
  private kafkaService!: KafkaService;
  private buffer = new Map<string, any[]>();
  private flushIntervalMs = 1000; // Intervalle de flush en millisecondes
  private flushMaxSize = 10;
  private sensorTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    // Constructeur privé pour empêcher l'instanciation directe
  }
  public static async getInstance(): Promise<MqttFog> {
    if (MqttFog.instance === undefined) {
      MqttFog.instance = new MqttFog();
      await MqttFog.instance.connectBroker();
      MqttFog.instance.kafkaService = await KafkaService.getInstance();
    }
    return MqttFog.instance;
  }

  private async connectBroker(): Promise<void> {
    try {
      console.log("🔄 [connectBroker] Démarrage connexion MQTT");

      const connectOptions: mqtt.IClientOptions = {
        clientId: "FogServiceClient",
        username: BROKER_INFO.username,
        password: BROKER_INFO.password,
        port: BROKER_INFO.port,
      };

      // Créer le client MQTT
      this.mqttClient = mqtt.connect(`${BROKER_INFO.url}`, connectOptions);

      // Attacher les handlers AVANT la connexion
      this.mqttClient.on("connect", () => {
        console.log("🟢 [MQTT] Connecté au broker");
        this.handleConnect();
      });

      // Handler de messages - avec debug explicite
      this.mqttClient.on("message", (topic: string, message: Buffer) => {
        console.log("⬇️ [MQTT] ENTRÉE DANS LE HANDLER DE MESSAGE");
        console.log("📨 [MQTT] Topic:", topic);
        console.log("📨 [MQTT] Message:", message.toString());
        this.handleMessageReceivedFromSensor(topic, message);
      });

      // Handler d'erreur
      this.mqttClient.on("error", (error) => {
        console.error("❌ [MQTT] Erreur:", error);
      });

      console.log(
        "✅ [connectBroker] Client MQTT initialisé et handlers attachés",
      );
    } catch (error) {
      console.error("❌ [connectBroker] Erreur:", error);
      throw error;
    }
  }

  private handleConnect(): void {
    this.mqttClient.subscribe("#");
    this.startFlushInterval();
  }
  private handlePing(topic: string): void {
    clearTimeout(this.sensorTimeouts.get(topic));
    const timeout = setTimeout(() => {
      this.sensorTimeouts.delete(topic);
      console.log(`⚠️ [Sensor Timeout] Sensor ${topic} is offline`);
    }, 30000);
    this.sensorTimeouts.set(topic, timeout);
  }
  private async handleStart(topic: string): Promise<void> {
    if (!this.buffer.has(topic)) {
      this.buffer.set(topic, []);
    }
    try {
      await this.kafkaService.publishBatchSensorData("sensor-data", [
        { type: "start", sensorTopic: topic, timestamp: Date.now() },
      ]);
      console.log(`▶️ [Kafka] START envoyé pour ${topic}`);
    } catch (error) {
      console.error(`❌ [handleStart] Erreur Kafka:`, error);
    }
    this.sendAck(topic);
  }
  private async handleStop(topic: string): Promise<void> {
    await this.flushBuffer(topic);
    try {
      await this.kafkaService.publishBatchSensorData("sensor-data", [
        { type: "stop", sensorTopic: topic, timestamp: Date.now() },
      ]);
      console.log(`⏹️ [Kafka] STOP envoyé pour ${topic}`);
    } catch (error) {
      console.error(`❌ [handleStop] Erreur Kafka:`, error);
    }
    this.buffer.delete(topic);
  }
  private sendAck(topic: string): void {
    const serveurTopic = topic.replace(TOPICS.SENSOR, TOPICS.SERVER);
    this.mqttClient.publish(
      serveurTopic,
      JSON.stringify({ [MESSAGE_FIELDS.ANS]: COMMANDS.ACK }),
    );
  }
  private handleMeasurement(topic: string, data: any): void {
    if (!this.buffer.has(topic)) {
      this.buffer.set(topic, []);
    }
    if (this.buffer.get(topic)!.length >= this.flushMaxSize) {
      this.flushBuffer(topic).catch((e) => console.error("❌ [flushBuffer]", e));
    }
    const dataArray = this.buffer.get(topic)!;
    dataArray.push(data);
  }
  private async flushBuffer(topic: string): Promise<void> {
    const dataArray = this.buffer.get(topic);
    if (dataArray && dataArray.length > 0) {
      try {
        const batch = {
          type: "data",
          sensorTopic: topic,
          measures: dataArray,
        };
        await this.kafkaService.publishBatchSensorData("sensor-data", [batch]);
        this.buffer.set(topic, []);
        console.log(`📤 [Kafka] batch data envoyé pour ${topic} (${dataArray.length} mesures)`);
      } catch (error) {
        console.error(`❌ [flushBuffer] Erreur Kafka pour ${topic}:`, error);
      }
    }
  }
  private startFlushInterval(): void {
    setInterval(async () => {
      for (const [topic, dataArray] of this.buffer.entries()) {
        if (dataArray.length > 0) {
          await this.flushBuffer(topic);
        }
      }
    }, this.flushIntervalMs);
  }

  private handleMessageReceivedFromSensor(
    topic: string,
    message: Buffer,
  ): void {
    try {
      if (!topic.endsWith(TOPICS.SENSOR)) {
        return;
      }

      const parsed = JSON.parse(message.toString());
      if (parsed[MESSAGE_FIELDS.CMD] === COMMANDS.PING) {
        this.handlePing(topic);
      } else if (parsed[MESSAGE_FIELDS.CMD] === COMMANDS.START) {
        this.handleStart(topic).catch((e) => console.error("❌ [handleStart]", e));
      } else if (parsed[MESSAGE_FIELDS.CMD] === COMMANDS.STOP) {
        this.handleStop(topic).catch((e) => console.error("❌ [handleStop]", e));
      } else if (parsed[MESSAGE_FIELDS.MEASURES]) {
        this.handleMeasurement(topic, {
          measures: parsed[MESSAGE_FIELDS.MEASURES],
          timestamp: parsed[MESSAGE_FIELDS.TIMESTAMP],
        });
      } else {
        console.warn(
          "⚠️ [handleMessageReceivedFromSensor] Commande inconnue ou données manquantes:",
          parsed,
        );
      }
    } catch (error) {
      console.error(
        "❌ [handleMessageReceivedFromSensor] Erreur de traitement du message:",
        error,
      );
    }
  }
}
export default MqttFog;
