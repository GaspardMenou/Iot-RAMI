import express from "express";
import {
  createSensor,
  deleteSensor,
  getSensor,
  updateSensor,
  getSensorSessions,
  getSensorTopic,
  getDiscoveredSensors,
  getSensorStatus,
} from "@controllers/sensor";
//import { auth, authAdmin } from "@middlewares/auth";

const router = express.Router();

// Must be before /:id? to avoid being caught as an id param
router.get("/discovered", getDiscoveredSensors);
router.get("/connexion/online/:sensorName", getSensorStatus);

router
  .route("/:id?")
  .post(createSensor) // authAdmin
  .get(getSensor) //auth pour le reste
  .put(updateSensor)
  .delete(deleteSensor);
// Depend at least on two models
router.get("/:id/sessions", getSensorSessions);
router.get("/:id/topic", getSensorTopic);

export { router as sensorRoutes };
