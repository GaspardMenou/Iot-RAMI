import { Kafka, Producer } from "kafkajs";
import { KAFKA_CONFIG } from "./constants";
class KafkaService {
  private static instance: KafkaService | undefined;
  private kafka!: Kafka;
  private producer!: Producer;
  private isKafkaConnected = false;
  private constructor() {
    // Constructeur privé pour empêcher l'instanciation directe}
  }
  public static async getInstance(): Promise<KafkaService> {
    if (!KafkaService.instance) {
      try {
        console.log("📦 Creating new Kafka Service instance");
        KafkaService.instance = new KafkaService();
        await KafkaService.instance.connectToKafka();
        await KafkaService.instance.connect();
      } catch (error) {
        KafkaService.instance = undefined; // Reset instance on failure
        throw error; // Rethrow to handle it in the caller
      }
    }
    return KafkaService.instance;
  }

  private async connectToKafka(): Promise<void> {
    try {
      console.log("🔄 [Kafka] Tentative de connexion...");

      this.kafka = new Kafka({
        clientId: "fog-service",
        brokers: KAFKA_CONFIG.brokers,
        retry: {
          initialRetryTime: 100,
          retries: 5,
        },
      });

      this.producer = this.kafka.producer();
      console.log("✅ [Kafka] Connexion établie");
    } catch (error) {
      console.error("❌ [Kafka] Erreur de connexion:", error);
      throw error;
    }
  }

  private async connect(): Promise<void> {
    try {
      await this.producer.connect();
      console.log("✅ Kafka Producer connected successfully");
      this.isKafkaConnected = true;
    } catch (error) {
      console.error("❌ Error connecting to Kafka:", error);
      this.isKafkaConnected = false;
      throw error;
    }
  }

  public async publishSensorData(topic: string, data: any): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(data) }],
      });
      console.log("📤 Published to Kafka:", {
        topic,
        data,
      });
    } catch (error) {
      console.error("❌ Error publishing to Kafka:", error);
      throw error;
    }
  }
  public async publishBatchSensorData(
    topic: string,
    dataArray: any[],
  ): Promise<void> {
    try {
      const messages = dataArray.map((data) => ({
        value: JSON.stringify(data),
      }));
      await this.producer.send({
        topic,
        messages,
      });
      console.log("📤 Published batch to Kafka:", {
        topic,
        count: dataArray.length,
      });
    } catch (error) {
      console.error("❌ Error publishing batch to Kafka:", error);
      throw error;
    }
  }
  public isConnected(): boolean {
    return this.isKafkaConnected;
  }
  public async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      console.log("👋 Kafka Producer disconnected");

      this.isKafkaConnected = false;
    } catch (error) {
      console.error("❌ Error disconnecting from Kafka:", error);
      throw error;
    }
  }
}

export default KafkaService;
