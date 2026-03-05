# RAMI 1.0 - Roadmap

## Etat du projet (Mars 2026)

Le projet est complet. Toutes les phases ont ete livrees.

---

## Phase 1 : Stabilisation & Corrections critiques ✅

- [x] **Corriger KafkaService** : consumer initialise dans `connectToKafka()`
- [x] **Externaliser les configs hardcodees** : `KAFKA_BROKERS`, `MQTT_URL/PORT/USERNAME/PASSWORD` via variables d'environnement
- [x] **Gestion d'erreurs MQTT backend** : `handleErrorMqtt` avec logging + backoff exponentiel
- [x] **Gestion d'erreurs Kafka** : health check, demarrage en mode degrade si Kafka indisponible
- [x] **Verifier le workflow complet** : simulateur → Mosquitto → backend → DB → frontend → graphique

---

## Phase 2 : Pipeline temps reel via WebSocket ✅

- [x] **WebSocket securise** : Socket.io cote backend, JWT verifie sur `join-session`, rooms par topic
- [x] **Frontend** : `connectToWebSocket` remplace `connectToMQTT`, ecoute `new-data`
- [x] **Credentials MQTT retires** : ne sont plus envoyes au frontend
- [x] **Graphique multi-mesures** : datasets dynamiques par `measureType`

---

## Phase 3 : Amelioration du frontend ✅

- [x] **Validation des formulaires** : regles complexite mot de passe, messages d'erreur clairs
- [x] **Indicateur statut capteur** : badge online/offline temps reel via WebSocket + timeout 30s
- [x] **Panel admin** : CRUD capteurs, gestion roles, sessions actives
- [x] **Export CSV** : route `GET /sessions/:id/export/csv`, bouton dans l'interface, protection injection CSV
- [x] **Responsive design**
- [x] **Auto-decouverte capteurs** : fog ecoute wildcard `#`, route `GET /sensors/discovered`
- [x] **Multi-mesures** : format `{ timestamp, measures: [{ measureType, value }] }`, clé primaire composite

---

## Phase 4 : Integration hardware & Architecture fog/cloud ✅

- [x] **Sketches Arduino** : DHT22 + ECG AD8232, format multi-mesures, PING periodique, portail captif WiFiManager
- [x] **Structure modulaire Arduino** : `Sensor.hpp/cpp` (capteur) / `MQTTCommonOperations` (generique) / `BASE.ino`
- [x] **Fog-service** : Node.js sur Raspberry Pi, bridge MQTT → Kafka, buffer + flush 1s/10 entrees
- [x] **Protocole fog** : PING → START → ACK → mesures → STOP, timeout 30s declenche STOP automatique
- [x] **Sessions fog-driven** : fog cree/clot les sessions via Kafka, frontend en mode lecture seule
- [x] **Auto-join session active** : frontend detecte et rejoint une session active au montage
- [x] **Deploiement VM cloud** : docker-compose, Watchtower, CI/CD GitHub Actions → GHCR
- [x] **Deploiement fog Pi** : compose.yaml, Mosquitto authentifie, install.sh, mDNS `rami-fog.local`
- [x] **Simulateur Python** : protocole fog complet, arguments CLI, Ctrl+C propre

---

## Phase 5 : Tests & Qualite ✅

- [x] **Backend** : 348 tests Jest (controllers, middlewares, services — MQTT mock, Kafka mock, Socket.io mock)
- [x] **Frontend** : 137 tests Vitest (composables, stores Pinia, helpers)
- [x] **CI/CD GitHub Actions** : lint → test → docker build → push GHCR

---

## Phase 6 : Documentation & Livraison ✅

- [x] **READMEs** : racine, backend, frontend, fog-service, simulateur Python — mis a jour
- [x] **docs/MQTT.md** : topics, protocole complet, formats de messages
- [x] **docs/KAFKA.md** : topic `sensor-data`, schemas des 3 types de messages
- [x] **docs/API.md** : toutes les routes REST + WebSocket Socket.io
- [x] **docs/DEMO.md** : scenario de demonstration pas a pas
- [x] **docs/RAPPORT.md** : rapport de contribution du stage
- [x] **Swagger** : corrections et routes manquantes ajoutees

---

## Architecture finale

```
ESP32 / Simulateur Python
        |
        | MQTT ({topic}/sensor)
        v
Fog-service (Raspberry Pi)
  - Mosquitto local (port 1883, authentifie)
  - fog-service Node.js
      Ecoute MQTT wildcard #
      Bufferise les mesures (flush 1s ou 10 entrees)
      Publie sur Kafka en batch
        |
        | Kafka topic: sensor-data (start / data / stop)
        v
Backend Cloud (VM x86, port 3000)
  - Express + TypeScript
  - KafkaService (consumer)
  - SocketService (Socket.io)
        |---> PostgreSQL / TimescaleDB
        |---> WebSocket (Socket.io) ---> Frontend Vue 3 (port 8080)
                                           - Graphique temps reel
                                           - Panel admin
                                           - Export CSV
```

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Hardware | ESP32 + DHT22 (temp/hum) / AD8232 (ECG) |
| Protocole IoT | MQTT (Mosquitto local, authentifie) |
| Noeud fog | Node.js + KafkaJS producer (Raspberry Pi) |
| Event streaming | Kafka (KafkaJS) |
| Backend | Node.js, Express, TypeScript, Sequelize |
| Base de donnees | PostgreSQL 13 / TimescaleDB |
| Frontend | Vue 3, TypeScript, Vite, Pinia, Chart.js, Socket.io client |
| Auth | JWT + bcrypt |
| Deploiement | Docker, Docker Compose, Watchtower |
| CI/CD | GitHub Actions → GHCR |
