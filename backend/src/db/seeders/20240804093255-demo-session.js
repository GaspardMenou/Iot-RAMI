"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Sessions",
      [
        // ---------------- FIRST USER ----------------
        {
          id: "7ff79fe7-d49e-4b66-b809-80e3337b4ddc",
          idSensor: "2b8aa6f7-ece8-43cf-a09e-0a41547029fa",
          createdAt: "2024-07-01T10:00:00",
          endedAt: "2024-07-01T10:01:00",
        },
        {
          id: "a3cd4d9e-1d7c-4275-a50c-6c58eef76773",
          idSensor: "b978833e-97e1-4e6f-886e-2704d856349a",
          createdAt: "2024-07-01T12:00:00",
          endedAt: "2024-07-01T12:01:00",
        },
        {
          id: "5426d194-6a01-4138-9a71-00146a943948",
          idSensor: "b978833e-97e1-4e6f-886e-2704d856349a",
          createdAt: "2024-07-01T14:00:00",
          endedAt: "2024-07-01T14:01:00",
        },
        // ---------------- SECOND USER ----------------
        {
          id: "0365a863-32c2-471e-ae48-d0b852f69f61",
          idSensor: "2b8aa6f7-ece8-43cf-a09e-0a41547029fa",
          createdAt: "2024-07-02T10:00:00",
          endedAt: "2024-07-02T10:01:00",
        },
        {
          id: "3572892d-f070-49a6-a0da-fb8202abe245",
          idSensor: "b978833e-97e1-4e6f-886e-2704d856349a",
          createdAt: "2024-07-02T12:00:00",
          endedAt: "2024-07-02T12:01:00",
        },
        {
          id: "c9bf6996-9d6d-4f80-8f78-1d8571d537f7",
          idSensor: "b978833e-97e1-4e6f-886e-2704d856349a",
          createdAt: "2024-07-02T14:00:00",
          endedAt: "2024-07-02T14:01:00",
        },

        // ---------------- THIRD USER ----------------
        {
          id: "8c1cd0f1-490d-4757-b0bf-169e2100ba15",
          idSensor: "2b8aa6f7-ece8-43cf-a09e-0a41547029fa",
          createdAt: "2024-07-03T10:00:00",
          endedAt: "2024-07-03T10:01:00",
        },
        {
          id: "169f6a3e-6e6b-4053-a859-6926bd4d7eba",
          idSensor: "b978833e-97e1-4e6f-886e-2704d856349a",
          createdAt: "2024-07-03T12:00:00",
          endedAt: "2024-07-03T12:01:00",
        },
        {
          id: "18de00ef-bec0-43ac-a2f4-01a6a65da5d8",
          idSensor: "b978833e-97e1-4e6f-886e-2704d856349a",
          createdAt: "2024-07-03T14:00:00",
          endedAt: "2024-07-03T14:01:00",
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Sessions", null, {});
  },
};
