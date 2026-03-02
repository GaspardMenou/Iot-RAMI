# sensors-over-mqtt

Code Arduino/ESP32 pour les capteurs du projet RAMI 1.0 (Université de Mons).
Les capteurs se connectent à un broker MQTT (HiveMQ cloud) et publient leurs données vers le backend Node.js.

---

## Structure du dépôt

| Dossier | Description |
|---------|-------------|
| `esp32-mqtt/` | Sketches pour l'ESP32 (ECG AD8232, DHT22, etc.) |
| `sensor_dummy_mqtt/sketch_dec17a/` | Sketch actif — ESP32 + DHT22 (température + humidité) |
| `all-microcontrollers/` | Fichiers communs à tous les microcontrôleurs (`MQTTCommonOperations`) |
| `lora-mqtt/` | Sketches pour les modules LoRa |

---

## Prérequis

### 1. Arduino IDE
Version 2.0 ou supérieure : https://docs.arduino.cc/software/ide-v2/tutorials/getting-started/ide-v2-downloading-and-installing/

### 2. Board ESP32
Dans Arduino IDE → **Outils → Type de carte → Gestionnaire de cartes**, chercher `esp32` et installer le package **ESP32 by Espressif Systems**.
Choisir ensuite le board **ESP32 Dev Module**.

### 3. Librairies à installer
Dans Arduino IDE → **Outils → Gérer les bibliothèques** :

| Librairie | Auteur |
|-----------|--------|
| PubSubClient | Nick O'Leary |
| ArduinoJson | Benoit Blanchon |
| DHT sensor library | Adafruit |
| Adafruit Unified Sensor | Adafruit |
| NTPClient | Fabrice Weinberg |

---

## Format des messages MQTT

### Publication de données (capteur → broker)
Le capteur publie sur `<topic>/sensor` au format multi-mesures :
```json
{
  "timestamp": 1234567890123456,
  "measures": [
    { "measureType": "temperature", "value": 22.5 },
    { "measureType": "humidity",    "value": 58.3 }
  ]
}
```

### PING (capteur → broker)
Envoyé à la connexion et toutes les 20 secondes pour signaler que le capteur est en ligne :
```json
{ "cmd": "ping" }
```

### Commandes reçues (broker → capteur)
Le capteur écoute sur `<topic>/server` :

| Commande | Effet |
|----------|-------|
| `{ "cmd": "ping" }` | Réponse `pong` ou `pong.publishing` |
| `{ "cmd": "start" }` | Commence à publier les données |
| `{ "cmd": "stop" }` | Arrête de publier |

---

## Utiliser un sketch

### Sketch actif : `sensor_dummy_mqtt/sketch_dec17a`
ESP32 + capteur DHT22 (température + humidité), connecté à HiveMQ via TLS.

**Pins DHT22 :**
- Data → pin 17

**Configuration** (`SpecificConstants.cpp`) :
- Renseigner le SSID et mot de passe WiFi
- Le broker HiveMQ et les topics sont déjà configurés

**Compilation :** Le dossier contient déjà tous les fichiers nécessaires (`MQTTCommonOperations.hpp/cpp` + `SpecificConstants.hpp/cpp` + `sketch_dec17a.ino`). Ouvrir directement `sketch_dec17a.ino` dans Arduino IDE.

---

## Conseils généraux

1. **Vérifier les pins** avant de compiler — ils doivent correspondre au câblage physique.
2. **Compiler et flasher** via le bouton ▶ dans Arduino IDE.
3. **Serial Monitor** (bauds : 115200) pour voir les logs en temps réel.
4. **Serial Plotter** pour visualiser les valeurs graphiquement.

> L'ESP32 ne supporte que le WiFi 2.4 GHz. Privilégier un partage de connexion mobile si le réseau local est en 5 GHz.

---

## Problèmes fréquents

### Erreur de port (`Port does not exist`)
```bash
sudo chmod 666 /dev/ttyUSB0   # Linux
```
Sur macOS, vérifier dans **Outils → Port** que le bon port est sélectionné (`/dev/cu.usbserial-...`).

### Flashage qui s'arrête / caractères bizarres dans le monitor
Maintenir les boutons **RST** et **BOOT** au moment où `Connecting...` apparaît dans la console, puis relâcher.

### Absence de Serial (Linux)
```bash
sudo apt install python3 python3-serial
```

### L'ESP32 ne se connecte pas au WiFi
L'ESP32 ne supporte que le **WiFi 2.4 GHz**. Vérifier que le réseau n'est pas en 5 GHz uniquement.
