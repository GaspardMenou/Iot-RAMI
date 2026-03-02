const components = {
  components: {
    schemas: {
      Sensor: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", description: "Sensor UUID" },
          name: { type: "string", description: "Sensor name" },
          topic: { type: "string", description: "MQTT base topic" },
        },
      },
      SensorCreate: {
        type: "object",
        required: ["name", "topic"],
        properties: {
          name: { type: "string", description: "Sensor name" },
          topic: { type: "string", description: "MQTT base topic" },
        },
      },
      SensorDelete: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
      SensorStatus: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["offline", "publishing"],
            description: "Sensor status based on active session in DB",
          },
        },
      },
      SensorTopic: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Full MQTT topic for this sensor" },
        },
      },
      DiscoveredSensor: {
        type: "object",
        properties: {
          baseTopic: { type: "string", description: "MQTT base topic seen via PING" },
          firstSeenAt: { type: "string", format: "date-time" },
          lastSeenAt: { type: "string", format: "date-time" },
          count: { type: "integer", description: "Number of PING messages received" },
        },
      },
      MeasurementType: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", description: "MeasurementType UUID" },
          name: { type: "string", description: "Measurement type name (e.g. ecg, temperature)" },
        },
      },
      MeasurementTypeCreate: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", description: "Measurement type name" },
        },
      },
      MeasurementTypeDelete: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
      Measurement: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", description: "Measurement UUID" },
          date: { type: "string", format: "date-time", description: "Measurement timestamp (ISO 8601)" },
          value: { type: "number", description: "Measured value" },
          sensor: { type: "string", format: "uuid", description: "Sensor UUID" },
          type: { type: "string", description: "Measurement type name" },
        },
      },
      MeasurementCreate: {
        type: "object",
        required: ["date", "value", "sensor", "type"],
        properties: {
          date: { type: "string", format: "date-time" },
          value: { type: "number" },
          sensor: { type: "string", format: "uuid" },
          type: { type: "string" },
        },
      },
      MeasurementCreateByGroup: {
        type: "object",
        required: ["date", "value", "sensor", "type"],
        properties: {
          date: { type: "string", format: "date-time" },
          value: { type: "number" },
          sensor: { type: "string", format: "uuid" },
          type: { type: "string", format: "uuid", description: "MeasurementType UUID" },
        },
      },
      MeasurementDelete: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
      Session: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", description: "Session UUID" },
          idSensor: { type: "string", format: "uuid", description: "Sensor UUID" },
          startedAt: { type: "string", format: "date-time" },
          endedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", description: "User UUID" },
          email: { type: "string", format: "email" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          dateOfBirth: { type: "string", format: "date" },
          sex: { type: "string", enum: ["male", "female"] },
          role: { type: "string", enum: ["admin", "privileged", "regular"] },
        },
      },
      UserLogin: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          dateOfBirth: { type: "string", format: "date" },
          sex: { type: "string", enum: ["male", "female"] },
          role: { type: "string", enum: ["admin", "privileged", "regular"] },
          token: { type: "string", description: "JWT token" },
          expiresAt: { type: "integer", description: "Token expiry timestamp (ms since epoch)" },
        },
      },
      Error: {
        type: "object",
        properties: {
          message: { type: "string", description: "Human-readable error message" },
          status: { type: "integer", description: "HTTP status code" },
          codeError: { type: "string", description: "Machine-readable error code" },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

export { components };
