# API REST — Reference

Base URL : `http://<host>:3000/api/v1`

Documentation interactive Swagger disponible sur : `GET /api/v1/docs`

## Authentification

La plupart des routes protegees utilisent un token JWT transmis dans le header :

```
Authorization: Bearer <token>
```

Les routes marquees **[auth]** requierent un token valide. Les routes marquees **[admin]** requierent un role `admin`.

---

## Auth

| Methode | Route        | Auth | Description               |
|---------|--------------|------|---------------------------|
| `POST`  | `/auth`      | auth | Verification du token JWT |

---

## Utilisateurs — `/users`

| Methode  | Route                                       | Auth   | Description                                      |
|----------|---------------------------------------------|--------|--------------------------------------------------|
| `POST`   | `/users/login`                              | -      | Connexion, retourne un JWT                       |
| `POST`   | `/users/signup`                             | -      | Creation de compte                               |
| `PUT`    | `/users/update`                             | auth   | Mise a jour des informations utilisateur         |
| `PUT`    | `/users/update/role`                        | auth   | Mise a jour du role                              |
| `GET`    | `/users/verify/adminPanel`                  | auth   | Verifie si l'utilisateur a acces au panel admin  |
| `GET`    | `/users/all`                                | auth   | Liste tous les utilisateurs (roles)              |
| `GET`    | `/users/:id/sessions`                       | -      | Sessions d'un utilisateur                        |
| `GET`    | `/users/:id/sessions/on/sensor/:idSensor`   | -      | Sessions d'un utilisateur sur un capteur donne   |

### Acces aux capteurs

| Methode  | Route                          | Auth   | Description                                      |
|----------|--------------------------------|--------|--------------------------------------------------|
| `POST`   | `/users/sensors/access`        | auth   | Donne acces a un capteur a un utilisateur        |
| `DELETE` | `/users/sensors/access`        | auth   | Retire l'acces a un capteur                      |
| `GET`    | `/users/sensors/access`        | admin  | Liste tous les acces capteurs                    |
| `POST`   | `/users/sensors/access/ask`    | auth   | Demande d'acces a un capteur existant            |
| `POST`   | `/users/sensors/creation/ask`  | auth   | Demande de creation d'un nouveau capteur         |
| `GET`    | `/users/sensors/creation`      | admin  | Liste les demandes de creation en attente        |
| `POST`   | `/users/sensors/creation`      | admin  | Approuve une demande de creation de capteur      |

### Types de mesures

| Methode  | Route                                   | Auth   | Description                                      |
|----------|-----------------------------------------|--------|--------------------------------------------------|
| `POST`   | `/users/measurementTypes/creation/ask`  | auth   | Demande de creation d'un type de mesure          |
| `GET`    | `/users/measurementTypes/creation`      | admin  | Liste les demandes de types de mesures           |
| `POST`   | `/users/measurementTypes/creation`      | admin  | Approuve la creation d'un type de mesure         |

---

## Capteurs — `/sensors`

| Methode  | Route                              | Auth  | Description                                         |
|----------|------------------------------------|-------|-----------------------------------------------------|
| `GET`    | `/sensors`                         | auth  | Liste tous les capteurs (admin) ou ceux de l'utilisateur |
| `POST`   | `/sensors`                         | admin | Cree un nouveau capteur                             |
| `GET`    | `/sensors/:id`                     | auth  | Recupere un capteur par ID                          |
| `PUT`    | `/sensors/:id`                     | auth  | Met a jour un capteur                               |
| `DELETE` | `/sensors/:id`                     | auth  | Supprime un capteur                                 |
| `GET`    | `/sensors/:id/sessions`            | -     | Liste les sessions d'un capteur                     |
| `GET`    | `/sensors/:id/topic`               | -     | Retourne le topic MQTT d'un capteur                 |
| `GET`    | `/sensors/discovered`              | -     | Liste les topics detectes mais non enregistres      |
| `GET`    | `/sensors/connexion/online/:name`  | -     | Statut en ligne d'un capteur (`publishing`/`offline`) |

### Schema capteur

```json
{
  "id": "uuid",
  "name": "ESP32-DHT22",
  "topic": "esp32-dht22-topic"
}
```

---

