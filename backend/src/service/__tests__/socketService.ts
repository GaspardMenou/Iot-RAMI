import { createServer } from "http";
import SocketService from "@service/socketService";
import db from "@db/index";
import KafkaService from "@service/kafkaService";

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock("@db/index", () => ({
  Sensor: { findAll: jest.fn() },
  Session: { create: jest.fn(), update: jest.fn() },
  MeasurementType: { findAll: jest.fn() },
  sensordata: { bulkCreate: jest.fn() },
}));

jest.mock("@service/kafkaService", () => ({
  __esModule: true,
  default: { getInstance: jest.fn() },
}));

// ── Helpers ────────────────────────────────────────────────────────────────

const makeSensorRow = (topic: string) => ({
  dataValues: { id: "sensor-uuid", name: "sensor1", topic },
});

const sensorRow = makeSensorRow("test/topic");

const sessionRow = {
  dataValues: { id: "session-uuid" },
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe("SocketService", () => {
  let service: SocketService;

  beforeEach(() => {
    service = new SocketService(createServer());
    jest.clearAllMocks();
    // Reset internal state between tests
    (service as any).activeSessions = new Map();
    (service as any).sessionCreationInProgress = new Set();
    (service as any).measurementTypesMap = new Map();
    (service as any).kafkaRetryCount = 0;
    (service as any).measurementTypesCacheTime = null;
    (service as any).sensorTopicCache = new Map();
    (service as any).sensorCacheTime = null;
  });

  // ── handleSessionStart ───────────────────────────────────────────────────

  describe("handleSessionStart", () => {
    it("creates a session when sensor is found", async () => {
      (db.Sensor.findAll as jest.Mock).mockResolvedValue([sensorRow]);
      (db.Session.create as jest.Mock).mockResolvedValue(sessionRow);

      await (service as any).handleSessionStart({
        type: "start",
        sensorTopic: "test/topic/sensor",
        timestamp: Date.now(),
      });

      expect(db.Session.create).toHaveBeenCalledTimes(1);
      expect((service as any).activeSessions.get("test/topic/sensor")).toBe(
        "session-uuid"
      );
    });

    it("skips creation when sensor is not found", async () => {
      (db.Sensor.findAll as jest.Mock).mockResolvedValue([]);

      await (service as any).handleSessionStart({
        type: "start",
        sensorTopic: "unknown/sensor",
        timestamp: Date.now(),
      });

      expect(db.Session.create).not.toHaveBeenCalled();
    });

    it("prevents duplicate sessions when two START messages arrive concurrently for the same topic", async () => {
      // Use a manually-controlled Promise to simulate DB latency.
      // Both calls enter handleSessionStart before the first one completes,
      // which is exactly the race condition the guard defends against.
      let resolveFindAll!: (val: unknown) => void;
      const findAllPromise = new Promise((resolve) => {
        resolveFindAll = resolve;
      });
      (db.Sensor.findAll as jest.Mock).mockReturnValue(findAllPromise);
      (db.Session.create as jest.Mock).mockResolvedValue(sessionRow);

      const payload = {
        type: "start" as const,
        sensorTopic: "test/topic/sensor",
        timestamp: Date.now(),
      };

      // Fire both calls before the DB responds
      const p1 = (service as any).handleSessionStart(payload);
      const p2 = (service as any).handleSessionStart(payload);

      // Now let the DB respond
      resolveFindAll([sensorRow]);

      await Promise.all([p1, p2]);

      expect(db.Session.create).toHaveBeenCalledTimes(1);
    });

    it("allows a new session for a different topic to proceed in parallel", async () => {
      (db.Sensor.findAll as jest.Mock).mockResolvedValue([
        makeSensorRow("topic-a"),
        makeSensorRow("topic-b"),
      ]);
      (db.Session.create as jest.Mock).mockResolvedValue(sessionRow);

      await Promise.all([
        (service as any).handleSessionStart({
          type: "start",
          sensorTopic: "topic-a/sensor",
          timestamp: Date.now(),
        }),
        (service as any).handleSessionStart({
          type: "start",
          sensorTopic: "topic-b/sensor",
          timestamp: Date.now(),
        }),
      ]);

      expect(db.Session.create).toHaveBeenCalledTimes(2);
    });

    it("skips if a session already exists for the topic", async () => {
      (service as any).activeSessions.set(
        "test/topic/sensor",
        "existing-session"
      );

      await (service as any).handleSessionStart({
        type: "start",
        sensorTopic: "test/topic/sensor",
        timestamp: Date.now(),
      });

      expect(db.Sensor.findAll).not.toHaveBeenCalled();
      expect(db.Session.create).not.toHaveBeenCalled();
    });
  });

  // ── handleSessionStop ────────────────────────────────────────────────────

  describe("handleSessionStop", () => {
    it("closes the session and removes it from the active map", async () => {
      (service as any).activeSessions.set("test/topic/sensor", "session-uuid");
      (db.Session.update as jest.Mock).mockResolvedValue([1]);

      await (service as any).handleSessionStop({
        type: "stop",
        sensorTopic: "test/topic/sensor",
        timestamp: Date.now(),
      });

      expect(db.Session.update).toHaveBeenCalledWith(
        { endedAt: expect.any(Date) },
        { where: { id: "session-uuid" } }
      );
      expect((service as any).activeSessions.has("test/topic/sensor")).toBe(
        false
      );
    });

    it("does nothing when there is no active session for the topic", async () => {
      await (service as any).handleSessionStop({
        type: "stop",
        sensorTopic: "no-session/sensor",
        timestamp: Date.now(),
      });

      expect(db.Session.update).not.toHaveBeenCalled();
    });
  });

  describe("getMeasurementTypesMap", () => {
    it("ne recharge pas le cache si le TTL n'est pas expiré", async () => {
      (db.MeasurementType.findAll as jest.Mock).mockResolvedValue([
        { dataValues: { name: "ecg", id: "type-uuid" } },
      ]);

      await (service as any).getMeasurementTypesMap();
      await (service as any).getMeasurementTypesMap();

      expect(db.MeasurementType.findAll).toHaveBeenCalledTimes(1);
    });

    it("recharge le cache si le TTL est expiré", async () => {
      (db.MeasurementType.findAll as jest.Mock).mockResolvedValue([
        { dataValues: { name: "ecg", id: "type-uuid" } },
      ]);

      await (service as any).getMeasurementTypesMap();

      (service as any).measurementTypesCacheTime = new Date(
        Date.now() - 300100
      );

      await (service as any).getMeasurementTypesMap();

      expect(db.MeasurementType.findAll).toHaveBeenCalledTimes(2);
    });
  });

  // ── startKafkaConsumer ───────────────────────────────────────────────────

  describe("startKafkaConsumer", () => {
    it("stops retrying after KAFKA_MAX_RETRIES attempts and does not throw", async () => {
      (KafkaService.getInstance as jest.Mock).mockRejectedValue(
        new Error("Kafka unavailable")
      );

      // Replace setTimeout so retries execute without real delays
      const setTimeoutSpy = jest
        .spyOn(global, "setTimeout")
        .mockImplementation((fn) => {
          (fn as () => void)();
          return 0 as unknown as NodeJS.Timeout;
        });

      await service.startKafkaConsumer();

      // 1 initial attempt + KAFKA_MAX_RETRIES (10) retries = 11 total
      expect(KafkaService.getInstance).toHaveBeenCalledTimes(11);

      setTimeoutSpy.mockRestore();
    });

    it("resets retry count on success", async () => {
      const kafkaMock = {
        registerTopic: jest.fn(),
        startConsuming: jest.fn().mockResolvedValue(undefined),
      };
      (KafkaService.getInstance as jest.Mock).mockResolvedValue(kafkaMock);

      await service.startKafkaConsumer();

      expect((service as any).kafkaRetryCount).toBe(0);
    });
  });
});
