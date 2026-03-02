import {
  BrokerInfo,
  Topics,
  Commands,
  Responses,
  MessageFields,
} from "#/mqttConstants";
import { envs } from "@/utils/env";

const BROKER_INFO: BrokerInfo = {
  // You can easily change the broker here, you just have to provide your broker information
  url: envs.MQTT_URL,
  port: envs.MQTT_PORT,
  username: envs.MQTT_USERNAME,
  password: envs.MQTT_PASSWORD,
};

const TOPICS: Topics = {
  HEARING_THE_SENSOR: "/sensor",
  HEARING_THE_SERVER: "/server",
};

const COMMANDS: Commands = {
  PING: "ping",
  START: "start",
  STOP: "stop",
};

const RESPONSES: Responses = {
  PONG: "pong",
  PONG_PUBLISHING: "pong.publishing",
  START_PUBLISHING: "start.publishing",
  STOP_PUBLISHING: "stop.publishing",
};

const MESSAGE_FIELDS: MessageFields = {
  TIMESTAMP: "timestamp",
  CMD: "cmd",
  ANS: "ans",
  VALUE: "value",
};

export { BROKER_INFO, TOPICS, COMMANDS, RESPONSES, MESSAGE_FIELDS };
