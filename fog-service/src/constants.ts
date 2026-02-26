export const TOPICS = {
  SENSOR: "/sensor",
  SERVER: "/server",
};

export const COMMANDS = {
  PING: "ping",
  START: "start",
  STOP: "stop",
  ACK: "ack",
};

export const MESSAGE_FIELDS = {
  TIMESTAMP: "timestamp",
  CMD: "cmd",
  ANS: "ans",
  MEASURES: "measures",
};

export const BROKER_INFO = {
  url: process.env.MQTT_URL ?? "mqtt://localhost",
  port: parseInt(process.env.MQTT_PORT ?? "1883"),
  username: process.env.MQTT_USERNAME ?? "",
  password: process.env.MQTT_PASSWORD ?? "",
};

export const KAFKA_CONFIG = {
  brokers: [process.env.KAFKA_BROKERS ?? "localhost:9092"],
};
