import mqtt, { MqttClient } from "mqtt";
import {
  TOPICS,
  COMMANDS,
  RESPONSES,
  MESSAGE_FIELDS,
  BROKER_INFO,
} from "@/utils/mqttConstant";
import { createSensorData } from "@/controllers/sensorData";
import SocketService from "@/service/socketService";
// Model import
import db from "@db/index";
import { Sensor as SensorType } from "@/types/sensor";
import { BrokerInfo } from "@/types/mqttConstants";
import SensorOverMqtt from "@/service/sensorsOverMqtt";
import KafkaService from "@/service/kafkaService";
const DB: any = db;
const { Sensor, MeasurementType } = DB;

// --- end of model import

/**
 * MqttServer class responsible for managing MQTT connections, subscriptions,
 * and message handling for sensor communication.
 */
interface DiscoveredSensorInfo {
  baseTopic: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  count: number;
}

class MqttServer {
  private reconnectAttemps = 0;
  private static instance: MqttServer | undefined;
  public mqttClient: MqttClient | undefined;
  private sensorsMap: Map<string, SensorOverMqtt> = new Map([]);
  private handleConnectBound = this.handleConnect.bind(this);
  private handleDisconnectBound = this.handleDisconnect.bind(this);
  private handleMessageReceivedFromSensorBound =
    this.handleMessageReceivedFromSensor.bind(this);
  private handleErrorBound = this.handleErrorMqtt.bind(this);
  private socketService: SocketService | undefined;
  private sensorTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private discoveredTopics: Map<string, DiscoveredSensorInfo> = new Map();
  private measurementTypesMap: Map<string, string> = new Map(); // Map pour stocker les types de mesure (idMeasurementType -> name)
  // ------------------------ SINGLETON IMPLEMENTATION
  // Private constructor to prevent direct class instantiation (BUT WE DO NOT NEED IT !!)
  private constructor() {
    return;
  }
  public setSocketService(socketService: SocketService) {
    this.socketService = socketService;
  }

  /**
   * Returns the singleton instance of MqttServer. If the instance does not exist,
   * it creates one and connects to the MQTT broker.
   *
   * @return {Promise<MqttServer>} The singleton instance of MqttServer.
   */ public static async getInstance(): Promise<MqttServer> {
    if (MqttServer.instance === undefined) {
      MqttServer.instance = new MqttServer();
      await MqttServer.instance.connectBroker(BROKER_INFO);
    }
    return MqttServer.instance;
  }

  // ------------------------ BASIC MQTT METHODS (connexion, deconnexion, reconnexion)
  /**
   * Connects to the MQTT broker using the provided broker information.
   *
   * @param {BrokerInfo} BROKER_INFO - Information needed to connect to the broker.
   * @return {Promise<void>}
   */
  private async connectBroker(BROKER_INFO: BrokerInfo): Promise<void> {
    try {
      console.log("🔄 [connectBroker] Démarrage connexion MQTT");

      const connectOptions: mqtt.IClientOptions = {
        clientId: "RAMI1-Server",
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
        "✅ [connectBroker] Client MQTT initialisé et handlers attachés"
      );
    } catch (error) {
      console.error("❌ [connectBroker] Erreur:", error);
      throw error;
    }
  }

  /**
   * Ends the connection to the MQTT broker. (public version of disconnectBroker)

   * @return {Promise<void>}
   */
  public async endConnexionToBroker(): Promise<void> {
    await this.disconnectBroker();
  }

  /**
   * Reconnects to the MQTT broker after disconnecting.
   *
   * @return {Promise<void>}
   */
  private async reconnectBroker(): Promise<void> {
    this.reconnectAttemps++;
    const delay = Math.min(Math.pow(2, this.reconnectAttemps), 30) * 1000; // Exponential backoff with a maximum delay of 30 seconds
    await new Promise((resolve) => setTimeout(resolve, delay)); // Exponential backoff
    await this.connectBroker(BROKER_INFO); // Attempt to reconnect after 5 seconds
  }

