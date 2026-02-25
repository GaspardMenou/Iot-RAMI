import { Request, Response } from "express";
import {
  BadRequestException,
  NotFoundException,
  ServerErrorException,
} from "@utils/exceptions";
import MqttServer from "@service/mqttServer";
import {
  deleteSensorDataWithinTimeRange,
  getSensorDataWithinTimeRange,
} from "@controllers/sensorData";

// Model import
import db from "@db/index";
const DB: any = db;
const { User, Sensor, Session } = DB;
// --- end of model import

/** ============================ PLEASE READ THIS PART IN ORDER TO UNDERSTAND THE SESSION MODEL MANAGEMENT ============================
The session model represents the interval of use of a sensor between t1 and t2 by a person. A session is valid
ON THE SERVER SIDE only if the user started it and then stopped it ON THE BROWSER SIDE. And this is where we can write it into the database.
So, as long as the session is not stopped on the browser side, it is not saved in DB

So, DO NOT CONFUSE the createSessionOnClientSide and createSessionOnServerSide functions
-  1) createSessionOnClientSide:
Opens a session on the client side with mqtt over wesocket and we ask the sensor to send data. It also gives the topic so that the client
can subscribe to it on the browser side.
- 2) createSessionOnServerSide:
Here, we ask the sensor to stop sending values and we validate the session after the user has closed it on the browser side, see above!!!!
*/

// -------------------------------------------- CHECK AND UTILITY FONCTIONS --------------------------------------------

const isUuid = (uuid: string) => {
  const uuidRegex = new RegExp(
    "^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$",
    "i"
  );
  return uuidRegex.test(uuid);
};

