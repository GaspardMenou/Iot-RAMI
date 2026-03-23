import { TOPICS, COMMANDS, MESSAGE_FIELDS, BUFFER_CONFIG } from "../constants";

// --- Mocks MQTT ---
const mqttPublish = jest.fn();
const mqttSubscribe = jest.fn();
const mqttOn = jest.fn();

jest.mock("mqtt", () => ({
  connect: jest.fn(() => ({
    on: mqttOn,
    publish: mqttPublish,
    subscribe: mqttSubscribe,
  })),
}));

// --- Mock KafkaService (singleton) ---
const publishBatchSensorData = jest.fn().mockResolvedValue(undefined);

jest.mock("../kafkaProducer", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn().mockResolvedValue({ publishBatchSensorData }),
  },
}));

// Import APRES les mocks
import MqttFog from "../mqttFog";

// Helper : crée une instance de MqttFog sans passer par getInstance()
// (qui appellerait connectBroker + KafkaService.getInstance sur le singleton).
// On bypasse le constructeur privé via le prototype.
function createFogInstance(): any {
  const instance = Object.create((MqttFog as any).prototype);
  instance.mqttClient = { on: jest.fn(), publish: mqttPublish, subscribe: mqttSubscribe };
  instance.kafkaService = { publishBatchSensorData };
  instance.buffer = new Map();
  instance.flushIntervalMs = BUFFER_CONFIG.flushIntervalMs;
  instance.flushMaxSize = BUFFER_CONFIG.flushMaxSize;
  instance.maxBufferSize = BUFFER_CONFIG.maxBufferSize;
  instance.sessionMaxDurationMs = BUFFER_CONFIG.sessionMaxDurationMs;
  instance.dropWarnedTopics = new Set();
  instance.sensorTimeouts = new Map();
  instance.sessionTimers = new Map();
  instance.flushInterval = undefined;
  return instance;
}

// Helper : construit un Buffer MQTT à partir d'un objet
function makeMsg(payload: Record<string, unknown>): Buffer {
  return Buffer.from(JSON.stringify(payload));
}

describe("MqttFog — handleMessageReceivedFromSensor (routing)", () => {
  let fog: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    fog = createFogInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("ignore les topics qui ne se terminent pas par /sensor", () => {
    const spy = jest.spyOn(fog, "handleStart" in fog ? "handleStart" : "startSession");
    fog.handleMessageReceivedFromSensor("capteur-A/server", makeMsg({ [MESSAGE_FIELDS.CMD]: COMMANDS.START }));
    expect(publishBatchSensorData).not.toHaveBeenCalled();
  });

  it("route PING vers handlePing", () => {
    const spy = jest.spyOn(fog, "handlePing");
    fog.handleMessageReceivedFromSensor("capteur-A/sensor", makeMsg({ [MESSAGE_FIELDS.CMD]: COMMANDS.PING }));
    expect(spy).toHaveBeenCalledWith("capteur-A/sensor");
  });

  it("route STOP vers handleStop", async () => {
    fog.buffer.set("capteur-A/sensor", []);
    const spy = jest.spyOn(fog, "handleStop").mockResolvedValue(undefined);
    fog.handleMessageReceivedFromSensor("capteur-A/sensor", makeMsg({ [MESSAGE_FIELDS.CMD]: COMMANDS.STOP }));
    await Promise.resolve();
    expect(spy).toHaveBeenCalledWith("capteur-A/sensor");
  });

  it("ne crashe pas sur JSON invalide", () => {
    expect(() =>
      fog.handleMessageReceivedFromSensor("capteur-A/sensor", Buffer.from("not-json"))
    ).not.toThrow();
  });
});

describe("MqttFog — startSession", () => {
  let fog: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    fog = createFogInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("initialise le buffer pour le topic", async () => {
    await fog.startSession("capteur-A/sensor");
    expect(fog.buffer.has("capteur-A/sensor")).toBe(true);
  });

  it("publie un message Kafka de type 'start'", async () => {
    await fog.startSession("capteur-A/sensor");
    expect(publishBatchSensorData).toHaveBeenCalledWith(
      "sensor-data",
      expect.arrayContaining([
        expect.objectContaining({ type: "start", sensorTopic: "capteur-A/sensor" }),
      ])
    );
  });

  it("enregistre un sessionTimer", async () => {
    await fog.startSession("capteur-A/sensor");
    expect(fog.sessionTimers.has("capteur-A/sensor")).toBe(true);
  });

  it("annule l'ancien timer avant d'en créer un nouveau (appel multiple)", async () => {
    await fog.startSession("capteur-A/sensor");
    const firstTimer = fog.sessionTimers.get("capteur-A/sensor");
    publishBatchSensorData.mockClear();
    await fog.startSession("capteur-A/sensor");
    const secondTimer = fog.sessionTimers.get("capteur-A/sensor");
    // Le second timer doit être différent (réenregistrement)
    expect(secondTimer).not.toBe(firstTimer);
  });
});