  /**
   * Ends the connection to the MQTT broker and removes event handlers.
   * NOTE THIS, when the broker disconnects, we reconnect it. here we remove
   * the event handler, this way, we do not react on the disconnection event !!
   *
   * @return {Promise<void>}
   */
  private async disconnectBroker(): Promise<void> {
    await this.manageEventHandlers("removeListener");
    if (this.mqttClient) {
      await new Promise<void>((resolve, reject) =>
        this.mqttClient?.end(false, (err) => (err ? reject(err) : resolve()))
      );
    }
  }

  // ----------------------- HANDLE MQTT EVENTS AND ERROR --------------------------------

  /**
   * Manages MQTT event handlers by either attaching or removing them
   * depending on the action parameter.
   *
   * @param {"on" | "removeListener"} action - The action to perform: attach or remove handlers.
   */
  private async manageEventHandlers(action: "on" | "removeListener") {
    if (!this.mqttClient) return;

    const method =
      action === "on"
        ? this.mqttClient.on.bind(this.mqttClient)
        : this.mqttClient.removeListener.bind(this.mqttClient);

    method("connect", this.handleConnectBound);
    method("disconnect", this.handleDisconnectBound);
    method("message", this.handleMessageReceivedFromSensorBound);
    method("error", this.handleErrorBound);
  }

  /**
   * Handles the MQTT connect event. Initializes sensors and subscribes to their topics.
   *
   * @return {Promise<void>}
   */
  private async handleConnect() {
    this.reconnectAttemps = 0;
    if (Sensor !== undefined) {
      await this.initializeSensorsAndSubscribeToTheirTopic();
      await this.initializeMeasurementTypesMap();
    }
    // Wildcard subscription to catch messages from unknown (undiscovered) sensors
    await this.subscribeTopic("#");
  }

  /**
   * Handles the MQTT disconnect event. Unsubscribes all sensors and attempts to reconnect.
   *
   * @return {Promise<void>}
   */
  private async handleDisconnect() {
    this.removeAllSensorsAndUnsubscribeTheirTopic();
    this.manageEventHandlers("removeListener");
    //console.log("Déconnexion du broker! => TENTATIVE DE RECONNEXION");
    await this.reconnectBroker();
  }

