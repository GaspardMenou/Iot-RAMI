"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("sensordata", [
      {
        idSensor: "2b8aa6f7-ece8-43cf-a09e-0a41547029fa",
        time: "2024-07-01T10:00:00Z",
        value: 14,
        idMeasurementType: "ab11102a-3aa9-4f50-9055-0c81e69102e5",
      },
      {
        idSensor: "2b8aa6f7-ece8-43cf-a09e-0a41547029fa",
        time: "2024-07-01T10:00:01Z",
        value: 15,
        idMeasurementType: "ab11102a-3aa9-4f50-9055-0c81e69102e5",
      },
      {
        idSensor: "2b8aa6f7-ece8-43cf-a09e-0a41547029fa",
        time: "2024-07-01T10:00:02Z",
        value: 13,
        idMeasurementType: "ab11102a-3aa9-4f50-9055-0c81e69102e5",
      },
      {
        idSensor: "2b8aa6f7-ece8-43cf-a09e-0a41547029fa",
        time: "2024-07-01T10:00:03Z",
        value: 16,
        idMeasurementType: "ab11102a-3aa9-4f50-9055-0c81e69102e5",
      },
      {
        idSensor: "2b8aa6f7-ece8-43cf-a09e-0a41547029fa",
        time: "2024-07-01T10:00:04Z",
        value: 14,
        idMeasurementType: "ab11102a-3aa9-4f50-9055-0c81e69102e5",
      },
      {
        idSensor: "2b8aa6f7-ece8-43cf-a09e-0a41547029fa",
        time: "2024-07-01T10:00:05Z",
        value: 15,
        idMeasurementType: "ab11102a-3aa9-4f50-9055-0c81e69102e5",
      },
      {
        idSensor: "2b8aa6f7-ece8-43cf-a09e-0a41547029fa",
        time: "2024-07-01T10:00:06Z",
        value: 14,
        idMeasurementType: "ab11102a-3aa9-4f50-9055-0c81e69102e5",
      },
      {
        idSensor: "2b8aa6f7-ece8-43cf-a09e-0a41547029fa",
        time: "2024-07-01T10:00:07Z",
        value: 16,
        idMeasurementType: "ab11102a-3aa9-4f50-9055-0c81e69102e5",
      },
      {
        idSensor: "2b8aa6f7-ece8-43cf-a09e-0a41547029fa",
        time: "2024-07-01T10:00:08Z",
        value: 15,
        idMeasurementType: "ab11102a-3aa9-4f50-9055-0c81e69102e5",
      },
      {
        idSensor: "2b8aa6f7-ece8-43cf-a09e-0a41547029fa",
        time: "2024-07-01T10:00:09Z",
        value: 14,
        idMeasurementType: "ab11102a-3aa9-4f50-9055-0c81e69102e5",
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("sensordata", null, {});
  },
};
