import { Kafka, Consumer } from "kafkajs";
import { envs } from "@/utils/env";
class KafkaService {
  private static instance: KafkaService | undefined;
  private kafka!: Kafka;
  private consumer!: Consumer;
  private isKafkaConnected = false;
  private mapTopicCallbacks: Map<string, (data: any) => void> = new Map();

  private constructor() {
    // Constructeur privé pour empêcher l'instanciation directe}
  }
  public static async getInstance(): Promise<KafkaService> {
    if (!KafkaService.instance) {
      try {
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
      this.kafka = new Kafka({
        clientId: "sensor-app",
        brokers: [envs.KAFKA_BROKERS],
        retry: {
          initialRetryTime: 100,
          retries: 5,
        },
      });

      this.consumer = this.kafka.consumer({ groupId: "sensor-group" });
    } catch (error) {
      console.error("❌ [Kafka] Erreur de connexion:", error);
      throw error;
    }
  }

  private async connect(): Promise<void> {
    try {
      await this.consumer.connect();
      console.log("✅ Kafka Consumer connected successfully");

      this.isKafkaConnected = true;
    } catch (error) {
      console.error("❌ Error connecting to Kafka:", error);
      this.isKafkaConnected = false;
      throw error;
    }
  }

  public registerTopic(topic: string, callback: (data: any) => void): void {
    this.mapTopicCallbacks.set(topic, callback);
  }

  public async startConsuming(): Promise<void> {
    try {
      for (const topic of this.mapTopicCallbacks.keys()) {
        await this.consumer.subscribe({ topic });
      }
      await this.consumer.run({
        eachMessage: async ({ topic, message }) => {
          const callback = this.mapTopicCallbacks.get(topic);
          if (callback) {
            const data = JSON.parse(message.value?.toString() || "");
            await callback(data);
          } else {
            console.warn("⚠️ No callback registered for topic:", topic);
          }
        },
      });
      console.log("✅ Kafka Consumer started consuming");
    } catch (error) {
      console.error("❌ Error starting Kafka consumer:", error);
      throw error;
    }
  }

  public isConnected(): boolean {
    return this.isKafkaConnected;
  }
  public async disconnect(): Promise<void> {
    try {
      await this.consumer.disconnect();
      console.log("👋 Kafka Consumer disconnected");
      this.isKafkaConnected = false;
    } catch (error) {
      console.error("❌ Error disconnecting from Kafka:", error);
      throw error;
    }
  }
}

export default KafkaService;