  /**
   * Handles incoming messages from sensors.
   *
   * @param {string} topic - The MQTT topic the message was received on.
   * @param {Buffer} message - The message payload.
   * @return {Promise<void>}
   */
  private async handleMessageReceivedFromSensor(
    topic: string,
    message: Buffer
  ) {
    try {
      // Ignore topics that aren't sensor data topics (e.g. command echoes on /server)
      if (!topic.endsWith(TOPICS.HEARING_THE_SENSOR)) return;

      const messageString = message.toString();
      console.log("🔍 [MQTT] Message reçu:", messageString);

      const parsedMessage = JSON.parse(messageString);

      // Si c'est une réponse à une commande, on l'ignore
      if (parsedMessage.ans) {
        console.log("ℹ️ [MQTT] Message de contrôle ignoré:", parsedMessage.ans);
        return;
      }

      // Si c'est une donnée de capteur (nouveau format avec measures[])
      if (parsedMessage.measures !== undefined) {
        if (!Array.isArray(parsedMessage.measures)) {
          console.warn(
            "⚠️ [MQTT] Format invalide: 'measures' doit être un tableau"
          );
          return;
        }

        const sensorId = this.getSensorIdUsingTopic(topic);

        if (sensorId) {
          try {
            for (const measure of parsedMessage.measures) {
              const idMeasurementType = this.measurementTypesMap.get(
                measure.measureType
              );
              if (!idMeasurementType) {
                console.warn(
                  `⚠️ [MQTT] Type de mesure inconnu: ${measure.measureType}`
                );
                continue;
              }
              await createSensorData(
                sensorId,
                parsedMessage.timestamp,
                parseFloat(measure.value),
                idMeasurementType
              );
              console.log(
                `💾 [DB] Donnée sauvegardée — capteur: ${sensorId}, type: ${measure.measureType}`
              );
            }

            const sensorName = this.getSensorNameUsingTopic(topic);
            if (sensorName) {
              this.socketService?.emitSensorStatus(sensorName, "online");
              clearTimeout(this.sensorTimeouts.get(sensorName));
              const timeout = setTimeout(() => {
                this.socketService?.emitSensorStatus(sensorName, "offline");
              }, 30000);
              this.sensorTimeouts.set(sensorName, timeout);
            }

            // Tentative de publication Kafka (non bloquante)
            try {
              const kafkaService = await KafkaService.getInstance();
              await kafkaService.publishSensorData("sensor-data", {
                sensorId,
                timestamp: parsedMessage.timestamp,
                measures: parsedMessage.measures,
                topic,
              });
              console.log("📨 [Kafka] Donnée publiée avec succès");
            } catch (kafkaError) {
              console.warn(
                "⚠️ [Kafka] Erreur de publication (non bloquante):",
                kafkaError
              );
            }
          } catch (dbError) {
            console.error("❌ [DB] Erreur de sauvegarde:", dbError);
            throw dbError;
          }
        }
      }
      if (parsedMessage.cmd === COMMANDS.PING) {
        // Auto-discover: capteur inconnu détecté
        const suffix = TOPICS.HEARING_THE_SENSOR;
        const baseTopic = topic.slice(0, topic.length - suffix.length);
        const sensorName = this.getSensorNameUsingTopic(topic);
        if (sensorName) {
          this.socketService?.emitSensorStatus(sensorName, "online");
          // Annuler le timer précédent s'il existe
          clearTimeout(this.sensorTimeouts.get(sensorName));
          // Créer un nouveau timer
          const timeout = setTimeout(() => {
            this.socketService?.emitSensorStatus(sensorName, "offline");
          }, 30000);
          this.sensorTimeouts.set(sensorName, timeout);
        } else {
          const existing = this.discoveredTopics.get(baseTopic);
          if (existing) {
            existing.lastSeenAt = new Date();
            existing.count++;
          } else {
            this.discoveredTopics.set(baseTopic, {
              baseTopic,
              firstSeenAt: new Date(),
              lastSeenAt: new Date(),
              count: 1,
            });
            console.log(
              `🔍 [AutoDiscover] Nouveau capteur détecté: ${baseTopic}`
            );
          }
        }
      }
    } catch (error) {
      console.error("❌ [MQTT] Erreur de traitement:", error);
    }
  }

  /**
   * Handles errors from the MQTT client.
   *
   * @param {Error} _error - The error object.
   */
  private handleErrorMqtt(_error: Error) {
    console.error("[MQTT] Erreur:", _error);
    //console.log(error);
    //throw new ServerErrorException(error.message, "mqtt.error");
  }

  // ------------------------ BASIC MQTT METHODS 2 (topic subscription and unsubcription, message publication)

  /**
   * Subscribes to a given MQTT topic.
   *
   * @param {string} topic - The topic to subscribe to.
   * @return {Promise<void>}
   */
  private async subscribeTopic(topic: string): Promise<void> {
    try {
      console.log(
        "🔄 [subscribeTopic] Tentative de souscription au topic:",
        topic
      );
      console.log(
        "📡 [subscribeTopic] État de la connexion MQTT:",
        this.mqttClient?.connected
      );

      if (this.mqttClient?.connected) {
        await new Promise<void>((resolve, reject) => {
          this.mqttClient?.subscribe(topic, (err) => {
            if (err) {
              console.error("❌ [subscribeTopic] Erreur de souscription:", err);
              reject(err);
            } else {
              console.log(
                "✅ [subscribeTopic] Souscription réussie au topic:",
                topic
              );
              resolve();
            }
          });
        });
      }
    } catch (err) {
      console.error("❌ [subscribeTopic] Erreur:", err);
      this.handleErrorMqtt(err as Error);
    }
  }

