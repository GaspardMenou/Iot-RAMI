"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Sensors",
      [
        {
          createdAt: "2024-07-01T08:00:00.937Z",
          updatedAt: "2024-07-01T08:00:00.937Z",
          id: "2b8aa6f7-ece8-43cf-a09e-0a41547029fa",
          name: "pysimulator-esp32-ecg",
          topic: "pysimulator-esp32-ecg-topic",
        },
        {
          createdAt: "2024-07-01T08:10:00.937Z",
          updatedAt: "2024-07-01T08:10:00.937Z",
          id: "b978833e-97e1-4e6f-886e-2704d856349a",
          name: "pysimulator-lora-bpm",
          topic: "pysimulator-lora-bpm-topic",
        },
        {
          createdAt: "2024-07-01T08:10:00.937Z",
          updatedAt: "2024-07-01T08:10:00.937Z",
          id: "a978833e-97e1-4e6f-886e-27098798349a",
          name: "esp32-dht22",
          topic: "esp32-dht22-topic",
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Sensors", null, {});
  },
};
