import express from "express";
import {
  createSessionOnClientSide,
  createSessionOnServerSide,
  getAllSessions,
  getSessionById,
  getSessionData,
  deleteSessionAndItsCorrespondingData,
  deleteAllSessions,
  getAllActiveSessions,
} from "@controllers/session";

const router = express.Router();
// Only depends on session model
router.post("/new", createSessionOnClientSide);
router.post("/new/on/server", createSessionOnServerSide);
router.get("/", getAllSessions);
router.get("/active", getAllActiveSessions);
router.get("/:id", getSessionById);
router.delete("/:id", deleteSessionAndItsCorrespondingData);
router.delete("/", deleteAllSessions);
// Depend at least on two models
router.get("/:id/data", getSessionData);

export { router as sessionRoutes };
