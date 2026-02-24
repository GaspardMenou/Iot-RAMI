import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { envs } from "@utils/env";
import KafkaService from "@service/kafkaService";

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
      kakfaService.registerTopic("sensor-data", (data) => {
        this.sendDataToRoom(data.topic, data);
      });
      await kakfaService.startConsuming();
      console.log("Kafka consumer started");
    } catch (error) {
      console.error("Error starting Kafka consumer:", error);
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Retry after 5 seconds
      await this.startKafkaConsumer(); // Retry connection
    }
  }
  public emitSensorStatus(sensorName: string, status: string) {
    this.io.emit("sensor-status", { sensorName, status });
    console.log(`Emitted sensor status for sensor ${sensorName}:`, status);
  }
}

export default SocketService;
