# RAMI 1.0 — Système de gestion de capteurs IoT

Projet de l'Université de Mons (UMONS) — Capture, traitement et visualisation de données de capteurs IoT en temps réel (ECG, température, humidité).

---

## Architecture globale

```
ESP32 / Simulateur Python
        │
        │ MQTT (HiveMQ cloud, TLS 8883)
        ▼
  Backend Node.js  ──── Kafka ────► TimescaleDB (PostgreSQL)
        │                                    │
        │ WebSocket (Socket.io)              │ REST API
        ▼                                    ▼
  Frontend Vue 3  ◄───────────────────────────
```

**Flux de données :**
1. Le capteur ESP32 publie ses mesures en MQTT sur HiveMQ
2. Le backend reçoit les messages MQTT et les pousse dans Kafka
3. Kafka consomme les messages et les stocke dans TimescaleDB
4. Le frontend reçoit les données en temps réel via WebSocket (Socket.io)

---

## Structure du dépôt

| Dossier | Description | Port |
|---------|-------------|------|
| `umons-sensor-backend-1-feature-RAMI1-dev/` | API REST Express/TypeScript | 3000 |
| `umons-sensor-frontend-1-feature-RAMI1-dev/` | SPA Vue 3 + Vite | 8080 |
| `python-simulator-over-mqtt-master/` | Simulateur de capteur MQTT (Python) | — |
| `sensors-over-mqtt-master/` | Code Arduino/ESP32 | — |
| `sensor_dummy_mqtt/` | Sketch actif ESP32 + DHT22 | — |

---

## Démarrage rapide

### 1. Backend (API + base de données)
```bash
cd umons-sensor-backend-1-feature-RAMI1-dev
npm install
npm run docker:start        # Lance TimescaleDB, Kafka, Mosquitto via Docker
npm run docker:init-db      # Migrations + seeders (première fois)
npm run dev                 # Démarre le serveur sur :3000
```

### 2. Frontend
```bash
cd umons-sensor-frontend-1-feature-RAMI1-dev
npm install
VITE_APP_ENV=dev npm run dev   # Démarre sur :8080
```

### 3. Simulateur Python (optionnel, si pas d'ESP32)
```bash
cd python-simulator-over-mqtt-master
pip install -r requirements.txt
python3 ./mqttCliApp.py duo hivemq   # Simule capteur + serveur
```

---

## Comptes de test (seed)

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| `adriano@ig.umons.ac.be` | `adriano@ig.umons.ac.be` | Admin |

---

## Documentation

- API Swagger : http://localhost:3000/api/v1/docs
- README Backend : [`umons-sensor-backend-1-feature-RAMI1-dev/README.md`](./umons-sensor-backend-1-feature-RAMI1-dev/README.md)
- README Frontend : [`umons-sensor-frontend-1-feature-RAMI1-dev/README.md`](./umons-sensor-frontend-1-feature-RAMI1-dev/README.md)
- README ESP32/Arduino : [`sensors-over-mqtt-master/README.md`](./sensors-over-mqtt-master/README.md)

---

## CI/CD

Pipeline GitHub Actions : lint → test → docker build → push vers GHCR → déploiement auto via Watchtower sur VM.
Image Docker : `ghcr.io/thegasp16/iot-rami`
