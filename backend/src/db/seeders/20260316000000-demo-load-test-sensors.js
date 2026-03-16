"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const sensors = Array.from({ length: 1000 }, (_, i) => ({
      id: uuidv4(),
      name: `load-test-sensor-${i}`,
      topic: `load-test-${i}-topic`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await queryInterface.bulkInsert("Sensors", sensors, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "Sensors",
      { name: { [Sequelize.Op.like]: "load-test-sensor-%" } },
      {}
    );
  },
};