  /**
   * Unsubscribes from a given MQTT topic.
   *
   * @param {string} topic - The topic to unsubscribe from.
   * @return {Promise<void>}
   */
  private async unsubscribeTopic(topic: string): Promise<void> {
    try {
      if (this.mqttClient?.connected) {
        await new Promise<void>((resolve, reject) => {
          this.mqttClient?.unsubscribe(topic, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
          //console.log(`Server unsubscribed from topic: ${topic}`);
        });
      } else {
        throw new Error(
          "MQTT client is not connected but your are trying to unsubscribe a topic."
        );
      }
    } catch (err) {
      this.handleErrorMqtt(err as Error);
    }
  }

  /**
   * Publishes a message to a given MQTT topic.
   *
   * @param {string} topic - The topic to publish the message to.
   * @param {string} message - The message payload to publish.
   * @return {Promise<void>}
   */
  private async publishMessage(topic: string, message: string): Promise<void> {
    try {
      if (this.mqttClient?.connected) {
        await new Promise<void>((resolve, reject) => {
          this.mqttClient?.publish(topic, message, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
        //console.log(`Server published [topic: ${topic}, Message: ${message}]`);
      } else {
        throw new Error(
          "MQTT client is not connected but your are trying to publish a message."
        );
      }
    } catch (err) {
      this.handleErrorMqtt(err as Error);
    }
  }

  // ----------------------- HANDLE TOPIC DUPLICATION --------------------------
  // [ALL PRIVATE => the controllers does not have to know the topic duplication principle]

  /**
   * Generates the full topic name based on the base topic and the intended recipient.
   *
   * @param {string} topicFromDB - The base topic from the database.
   * @param {string} whoToHearFrom - Identifier of who to hear from (e.g., "sensor" or "server").
   * @return {string} The full topic name.
   */
  private getFullTopicName(topicFromDB: string, whoToHearFrom: string): string {
    return topicFromDB + whoToHearFrom;
  }

  /**
   * Gets the topic for receiving data from the sensor.
   *
   * @param {string} topicFromDB - The base topic from the database.
   * @return {string} The full topic name for receiving sensor data.
   */
  private getTopicForHearingTheSensor(topicFromDB: string): string {
    return this.getFullTopicName(topicFromDB, TOPICS.HEARING_THE_SENSOR);
  }

  /**
   * Gets the topic for sending data to the sensor from the server.
   *
   * @param {string} topicFromDB - The base topic from the database.
   * @return {string} The full topic name for sending data to the sensor.
   */
  private getTopicForHearingTheServer(topicFromDB: string): string {
    return this.getFullTopicName(topicFromDB, TOPICS.HEARING_THE_SERVER);
  }

  /**
   * Gets the topic for receiving data from the sensor on the client side (e.g., web client).
   *
   * @param {string} topicFromDB - The base topic from the database.
   * @return {string} The full topic name for receiving sensor data on the web client.
   */
  public getTopicForHearingTheSensorOnWebClientSide(
    topicFromDB: string
  ): string {
    console.log("🔍 [getTopicForHearingTheSensorOnWebClientSide]", {
      topicFromDB,
      suffix: TOPICS.HEARING_THE_SENSOR,
      result: `${topicFromDB}${TOPICS.HEARING_THE_SENSOR}`,
    });
    return this.getTopicForHearingTheSensor(topicFromDB);
  }

  // ----------------------- MQTT Connector methods usage --------------------------

  /**
   * Subscribes the server to a topic for receiving data from the sensor.
   *
   * @param {string} topicFromDB - The base topic from the database.
   * @return {Promise<void>}
   */
  public async subscribeServer(topicFromDB: string) {
    const fullTopic = this.getTopicForHearingTheSensor(topicFromDB);
    console.log("🔄 [subscribeServer] Souscription au topic:", fullTopic);
    await this.subscribeTopic(fullTopic);
  }

  /**
   * Unsubscribes the server from a topic for receiving data from the sensor.
   *
   * @param {string} topicFromDB - The base topic from the database.
   * @return {Promise<void>}
   */
  public async unsubscribeServer(topicFromDB: string) {
    await this.unsubscribeTopic(
      this.getTopicForHearingTheSensor(topicFromDB) // I do not want anymore to hear
    );
  }

  /**
   * Publishes a message to the sensor.
   *
   * @param {string} topicFromDB - The base topic from the database.
   * @param {string} message - The message payload to send to the sensor.
   * @return {Promise<void>}
   */
  private async publishMessageToSensor(topicFromDB: string, message: string) {
    await this.publishMessage(
      this.getTopicForHearingTheServer(topicFromDB), // I want to SPEAK to sensor, so I talk on my topic knowing it is listening
      message
    );
  }

  /**
   * Publishes a command (e.g., start, stop) to the sensor.
   *
   * @param {string} topicFromDB - The base topic from the database.
   * @param {string} command - The command to send to the sensor.
   * @return {Promise<void>}
   */
  public async publishCommandToSensor(topicFromDB: string, command: string) {
    const timestamp = Date.now() / 1000;
    const message = JSON.stringify({
      [MESSAGE_FIELDS.TIMESTAMP]: timestamp,
      [MESSAGE_FIELDS.CMD]: command,
    });
    await this.publishMessageToSensor(topicFromDB, message);
  }
  // ---------- HANDLE the way the server sends commands to the sensor and the way it received value from the sensors -------------

  /**
   * Sends the start signal to the sensor.
   *
   * @param {string} topicFromDB - The base topic from the database.
   * @return {Promise<void>}
   */
  public async sendStartSignal(topicFromDB: string) {
    console.log(
      "🚀 [sendStartSignal] Envoi du signal START au topic:",
      topicFromDB
    );
    await this.publishCommandToSensor(topicFromDB, COMMANDS.START);
  }

  /**
   * Sends the stop signal to the sensor.
   *
   * @param {string} topicFromDB - The base topic from the database.
   * @return {Promise<void>}
   */
  public async sendStopSignal(topicFromDB: string) {
    await this.publishCommandToSensor(topicFromDB, COMMANDS.STOP);
  }

  /**
   * Sends a ping signal to the sensor and waits for a response.
   *
   * @param {string} topicFromDB - The base topic from the database.
   * @return {Promise<string | false>} A promise that resolves with the response or false if no response is received.
   */
  public async sendPingSignal(topicFromDB: string): Promise<string | false> {
    return new Promise(async (resolve, reject) => {
      let responseReceived: string | null = null;

      // S'assurer d'être souscrit au topic de réponse
      const responseTopic = this.getTopicForHearingTheSensor(topicFromDB);
      await this.subscribeTopic(responseTopic); // Ajoutez cette ligne

      const handleResponse = (response: string) => {
        responseReceived = response;
        cleanup();
        resolve(response);
      };

      const handleError = (err: Error) => {
        cleanup();
        reject(err);
      };

      const handleMessage = async (topic: string, message: Buffer) => {
        const messageString = message.toString();
        try {
          const parsedMessage = JSON.parse(messageString);
          const ans = parsedMessage[MESSAGE_FIELDS.ANS];
          console.log(
            "Expected topic:",
            this.getTopicForHearingTheSensor(topicFromDB)
          ); // Debug log
          console.log("Actual topic:", topic); // Debug log
          console.log("Answer received:", ans); // Debug log

          if (this.getTopicForHearingTheSensor(topicFromDB) === topic) {
            if (ans === RESPONSES.PONG) {
              handleResponse(RESPONSES.PONG);
            } else if (ans === RESPONSES.PONG_PUBLISHING) {
              handleResponse(RESPONSES.PONG_PUBLISHING);
            }
          }
        } catch (error) {
          handleError(error as Error);
        }
      };

      const cleanup = () => {
        if (this.mqttClient) {
          this.mqttClient.removeListener("message", handleMessage);
        }
      };

      if (this.mqttClient) {
        this.mqttClient.once("message", handleMessage);
      }

      try {
        await this.publishCommandToSensor(topicFromDB, COMMANDS.PING);
      } catch (error) {
        handleError(error as Error);
      }

      setTimeout(() => {
        if (!responseReceived) {
          cleanup();
          resolve(false);
        }
      }, 500); // wait for 500 milliseconds
    });
  }

  // ---------- Method for the sensorsMap attribute -------------

  /**
   * Retrieves the sensor ID associated with the given topic.
   *
   * @param {string} topic - The topic associated with the sensor.
   * @return {string | undefined} The sensor ID or undefined if not found.
   */
  private getSensorIdUsingTopic(topic: string): string | undefined {
    const sensor = this.sensorsMap.get(topic);
    return sensor ? sensor.id : undefined;
  }
  private getSensorNameUsingTopic(topic: string): string | undefined {
    const sensor = this.sensorsMap.get(topic);
    return sensor ? sensor.name : undefined;
  }

  /**
   * Adds a sensor to the sensorsMap and subscribes to its topic.
   *
   * @param {SensorOverMqtt} sensor - The sensor to add to the map and subscribe to its topic.
   * @return {Promise<void>}
   */
  private async addInSensorsMapAndSubItsTopic(sensor: SensorOverMqtt) {
    const topicDuplication = this.getTopicForHearingTheSensor(sensor.topic);
    this.sensorsMap.set(topicDuplication, sensor);
    await this.subscribeServer(sensor.topic);
  }

  /**
   * Removes a sensor from the sensorsMap and unsubscribes from its topic.
   *
   * @param {string} topicFromDB - The topic associated with the sensor to remove.
   * @return {Promise<void>}
   */
  private async removeFromSensorsMapAndUnsubItsTopic(topicFromDB: string) {
    const topicDuplication = this.getTopicForHearingTheSensor(topicFromDB);
    this.sensorsMap.delete(topicDuplication);
    await this.unsubscribeServer(topicFromDB);
  }

  /**
   * Removes all sensors from the sensorsMap and unsubscribes from all their topics.
   *
   * @return {Promise<void>}
   */
  private removeAllSensorsAndUnsubscribeTheirTopic() {
    const topics = Array.from(this.sensorsMap.keys());
    topics.forEach(async (topic) => {
      await this.removeFromSensorsMapAndUnsubItsTopic(topic);
    });
  }

  // ----------------------- AUTO-DISCOVER PUBLIC METHODS --------------------------

  public getDiscoveredTopics(): DiscoveredSensorInfo[] {
    return Array.from(this.discoveredTopics.values());
  }

  public removeDiscoveredTopic(baseTopic: string): void {
    this.discoveredTopics.delete(baseTopic);
  }

  public addSensorToSensorsMap(id: string, name: string, topic: string): void {
    const topicDuplication = this.getTopicForHearingTheSensor(topic);
    this.sensorsMap.set(topicDuplication, new SensorOverMqtt(id, name, topic));
  }

  /**
   * Initializes the sensors from the database and subscribes to their topics.
   *
   * @return {Promise<void>}
   */
  private async initializeSensorsAndSubscribeToTheirTopic() {
    // Populate sensorsMap from DB for identification
    // No individual subscriptions needed — wildcard "#" handles all incoming messages
    const sensors = await Sensor.findAll();
    if (sensors !== undefined && sensors.length > 0) {
      sensors.forEach((sensor: SensorType) => {
        const topicDuplication = this.getTopicForHearingTheSensor(sensor.topic);
        this.sensorsMap.set(
          topicDuplication,
          new SensorOverMqtt(sensor.id, sensor.name, sensor.topic)
        );
      });
    }
  }

  private async initializeMeasurementTypesMap() {
    const measurementTypes = await MeasurementType.findAll();
    if (measurementTypes !== undefined && measurementTypes.length > 0) {
      measurementTypes.forEach((mt: any) => {
        this.measurementTypesMap.set(mt.dataValues.name, mt.dataValues.id);
      });
    }
  }
}

export default MqttServer;