describe("MqttFog — handleStart", () => {
  let fog: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    fog = createFogInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("publie START Kafka et envoie ACK MQTT", async () => {
    await fog.handleStart("capteur-A/sensor");
    expect(publishBatchSensorData).toHaveBeenCalledWith(
      "sensor-data",
      expect.arrayContaining([expect.objectContaining({ type: "start" })])
    );
    expect(mqttPublish).toHaveBeenCalledWith(
      "capteur-A/server",
      JSON.stringify({ [MESSAGE_FIELDS.ANS]: COMMANDS.ACK })
    );
  });

  it("démarre le timer de rotation", async () => {
    await fog.handleStart("capteur-A/sensor");
    expect(fog.sessionTimers.has("capteur-A/sensor")).toBe(true);
  });
});

describe("MqttFog — rotation de session (timer)", () => {
  let fog: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Pas de faux timers globaux ici : on les active/désactive manuellement
    fog = createFogInstance();
    fog.sessionMaxDurationMs = 100; // très court pour les vrais timers
  });

  afterEach(() => {
    // Nettoyer les vrais timers résiduels
    fog.sessionTimers.forEach((t: NodeJS.Timeout) => clearTimeout(t));
    fog.sessionTimers.clear();
    fog.sensorTimeouts.forEach((t: NodeJS.Timeout) => clearTimeout(t));
    fog.sensorTimeouts.clear();
  });

  it("déclenche STOP puis START Kafka après sessionMaxDurationMs", async () => {
    // Après le premier cycle, remplacer startSession par un no-op pour couper la récursivité
    const origStartSession = fog.startSession.bind(fog);
    let callCount = 0;
    fog.startSession = async (topic: string) => {
      callCount++;
      if (callCount === 1) return origStartSession(topic);
      // Rotation : juste publier le START, sans recréer de timer
      await publishBatchSensorData("sensor-data", [
        { type: "start", sensorTopic: topic, timestamp: Date.now() },
      ]);
    };

    await fog.handleStart("capteur-A/sensor");
    publishBatchSensorData.mockClear();

    // Attendre l'expiration naturelle du timer (100ms + marge)
    await new Promise<void>((resolve) => setTimeout(resolve, 250));

    const calls = publishBatchSensorData.mock.calls;
    const stopCall = calls.find((c: any[]) =>
      c[1]?.some?.((m: any) => m.type === "stop")
    );
    const startCall = calls.find((c: any[]) =>
      c[1]?.some?.((m: any) => m.type === "start")
    );
    expect(stopCall).toBeDefined();
    expect(startCall).toBeDefined();
  }, 5000);

  it("le nouveau timer est enregistré après la rotation", async () => {
    const origStartSession = fog.startSession.bind(fog);
    let callCount = 0;
    fog.startSession = async (topic: string) => {
      callCount++;
      if (callCount === 1) return origStartSession(topic);
      // Rotation : enregistrer un nouveau timer non-récursif dans la map
      fog.buffer.set(topic, []);
      await publishBatchSensorData("sensor-data", [
        { type: "start", sensorTopic: topic, timestamp: Date.now() },
      ]);
      const timer = setTimeout(() => {}, 999999);
      fog.sessionTimers.set(topic, timer);
    };

    await fog.handleStart("capteur-A/sensor");
    const timerBefore = fog.sessionTimers.get("capteur-A/sensor");

    await new Promise<void>((resolve) => setTimeout(resolve, 250));

    expect(fog.sessionTimers.has("capteur-A/sensor")).toBe(true);
    const timerAfter = fog.sessionTimers.get("capteur-A/sensor");
    expect(timerAfter).not.toBe(timerBefore);
  }, 5000);
});