const handleDealingWithSensorDataError = (res: Response, error: unknown) => {
  if (error instanceof BadRequestException) {
    return res
      .status(400)
      .json({ error: error.message, code: error.codeError });
  } else if (error instanceof ServerErrorException) {
    return res
      .status(500)
      .json({ error: error.message, code: error.codeError });
  } else {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// ----------------------------------------- CONTROLLER FUNCTIONS ---------------------------------------------

// revue
const createSessionOnClientSide = async (req: Request, res: Response) => {
  const { idUser, idSensor } = req.body;

  if (!isUuid(idUser)) {
    return res
      .status(400)
      .json(new BadRequestException("user id is not uuid", "user.id.not.uuid"));
  }

  if (!isUuid(idSensor)) {
    return res
      .status(400)
      .json(
        new BadRequestException("sensor id is not uuid", "sensor.id.not.uuid")
      );
  }

  try {
    // Vérifier que l'utilisateur existe
    const user = await User.findByPk(idUser);
    if (!user) {
      return res
        .status(404)
        .json(new BadRequestException("User not found", "user.not.found"));
    }

    // Vérifier que le capteur existe
    const sensor = await Sensor.findByPk(idSensor);
    if (!sensor) {
      return res
        .status(404)
        .json(new NotFoundException("Sensor not found", "sensor.not.found"));
    }

    // ================== CREATION DE SESSION
    const topicFromDB = sensor.topic;

    const mqttServerInstance: MqttServer = await MqttServer.getInstance();

    const topicForHearingFromSensor =
      mqttServerInstance.getTopicForHearingTheSensorOnWebClientSide(
        topicFromDB
      );
    const endedAt = null;
    await mqttServerInstance.sendStartSignal(topicFromDB);
    const session = await Session.create({
      idUser,
      idSensor,
      createdAt: new Date(),
      endedAt,
    });
    return res.status(201).json({
      topic: topicForHearingFromSensor,
      sessionId: session.id,
    }); // Send the topic to the user so that he can subscribe to the channel
  } catch (error) {
    console.error("❌ [createSessionOnClientSide]", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const createSessionOnServerSide = async (req: Request, res: Response) => {
  const { idUser, idSensor, createdAt, endedAt } = req.body;

  if (!isUuid(idUser)) {
    return res
      .status(400)
      .json(new BadRequestException("user id is not uuid", "user.id.not.uuid"));
  }

  try {
    // Vérifier que l'utilisateur existe
    const user = await User.findByPk(idUser);
    if (!user) {
      return res
        .status(404)
        .json(new BadRequestException("User not found", "user.not.found"));
    }

    // Vérifier que le capteur existe
    const sensor = await Sensor.findByPk(idSensor);
    if (!sensor) {
      return res
        .status(404)
        .json(new NotFoundException("Sensor not found", "sensor.not.found"));
    }

    // ================== CREATION DE SESSION

    const mqttServerInstance: MqttServer = await MqttServer.getInstance();
    await mqttServerInstance.sendStopSignal(sensor.topic);

    await Session.update(
      {
        endedAt: new Date(),
      },
      {
        where: {
          id: req.body.idSession,
        },
      }
    );

    return res.status(201).json({ message: "session ended" });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get all sessions
const getAllSessions = async (_: Request, res: Response) => {
  try {
    const sessions = await Session.findAll();
    return res.status(200).json(sessions);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get all active sessions
const getAllActiveSessions = async (_: Request, res: Response) => {
  try {
    const sessions = await Session.findAll({
      where: {
        endedAt: null, // Assuming that an active session has a null endedAt
      },
    });
    return res.status(200).json(sessions);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get session by ID
const getSessionById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    // Let's find out the session
    const session = await Session.findByPk(id);

    if (!session) {
      return res
        .status(404)
        .json(new NotFoundException("Session not found", "session.not.found"));
    }

    return res.status(200).json(session);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete session
const deleteSessionAndItsCorrespondingData = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id;
    // Let's find out the session
    const session = await Session.findByPk(id);

    if (!session) {
      return res
        .status(404)
        .json(new NotFoundException("Session not found", "session.not.found"));
    }

    const sensor = await Sensor.findByPk(session.idSensor);
    if (!sensor) {
      return res
        .status(404)
        .json(new NotFoundException("Sensor not found", "sensor.not.found"));
    }

    const deletedRowsNumber = await deleteSensorDataWithinTimeRange(
      session.idSensor
    );

    //await session.destroy();
    return res.status(200).json({ deletedRowsNumber: deletedRowsNumber });
  } catch (error) {
    return handleDealingWithSensorDataError(res, error);
  }
};

const deleteAllSessions = async (_: Request, res: Response) => {
  try {
    await Session.destroy({ where: {} });
    return res.status(204).end();
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getSessionData = async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log("🔍 getSessionData called with id:", id); // Nouveau log
  try {
    // Let's find out the session
    const session = await Session.findByPk(id);

    if (!session) {
      return res
        .status(404)
        .json(new NotFoundException("Session not found", "session.not.found"));
    }

    // Vérifier que le capteur existe
    const sensor = await Sensor.findByPk(session.idSensor);
    if (!sensor) {
      return res
        .status(404)
        .json(new NotFoundException("Sensor not found", "sensor.not.found"));
    }

    // Utilisation des données du capteur
    const sensorData = await getSensorDataWithinTimeRange(
      sensor.dataValues.id,
      session.dataValues.createdAt,
      session.dataValues.endedAt
    );

    return res.status(200).json(sensorData);
  } catch (error) {
    return handleDealingWithSensorDataError(res, error);
  }
};

// Prevents CSV injection: values starting with formula chars are prefixed with a single quote
const sanitizeCsvField = (value: string): string => {
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
};

const exportSessionAsCsv = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const session = await Session.findByPk(id);
    if (!session) {
      return res
        .status(404)
        .json(new NotFoundException("Session not found", "session.not.found"));
    }
    const sensor = await Sensor.findByPk(session.idSensor);
    if (!sensor) {
      return res
        .status(404)
        .json(new NotFoundException("Sensor not found", "sensor.not.found"));
    }
    const sensorData = await getSensorDataWithinTimeRange(
      sensor.dataValues.id,
      session.dataValues.createdAt,
      session.dataValues.endedAt
    );
    const lines: string[] = [
      `# session_id,${session.dataValues.id}`,
      `# sensor_id,${sensor.dataValues.id}`,
      `# sensor_name,${sanitizeCsvField(sensor.dataValues.name)}`,
      `# sensor_topic,${sanitizeCsvField(sensor.dataValues.topic)}`,
      `# start_time,${new Date(session.dataValues.createdAt).toISOString()}`,
      `# end_time,${
        session.dataValues.endedAt
          ? new Date(session.dataValues.endedAt).toISOString()
          : ""
      }`,
      `time,value`,
      ...sensorData.map(
        (row: any) => `${new Date(row.time).toISOString()},${row.value}`
      ),
    ];
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="session-${id}.csv"`
    );
    return res.status(200).send(lines.join("\n"));
  } catch (error) {
    return handleDealingWithSensorDataError(res, error);
  }
};

export {
  createSessionOnClientSide,
  createSessionOnServerSide,
  getAllSessions,
  getSessionById,
  getSessionData,
  exportSessionAsCsv,
  deleteSessionAndItsCorrespondingData,
  deleteAllSessions,
  getAllActiveSessions,
};
