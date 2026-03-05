# Kafka — Topic et schemas de messages

## Configuration

| Parametre         | Variable d'environnement | Valeur par defaut |
|-------------------|--------------------------|-------------------|
| Broker            | `KAFKA_BROKERS`          | `localhost:9092`  |
| Client Fog        | `clientId`               | `fog-service`     |
| Client Backend    | `clientId`               | `sensor-app`      |
| Group consommateur| `groupId`                | `sensor-group`    |

---

## Topic unique : `sensor-data`

Tout le flux de donnees capteur transite par un seul topic Kafka : **`sensor-data`**.

Le fog-service est **producteur** (publie les messages).
Le backend cloud est **consommateur** (recoit et traite les messages).

---

## Schemas de messages

Chaque message est serialise en JSON. Trois types existent, discrimines par le champ `type`.

### Type `start` — Debut de session

Publie par le fog quand le capteur envoie la commande `start`.
Le backend cree une nouvelle session en base de donnees.

```json
{
  "type": "start",
  "sensorTopic": "esp32-dht22-topic/sensor",
  "timestamp": 1735000000000
}
```

| Champ         | Type     | Description                                      |
|---------------|----------|--------------------------------------------------|
| `type`        | `string` | Toujours `"start"`                               |
| `sensorTopic` | `string` | Topic MQTT complet du capteur (avec `/sensor`)   |
| `timestamp`   | `number` | Epoch Unix en millisecondes                      |

---

### Type `data` — Donnees de mesure

Publie par le fog a intervalles reguliers (flush toutes les 1 seconde ou apres 10 entrees).
Le backend stocke les donnees en base (TimescaleDB) et les envoie aux clients WebSocket connectes.

```json
{
  "type": "data",
  "sensorTopic": "esp32-dht22-topic/sensor",
  "measures": [
    {
      "timestamp": 1735000001000,
      "measures": [
        { "measureType": "temperature", "value": 23.5 },
        { "measureType": "humidity",    "value": 61.2 }
      ]
    },
    {
      "timestamp": 1735000002000,
      "measures": [
        { "measureType": "temperature", "value": 23.7 },
        { "measureType": "humidity",    "value": 60.8 }
      ]
    }
  ]
}
```

| Champ                       | Type       | Description                                      |
|-----------------------------|------------|--------------------------------------------------|
| `type`                      | `string`   | Toujours `"data"`                                |
| `sensorTopic`               | `string`   | Topic MQTT complet du capteur                    |
| `measures`                  | `array`    | Tableau d'entrees de mesure (batch)              |
| `measures[].timestamp`      | `number`   | Epoch Unix en millisecondes                      |
| `measures[].measures`       | `array`    | Tableau de paires type/valeur                    |
| `measures[].measures[].measureType` | `string` | Nom du type de mesure (`ecg`, `temperature`, `humidity`) |
| `measures[].measures[].value`       | `number` | Valeur numerique de la mesure               |

---

### Type `stop` — Fin de session

Publie par le fog quand le capteur envoie la commande `stop` ou quand le timeout de 30 secondes expire (plus de ping).
Le backend cloture la session en base (`endedAt` mis a jour).

```json
{
  "type": "stop",
  "sensorTopic": "esp32-dht22-topic/sensor",
  "timestamp": 1735000060000
}
```

| Champ         | Type     | Description                                      |
|---------------|----------|--------------------------------------------------|
| `type`        | `string` | Toujours `"stop"`                                |
| `sensorTopic` | `string` | Topic MQTT complet du capteur (avec `/sensor`)   |
| `timestamp`   | `number` | Epoch Unix en millisecondes                      |

---

## Flux de traitement cote backend

```
Kafka topic "sensor-data"
        |
        v
  KafkaService.startConsuming()
        |
        +-- type "start" --> handleSessionStart()
        |     - Recherche du capteur en DB (par baseTopic)
        |     - Cree Session { idSensor, idFog: "fog-service", createdAt }
        |     - Enregistre sensorTopic → sessionId dans activeSessions
        |
        +-- type "data"  --> handleSensorData()
        |     - Recupere sessionId depuis activeSessions
        |     - Cree SensorData { time, idSensor, idMeasurementType, value }
        |     - Diffuse via WebSocket (sendDataToRoom)
        |
        +-- type "stop"  --> handleSessionStop()
              - Recupere sessionId depuis activeSessions
              - Met a jour Session { endedAt }
              - Supprime sensorTopic de activeSessions
```

---

## Strategie de retry (backend)

Si Kafka est indisponible au demarrage, le backend retente avec un backoff exponentiel :

- Max retries : 10
- Delai initial : 1 seconde
- Delai max : 30 secondes
- Formule : `min(2^n * 1000ms, 30000ms)`

Apres 10 echecs, le backend demarre sans Kafka (mode degrade).
