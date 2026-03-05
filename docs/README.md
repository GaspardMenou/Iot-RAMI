# Documentation technique — RAMI 1.0

| Document       | Description                                                    |
|----------------|----------------------------------------------------------------|
| [MQTT.md](./MQTT.md)   | Topics MQTT, protocole capteur/fog, format des messages |
| [KAFKA.md](./KAFKA.md) | Topic Kafka `sensor-data`, schemas des 3 types de messages (`start`, `data`, `stop`) |
| [API.md](./API.md)     | Reference complete de l'API REST + WebSocket Socket.io  |
| [DEMO.md](./DEMO.md)   | Scenario de demonstration pas a pas                     |
| [RAPPORT.md](./RAPPORT.md) | Rapport de contribution du stage                    |

## Architecture en bref

```
Capteur/Simulateur
    |
    | MQTT ({topic}/sensor)
    v
Fog-service (Mosquitto local)
    |
    | Kafka (sensor-data)
    v
Backend Cloud (Express :3000)
    |----> PostgreSQL/TimescaleDB
    |----> WebSocket (Socket.io) --> Frontend Vue 3 (:8080)
```

Voir aussi : [ROADMAP.md](../ROADMAP.md) pour l'historique des phases du projet.
