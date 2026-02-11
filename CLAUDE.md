# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RAMI 1.0 is an IoT sensor management system (University of Mons) for capturing, processing, and visualizing real-time ECG data. The stack: ESP32 hardware → MQTT (HiveMQ) → Node.js/Express backend → Kafka → PostgreSQL/TimescaleDB → Vue 3 frontend.

## Repository Structure

| Directory | Description |
|-----------|-------------|
| `umons-sensor-backend-1-feature-RAMI1-dev/` | Express/TypeScript REST API (port 3000) |
| `umons-sensor-frontend-1-feature-RAMI1-dev/` | Vue 3 + Vite SPA (port 8080) |
| `python-simulator-over-mqtt-master/` | Python MQTT sensor simulator |
| `sensors-over-mqtt-master/` | Arduino/ESP32 hardware sketches |

## Development Commands

### Backend (`umons-sensor-backend-1-feature-RAMI1-dev/`)
```bash
npm install
npm run dev                    # Start dev server with nodemon (port 3000)
npm run test                   # Run Jest tests (--runInBand)
npm run test:coverage          # Run tests with coverage report
npm run format                 # ESLint --fix
npm run docker:build           # Build Docker image (needs NODE_ENV)
npm run docker:start           # docker compose up -d
npm run docker:init-db         # Run Sequelize migrations + seeds
npm run migrate                # sequelize-cli db:migrate
npm run seed                   # sequelize-cli db:seed:all
```

### Frontend (`umons-sensor-frontend-1-feature-RAMI1-dev/`)
```bash
npm install
VITE_APP_ENV=dev npm run dev   # Start Vite dev server (port 8080)
npm run build                  # Type-check + production build
npm run test                   # Vitest with jsdom
npm run test:coverage          # Tests with coverage
npm run lint                   # ESLint --fix
```

### Python Simulator (`python-simulator-over-mqtt-master/`)
```bash
pip install -r requirements.txt
python3 ./mqttCliApp.py sensor hivemq   # Simulate ECG sensor publishing
python3 ./mqttCliApp.py server hivemq   # Simulate server receiving
python3 ./mqttCliApp.py duo hivemq      # Both in one terminal
```

## Architecture

### Data Flow
```
ESP32/Simulator → MQTT (HiveMQ broker) → Backend mqttServer.ts → Kafka → PostgreSQL/TimescaleDB
                                                                          ↓
                                                        Frontend (REST polling) ← Backend API
```

### Backend Architecture (Express + TypeScript)
- **Controllers** (`src/controllers/`): Auth, user, sensor, session, measurement, sensorData
- **Services** (`src/service/`): `mqttServer.ts` (singleton MQTT client), `kafkaService.ts` (Kafka producer/consumer)
- **Models** (`src/db/models/`): User, Sensor, Measurement, MeasurementType, Session, SensorData (hypertable), UserSensor, UserSensorRequest, UserMeasurementTypeRequest
- **Routes**: All under `/api/v1`, Swagger docs at `/api/v1/docs`
- **Auth**: JWT tokens + bcrypt, middleware in `src/middlewares/auth.ts`
- **Path aliases**: `@/*`, `@controllers/*`, `@db/*`, `@models/*` (configured in tsconfig)

### Frontend Architecture (Vue 3 + Pinia)
- **Composables** (`src/composables/`): `useUser`, `useSession`, `useSensor`, `useMeasurement`, `useChart`, `useAxios` — these are the main business logic layer
- **Stores** (`src/stores/`): Pinia stores for shared state
- **Router**: Auth guards with `requiresAuth` meta, role-based access (admin/operator)
- **Charts**: Chart.js via `vue-chartjs` for ECG visualization
- **API base URL**: Set via `VITE_APP_BACK_URL` env variable

### MQTT Topics
- Main sensor topic: `pysimulator-esp32-ecg-topic`
- Broker config and commands defined in `src/utils/mqttConstant.ts` (backend)

## Docker Compose Stack

Services defined in `umons-sensor-backend-1-feature-RAMI1-dev/docker-compose.yml`:
- **node-backend**: Express API (port 3000)
- **node-db**: TimescaleDB/PostgreSQL 13 (port 5432)
- **mosquitto**: Eclipse Mosquitto MQTT broker (ports 1883, 9001)
- **kafka**: Confluent Kafka (port 9092)
- **zookeeper**: Kafka coordination (port 2181)

## Environment Setup

### Backend `.env.development`
Key variables: `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT_OUT`, `NODE_ENV`, `NODE_PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`

### Frontend `.env.dev`
Key variables: `VITE_APP_BACK_URL` (e.g., `http://localhost:3000/api/v1`), `VITE_APP_TITLE`, `VITE_APP_ENV`

### Test Credentials (from seed data)
- Email: `adriano@ig.umons.ac.be` / Password: `adriano@ig.umons.ac.be`

## Known Architectural Gaps

- **No WebSocket streaming**: Frontend polls REST endpoints instead of receiving real-time data via WebSocket (see ROADMAP.md Phase 3)
- **Hardcoded Kafka broker**: `kafka:9092` in kafkaService.ts is not configurable via env
- **MQTT in frontend**: `mqtt` package is installed but not fully integrated for direct browser-to-broker communication

## CI/CD

Both backend and frontend have GitLab CI pipelines (`.gitlab-ci.yml`) with stages: lint → build → test → pages (coverage) → build-images → deploy.