## Sessions — `/sessions`

| Methode  | Route                     | Auth | Description                                           |
|----------|---------------------------|------|-------------------------------------------------------|
| `GET`    | `/sessions`               | -    | Liste toutes les sessions                             |
| `GET`    | `/sessions/active`        | -    | Liste les sessions en cours (`endedAt` = null)        |
| `POST`   | `/sessions/new`           | -    | Cree une session et retourne le topic + sessionId     |
| `POST`   | `/sessions/new/on/server` | -    | Cloture une session (met `endedAt`)                   |
| `GET`    | `/sessions/:id`           | -    | Recupere une session par ID                           |
| `DELETE` | `/sessions/:id`           | -    | Supprime une session et ses donnees                   |
| `DELETE` | `/sessions`               | -    | Supprime toutes les sessions                          |
| `GET`    | `/sessions/:id/data`      | -    | Retourne les donnees de mesure de la session          |
| `GET`    | `/sessions/:id/export/csv`| -    | Exporte les donnees de la session en CSV              |

### Schema session

```json
{
  "id": "uuid",
  "idSensor": "uuid",
  "idFog": "fog-service",
  "createdAt": "2026-01-01T10:00:00.000Z",
  "endedAt": "2026-01-01T10:30:00.000Z"
}
```

`endedAt` vaut `null` si la session est en cours.

### Format CSV exporte

```csv
# session_id,<uuid>
# sensor_id,<uuid>
# sensor_name,ESP32-DHT22
# sensor_topic,esp32-dht22-topic
# start_time,2026-01-01T10:00:00.000Z
# end_time,2026-01-01T10:30:00.000Z
time,value,type
2026-01-01T10:00:01.000Z,23.5,temperature
2026-01-01T10:00:01.000Z,61.2,humidity
```

---

## Types de mesures — `/measurementTypes`

| Methode  | Route                    | Auth | Description                               |
|----------|--------------------------|------|-------------------------------------------|
| `GET`    | `/measurementTypes`      | -    | Liste tous les types de mesures           |
| `GET`    | `/measurementTypes/:id`  | -    | Recupere un type par ID                   |
| `POST`   | `/measurementTypes`      | -    | Cree un type de mesure                    |
| `PUT`    | `/measurementTypes/:id`  | -    | Met a jour un type de mesure              |
| `DELETE` | `/measurementTypes/:id`  | -    | Supprime un type de mesure                |

Types predefinis (seed) : `ecg`, `temperature`, `humidity`.

### Schema type de mesure

```json
{
  "id": "uuid",
  "name": "temperature"
}
```

---

## Mesures — `/measurements`

| Methode  | Route                 | Auth | Description                               |
|----------|-----------------------|------|-------------------------------------------|
| `GET`    | `/measurements`       | -    | Liste toutes les mesures                  |
| `GET`    | `/measurements/:id`   | -    | Recupere une mesure par ID                |
| `POST`   | `/measurements`       | -    | Cree une mesure                           |
| `POST`   | `/measurements/bulk`  | -    | Cree plusieurs mesures en lot             |
| `PUT`    | `/measurements/:id`   | -    | Met a jour une mesure                     |
| `DELETE` | `/measurements/:id`   | -    | Supprime une mesure                       |

---

## WebSocket — Socket.io

Le backend expose un serveur Socket.io sur le meme port que l'API REST (port 3000).

### Connexion et authentification

A la connexion, le client doit s'abonner a un topic de session :

```js
socket.emit("join-session", {
  token: "<JWT>",
  topic: "esp32-dht22-topic/sensor"
});
```

Le serveur verifie le JWT. En cas de succes, il repond :

```js
socket.on("joined", ({ topic }) => { /* topic confirme */ });
```

En cas de token invalide, la connexion est fermee immediatement.

### Reception des donnees en temps reel

Une fois abonne, le client recoit les messages Kafka de type `data` :

```js
socket.on("new-data", (data) => {
  // data = { type: "data", sensorTopic, measures: [...] }
});
```

### Statut des capteurs

Ecoutable depuis n'importe quel client connecte (pas de room) :

```js
socket.on("sensor-status", ({ sensorName, status }) => {
  // status = "online" | "offline" | "publishing"
});
```
