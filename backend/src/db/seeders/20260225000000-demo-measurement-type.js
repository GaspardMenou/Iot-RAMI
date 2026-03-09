"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("MeasurementTypes", [
      { id: "ab11102a-3aa9-4f50-9055-0c81e69102e5", name: "ecg" },
      { id: "15de12e8-d2da-4a2f-9f37-17fad8622f22", name: "temperature" },
      { id: "a06f3a9b-41de-4828-a19c-1802ba1dfbd4", name: "humidity" },
      { id: "d1c9b8e7-5a3c-4f0e-9b1a-2f8e5c6a7f33", name: "pressure" },
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkTruncate("MeasurementTypes");
  },
};