describe("MqttFog — handleStop", () => {
  let fog: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    fog = createFogInstance();
    fog.sessionMaxDurationMs = 1000;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("publie STOP Kafka et vide le buffer", async () => {
    fog.buffer.set("capteur-A/sensor", [{ measures: [], timestamp: 1 }]);
    await fog.handleStop("capteur-A/sensor");
    expect(publishBatchSensorData).toHaveBeenCalledWith(
      "sensor-data",
      expect.arrayContaining([expect.objectContaining({ type: "stop" })])
    );
    expect(fog.buffer.has("capteur-A/sensor")).toBe(false);
  });

  it("annule le sessionTimer — pas de rotation après handleStop manuel", async () => {
    await fog.handleStart("capteur-A/sensor");
    publishBatchSensorData.mockClear();

    // Stop manuel avant l'expiration du timer
    await fog.handleStop("capteur-A/sensor");

    // Avancer le temps : le timer annulé ne doit plus rien déclencher
    jest.advanceTimersByTime(2000);
    await Promise.resolve();

    // Aucun nouveau START ne doit être publié
    const startCalls = publishBatchSensorData.mock.calls.filter((c: any[]) =>
      c[1]?.some?.((m: any) => m.type === "start")
    );
    expect(startCalls).toHaveLength(0);
  });

  it("supprime le sessionTimer de la map", async () => {
    await fog.handleStart("capteur-A/sensor");
    await fog.handleStop("capteur-A/sensor");
    expect(fog.sessionTimers.has("capteur-A/sensor")).toBe(false);
  });
});

describe("MqttFog — handleMeasurement", () => {
  let fog: any;

  beforeEach(() => {
    jest.clearAllMocks();
    fog = createFogInstance();
  });

  it("ajoute les données au buffer si la session est active", () => {
    fog.buffer.set("capteur-A/sensor", []);
    fog.handleMeasurement("capteur-A/sensor", { measures: [{ type: "ecg", value: 42 }], timestamp: 1 });
    expect(fog.buffer.get("capteur-A/sensor")).toHaveLength(1);
  });

  it("ignore les mesures sans session active (pas de buffer)", () => {
    fog.handleMeasurement("capteur-A/sensor", { measures: [], timestamp: 1 });
    expect(fog.buffer.has("capteur-A/sensor")).toBe(false);
  });

  it("droppe les mesures si le buffer est plein", () => {
    fog.maxBufferSize = 2;
    fog.buffer.set("capteur-A/sensor", [{ a: 1 }, { a: 2 }]);
    fog.handleMeasurement("capteur-A/sensor", { measures: [], timestamp: 1 });
    expect(fog.buffer.get("capteur-A/sensor")).toHaveLength(2);
  });

  it("route MEASURES via handleMessageReceivedFromSensor", () => {
    fog.buffer.set("capteur-A/sensor", []);
    const spy = jest.spyOn(fog, "handleMeasurement");
    fog.handleMessageReceivedFromSensor(
      "capteur-A/sensor",
      makeMsg({ [MESSAGE_FIELDS.MEASURES]: [{ type: "temp", value: 22 }], [MESSAGE_FIELDS.TIMESTAMP]: 1 })
    );
    expect(spy).toHaveBeenCalled();
    expect(fog.buffer.get("capteur-A/sensor")).toHaveLength(1);
  });
});

describe("MqttFog — handlePing", () => {
  let fog: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    fog = createFogInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("enregistre un sensorTimeout", () => {
    fog.handlePing("capteur-A/sensor");
    expect(fog.sensorTimeouts.has("capteur-A/sensor")).toBe(true);
  });

  it("réinitialise le timeout à chaque PING (pas d'accumulation)", () => {
    fog.handlePing("capteur-A/sensor");
    const t1 = fog.sensorTimeouts.get("capteur-A/sensor");
    fog.handlePing("capteur-A/sensor");
    const t2 = fog.sensorTimeouts.get("capteur-A/sensor");
    expect(t2).not.toBe(t1);
  });

  it("appelle handleStop après 30s sans PING si session active", async () => {
    fog.buffer.set("capteur-A/sensor", []);
    const spy = jest.spyOn(fog, "handleStop").mockResolvedValue(undefined);
    fog.handlePing("capteur-A/sensor");
    jest.advanceTimersByTime(30000);
    await Promise.resolve();
    expect(spy).toHaveBeenCalledWith("capteur-A/sensor");
  });

  it("ne déclenche pas handleStop si aucune session active après 30s", async () => {
    const spy = jest.spyOn(fog, "handleStop").mockResolvedValue(undefined);
    fog.handlePing("capteur-A/sensor");
    jest.advanceTimersByTime(30000);
    await Promise.resolve();
    expect(spy).not.toHaveBeenCalled();
  });
});
