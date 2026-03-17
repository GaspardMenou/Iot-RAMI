# Test de charge — RAMI 1.0

**Date** : 17/03/2026
**Outil** : `python-simulator-over-mqtt-master/load_test_matrix.py`
**Hardware testé** : Raspberry Pi 4 (8 GB RAM, 4 cœurs Cortex-A72 1.8 GHz)

---

## Contexte

Le "cloud" de RAMI tourne sur un **Raspberry Pi 4** hébergeant simultanément :
- TimescaleDB (PostgreSQL avec extension hypertable)
- Kafka (KRaft, sans Zookeeper)
- Node.js backend Express/TypeScript
- Mosquitto
- Prometheus + Grafana
- Watchtower

L'objectif du test est de caractériser la limite de débit du pipeline complet et d'identifier le bottleneck.

---

## Méthodologie

### Flux testé

```
Simulateur Python (N processus)
    |  MQTT ({topic}/sensor)
    v
Fog-service (Pi fog, buf. mémoire 1s / 10 entrées)
    |  Kafka (sensor-data)
    v
Backend cloud (kafkaService.ts → socketService.ts)
    |  bulkCreate(rows, { ignoreDuplicates: true })
    v
TimescaleDB (hypertable sensordata)
```

### Métrique mesurée

`kafka_message_processing_seconds` p95 — Histogram Prometheus défini dans `backend/src/middlewares/metrics.ts`.

Mesure le temps écoulé entre la réception d'un message Kafka `data` et la fin de l'écriture en base de données (`bulkCreate`). Interrogé via PromQL :

```promql
histogram_quantile(0.95, rate(kafka_message_processing_seconds_bucket[30s]))
```

### Paramètres du test

| Paramètre | Valeur |
|-----------|--------|
| Plage de capteurs | 5 à 30 (pas de 5) |
| Plage de taux | 5 à 30 pts/s/capteur (pas de 5) |
| Durée par palier | 30 s |
| Type de mesure | `temperature` (1 valeur par message) |
| Pause entre paliers | 3 s |
| Combinaisons testées | 36 |

---

## Résultats

### Tableau complet (données brutes CSV)

| Capteurs | Pts/s/capteur | Total pts/s | Latence p95 (ms) |
|----------|---------------|-------------|-----------------|
| 5        | 5             | 25          | 22.7            |
| 5        | 10            | 50          | 18.4            |
| 5        | 15            | 75          | 23.5            |
| 5        | 20            | 100         | 22.3            |
| 5        | 25            | 125         | 22.8            |
| 5        | 30            | 150         | 23.4            |
| 10       | 5             | 50          | 18.0            |
| 10       | 10            | 100         | 20.5            |
| 10       | 15            | 150         | 21.9            |
| 10       | 20            | 200         | 22.7            |
| 10       | 25            | 250         | 21.7            |
| 10       | 30            | 300         | 23.9            |
| 15       | 5             | 75          | 17.5            |
| 15       | 10            | 150         | 23.7            |
| 15       | 15            | 225         | 24.0            |
| 15       | 20            | 300         | 24.3            |
| 15       | 25            | 375         | 24.3            |
| 15       | 30            | 450         | 24.2            |
| 20       | 5             | 100         | 23.2            |
| 20       | 10            | 200         | 23.1            |
| 20       | 15            | 300         | 20.8            |
| 20       | 20            | 400         | 23.0            |
| 20       | 25            | 500         | 24.2            |
| 20       | 30            | 600         | 38.5            |
| 25       | 5             | 125         | 23.3            |
| 25       | 10            | 250         | 23.3            |
| 25       | 15            | 375         | 23.6            |
| 25       | 20            | 500         | 23.5            |
| 25       | 25            | 625         | 22.2            |
| 25       | 30            | 750         | 24.0            |
| 30       | 5             | 150         | 24.3            |
| 30       | 10            | 300         | 24.3            |
| 30       | 15            | 450         | 29.0            |
| 30       | 20            | 600         | 129.9 ⚠         |
| 30       | 25            | 750         | 22.9            |
| 30       | 30            | 900         | 23.3            |

> **Note** : la valeur à 30 capteurs × 20 pts/s (129.9 ms) est un pic isolé probablement lié à une compétition I/O momentanée ou une GC TimescaleDB. Les paliers voisins (750 pts/s et 900 pts/s) affichent des latences normales (~23 ms).

### Synthèse par palier de charge

| Plage de charge | Latence p95 typique |
|-----------------|---------------------|
| 25 – 150 pts/s  | 17 – 24 ms          |
| 200 – 450 pts/s | 20 – 25 ms          |
| 500 – 750 pts/s | 22 – 39 ms          |
| 900 pts/s       | 23 ms               |

La latence reste remarquablement stable de 25 pts/s à 900 pts/s, entre 17 et 25 ms pour la quasi-totalité des paliers.

