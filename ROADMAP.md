# RAMI 1.0 - Roadmap

## Etat actuel du projet (Fevrier 2026)

### Ce qui fonctionne
- Backend Express/TypeScript avec API REST complete (`/api/v1`)
- Authentification JWT + bcrypt (login, signup, roles admin/operator)
- 9 modeles Sequelize avec migrations et seeds
- MQTT : backend se connecte a Mosquitto local (port 1883), recoit les donnees capteurs, les stocke en DB
- Kafka : le producer publie les donnees capteurs sur le topic `sensor-data` (non-bloquant si Kafka est down)
- Frontend Vue 3 avec session workflow : selection capteur → ping status → start → visualisation graphique ECG
- Frontend se connecte directement au broker MQTT via WebSocket (port 9001) pour le temps reel
- Simulateur Python fonctionnel (mode sensor/server/duo sur HiveMQ ou Mosquitto)
- Docker Compose : PostgreSQL/TimescaleDB, Mosquitto, Kafka, Zookeeper, backend Node.js
- Swagger API docs a `/api/v1/docs`

### Ce qui ne fonctionne pas / est incomplet
- **Kafka consumer** : `KafkaService` n'initialise pas le consumer (pas de `this.consumer = this.kafka.consumer(...)` dans `connectToKafka`), donc `connect()` et `subscribeTopic()` crashent
- **Kafka broker hardcode** : `kafka:9092` dans `kafkaService.ts`, non configurable par env
- **MQTT frontend hardcode** : `ws://localhost:9001/mqtt` dans `useSession.composable.ts` (ne marche qu'en local)
- **Pas de lien Kafka → Frontend** : les donnees passent par MQTT direct, Kafka n'est pas consomme
- **Tests** : couverture minimale, peu de tests d'integration
- **ESP32** : code Arduino existe mais non teste recemment avec le stack actuel (broker passe de HiveMQ a Mosquitto local)

---

## Phase 1 : Stabilisation & Corrections critiques

> Rendre le systeme existant robuste et configurable.

- [ ] **Corriger KafkaService** : ajouter `this.consumer = this.kafka.consumer({ groupId: '...' })` dans `connectToKafka()`
- [ ] **Externaliser les configs hardcodees** :
  - Kafka broker (`kafka:9092`) → variable d'environnement `KAFKA_BROKERS`
  - MQTT frontend (`ws://localhost:9001/mqtt`) → variable d'environnement `VITE_APP_MQTT_URL`
  - MQTT backend broker URL/port/credentials → variables d'environnement (actuellement hardcode dans `mqttConstant.ts`)
- [ ] **Gestion d'erreurs MQTT backend** : la reconnexion existe mais `handleErrorMqtt` est vide — logger les erreurs, implementer un backoff exponentiel
- [ ] **Gestion d'erreurs Kafka** : ajouter un health check, ne pas crash si Kafka est indisponible au demarrage
- [ ] **Verifier le workflow complet** : simulateur Python → Mosquitto → backend → DB → frontend MQTT → graphique ECG
- [ ] **Nettoyer les console.log de debug** dans `mqttServer.ts` et `useSession.composable.ts` (emoji logs partout)

---

## Phase 2 : Pipeline temps reel via WebSocket (alternative a MQTT direct)

> Actuellement le frontend se connecte directement au broker MQTT. C'est fonctionnel mais expose les credentials MQTT au client. L'alternative propre est un WebSocket backend.

- [ ] **Option A (rapide)** : garder la connexion MQTT directe frontend → Mosquitto, mais securiser les credentials (ne pas les retourner en clair dans l'API)
- [ ] **Option B (propre)** : implementer un WebSocket cote backend (Socket.io ou ws) qui relaie les donnees Kafka/MQTT au frontend
  - [ ] Backend : creer un endpoint WebSocket qui ecoute le consumer Kafka et pousse les messages
  - [ ] Frontend : remplacer la connexion MQTT par un client WebSocket
  - [ ] Gerer les etats de connexion (connecte, deconnecte, reconnexion automatique)
- [ ] **Mettre a jour le graphique ECG** pour gerer le streaming avec buffer circulaire (actuellement limite a 100 points)

---

## Phase 3 : Amelioration du frontend

- [ ] **Indicateur de statut capteur temps reel** : actuellement le statut online/offline necessite un clic manuel (ping) — le rendre automatique avec polling ou push
- [ ] **Ameliorer le panneau admin** :
  - CRUD capteurs (ajout/suppression depuis l'interface)
  - Gestion des roles utilisateurs
  - Vue d'ensemble de toutes les sessions actives
- [ ] **Export des donnees** : permettre le telechargement CSV/Excel des donnees historiques d'une session
- [ ] **Validation des formulaires** : ajouter une validation cote client (email, mot de passe, champs requis) avec messages d'erreur clairs
- [ ] **Responsive design** : verifier et corriger l'interface sur mobile/tablette

---

## Phase 4 : Integration hardware ESP32

- [ ] **Mettre a jour la config ESP32** : le broker est passe de HiveMQ (public) a Mosquitto local — adapter `SpecificConstants.cpp` avec l'IP du serveur, port 1883, credentials test/test
- [ ] **Flasher et tester le sketch ECG** (`rami1_esp32_AD8232_ecg`) avec le cablage AD8232
- [ ] **Valider le flux complet** : ESP32 → Mosquitto → Backend → DB → Frontend → graphique ECG
- [ ] **Tester le filtrage haute frequence** (`AvecFiltrage.ino`) et comparer avec le signal brut
- [ ] **Documenter le setup hardware** : branchement, librairies Arduino requises, flash procedure

---

## Phase 5 : Tests & Qualite

- [ ] **Tests backend** :
  - Tests unitaires controllers (auth, sensor, session, measurement)
  - Tests d'integration : MQTT message → DB insertion
  - Tests d'integration : API session workflow (create → start → stop → fetch data)
  - Mock Kafka et MQTT pour les tests
- [ ] **Tests frontend** :
  - Tests des composables (useSession, useSensor, useUser)
  - Tests des composants cles (RealTimeSession, SensorCard, SessionCard)
- [ ] **CI/CD** : valider que le pipeline GitLab lint → build → test → deploy fonctionne
- [ ] **Benchmarks** : mesurer la latence end-to-end (capteur → affichage) et le debit max de messages/seconde

---

## Phase 6 : Documentation & Livraison

- [ ] Mettre a jour les README de chaque sous-projet avec les instructions actuelles
- [ ] Documenter les topics MQTT (format des messages, commandes ping/start/stop, topic duplication `/sensor` et `/server`)
- [ ] Documenter les schemas Kafka (topic `sensor-data`, format JSON)
- [ ] Verifier que le Swagger (`/api/v1/docs`) est a jour avec toutes les routes
- [ ] Rediger le rapport de contribution
- [ ] Preparer la demo (scenario : lancement stack Docker → connexion → simulateur → session → visualisation)

---

## Architecture cible

```
                                    ┌──────────────┐
                                    │   Frontend   │
                                    │   Vue 3      │
                                    │   :8080      │
                                    └──────┬───────┘
                                           │ WebSocket ou MQTT/WS
                                           │
┌──────────┐    MQTT     ┌─────────────────┴───────────────────┐
│  ESP32   │────────────▶│           Backend Express           │
│ AD8232   │  :1883      │              :3000                  │
└──────────┘             │                                     │
                         │  ┌───────────┐    ┌──────────────┐  │
┌──────────┐    MQTT     │  │ MqttServer│───▶│ KafkaService │  │
│Simulateur│────────────▶│  │ singleton │    │  producer    │  │
│ Python   │  :1883      │  └─────┬─────┘    └──────────────┘  │
└──────────┘             │        │                            │
                         │        ▼                            │
                         │  ┌───────────┐                      │
                         │  │ PostgreSQL│                      │
                         │  │TimescaleDB│                      │
                         │  │  :5432    │                      │
                         │  └───────────┘                      │
                         └─────────────────────────────────────┘
                              Mosquitto :1883 / :9001 (WS)
                              Kafka :9092  |  Zookeeper :2181
```

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Hardware | ESP32 + AD8232 (ECG) |
| Protocole IoT | MQTT (Mosquitto local, anciennement HiveMQ) |
| Event streaming | Kafka (KafkaJS) |
| Backend | Node.js, Express, TypeScript, Sequelize |
| Base de donnees | PostgreSQL 13 / TimescaleDB |
| Frontend | Vue 3, TypeScript, Vite, Pinia, Chart.js |
| Auth | JWT + bcrypt |
| Deploiement | Docker, Docker Compose, PM2 |
| CI/CD | GitLab CI |