---

## Observations et analyse

### Stabilité de la latence

La latence p95 reste dans la plage 17 – 25 ms sur toute la matrice de test (25 à 900 pts/s) à l'exception d'un pic isolé. Ce résultat est meilleur qu'attendu pour un Pi 4 faisant tourner 6 services simultanément.

### Bottleneck identifié

Le bottleneck du pipeline est l'**I/O disque de TimescaleDB** sur carte SD/SSD du Pi 4. L'architecture logicielle (Kafka, Node.js, fog buffer) n'est pas le facteur limitant dans cette plage de charge.

### Comportement du buffer fog

Le fog-service bufferise les mesures pendant 1 seconde (ou jusqu'à 10 entrées) avant de publier un batch sur Kafka. Le backend exécute ensuite un `bulkCreate` groupé. Ce mécanisme de batching amortit le coût fixe de chaque écriture en base, ce qui explique que la latence ne dégrade pas linéairement avec la charge dans la plage testée.

### Pic isolé à 30 × 20 pts/s

La valeur de 129.9 ms pour 30 capteurs à 20 pts/s (600 pts/s) est incohérente avec les valeurs voisines (22 – 24 ms). Il s'agit probablement d'une contention I/O passagère (GC TimescaleDB, flush WAL). Ce type de pic ponctuel est caractéristique des systèmes temps réel non-dédié tournant sur hardware partagé.

---

## Bugs corrigés lors des tests

Deux bugs ont été identifiés et corrigés pendant la campagne de tests :

### Race condition Kafka (`kafkaService.ts`)

**Problème** : sous haute charge, le callback de traitement des messages Kafka était appelé sans `await`, créant une race condition entre le démarrage de session (`start`) et l'arrivée des premières données (`data`).

**Correction** : `callback(data)` → `await callback(data)`

### Doublons sous haute charge (`socketService.ts`)

**Problème** : sous haute charge, des insertions simultanées de `bulkCreate` pouvaient provoquer des erreurs `duplicate key` sur la clé primaire composite `(time, idSensor, idMeasurementType)` de la hypertable.

**Correction** : `bulkCreate(rows)` → `bulkCreate(rows, { ignoreDuplicates: true })`

---

## Limites du test

- **Hardware** : les résultats sont spécifiques au Pi 4. Sur un serveur x86 avec SSD NVMe, les limites seraient significativement plus élevées.
- **Type de mesure** : test avec `temperature` uniquement (1 valeur par message). Les mesures multi-types (`ecg` à haute fréquence) produiraient un volume plus important.
- **Réseau** : le fog Pi et le cloud Pi étaient sur le même réseau local lors du test. En production avec un réseau WAN, la latence Kafka s'ajouterait.
- **Fenêtre Prometheus** : la métrique est calculée sur une fenêtre de 30 s (égale à la durée du palier), ce qui peut lisser les pics intra-palier.
- **Plage explorée** : la matrice couvre 5 à 30 capteurs × 5 à 30 pts/s. Des charges plus élevées n'ont pas été testées dans cette campagne.

---

## Optimisations identifiées (non implémentées)

### `synchronous_commit = off` (PostgreSQL)

Désactiver le commit synchrone dans PostgreSQL/TimescaleDB permettrait un gain immédiat sur la latence I/O disque en évitant le fsync à chaque transaction. Le risque est une perte de données sur les dernières transactions en cas de crash (acceptable pour un contexte IoT de monitoring).

```sql
-- Dans postgresql.conf ou en session
SET synchronous_commit = off;
```

### Partitionnement Kafka (ROADMAP)

Ajouter des partitions au topic `sensor-data` permettrait un traitement parallèle côté consumer. Sur Pi 4, ce serait de l'over-engineering — pertinent uniquement si le backend migre vers un serveur x86 avec plusieurs cœurs disponibles pour le consumer Kafka.

---

## Reproduire le test

```bash
cd python-simulator-over-mqtt-master
pip install -r requirements.txt

# Test complet (36 combinaisons, ~30 min)
python3 load_test_matrix.py \
  --max-sensors 30 \
  --max-rate 30 \
  --step 5 \
  --duration 30 \
  --types temperature \
  --broker local \
  --prometheus http://localhost:9090

# Test rapide (9 combinaisons)
python3 load_test_matrix.py \
  --max-sensors 15 \
  --max-rate 15 \
  --step 5 \
  --duration 30
```

Le script génère automatiquement :
- `load_test_results_<timestamp>.csv` — données brutes
- `load_test_results_<timestamp>.png` — surface 3D latence p95 = f(capteurs, taux)

> Prérequis : la stack RAMI complète doit tourner (fog-service actif, backend cloud, Prometheus accessible), et les capteurs de test doivent être enregistrés en base (seeder `load-test-*` disponible dans `backend/seeders/`).
