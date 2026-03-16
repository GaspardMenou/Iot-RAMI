import subprocess
import sys
import os
import time
import argparse
import csv
import requests
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from typing import Optional


# ── CLI ────────────────────────────────────────────────────────────────────────

def parse_args():
    parser = argparse.ArgumentParser(description='MQTT Load Test Matrix — génère un plot 3D latence p95')
    parser.add_argument('--max-sensors', type=int, default=20,    help='Nombre max de capteurs (défaut: 20)')
    parser.add_argument('--max-rate',    type=int, default=20,    help='Taux max de points/s par capteur (défaut: 20)')
    parser.add_argument('--step',        type=int, default=5,     help='Pas pour les deux axes (défaut: 5)')
    parser.add_argument('--duration',    type=int, default=30,    help='Durée de chaque palier en secondes (défaut: 30)')
    parser.add_argument('--types',       type=str, default='temperature', help='Types de mesures (défaut: temperature)')
    parser.add_argument('--broker',      type=str, default='local',       help='Broker MQTT (défaut: local)')
    parser.add_argument('--prometheus',  type=str, default='http://localhost:9090', help='URL Prometheus (défaut: http://localhost:9090)')
    parser.add_argument('--output',      type=str, default='load_test_results', help='Nom de base pour le CSV et le plot')
    return parser.parse_args()


# ── Prometheus ─────────────────────────────────────────────────────────────────

def query_prometheus(prometheus_url: str, window: int) -> Optional[float]:
    """Retourne la latence p95 en ms sur la fenêtre glissante (window secondes)."""
    query = f'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[{window}s]))'
    try:
        response = requests.get(
            f'{prometheus_url}/api/v1/query',
            params={'query': query},
            timeout=5
        )
        response.raise_for_status()
        results = response.json().get('data', {}).get('result', [])
        if not results:
            return None
        value = float(results[0]['value'][1])
        return round(value * 1000, 2)  # convertir en ms
    except Exception as e:
        print(f'  [WARN] Prometheus injoignable : {e}')
        return None


# ── Load test ──────────────────────────────────────────────────────────────────

def run_load_test(nb_sensors: int, rate: int, duration: int, types: str, broker: str) -> list:
    """Lance nb_sensors processus capteurs, attend duration secondes, retourne les processus."""
    script = os.path.join(os.path.dirname(__file__), 'mqttCliApp.py')
    processes = []
    for i in range(nb_sensors):
        p = subprocess.Popen(
            [sys.executable, script, 'sensor', broker,
             '--topic', f'load-test-{i}',
             '--rate', str(rate),
             '--types'] + types.split(),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        processes.append(p)
    return processes


def stop_processes(processes: list):
    for p in processes:
        p.terminate()
    # Attendre que tous soient bien arrêtés
    for p in processes:
        try:
            p.wait(timeout=5)
        except subprocess.TimeoutExpired:
            p.kill()


# ── Plot 3D ────────────────────────────────────────────────────────────────────

def generate_plot(results: list, output_name: str):
    """Génère un plot 3D surface latence p95 = f(capteurs, rate)."""
    sensors_vals = sorted(set(r[0] for r in results))
    rate_vals    = sorted(set(r[1] for r in results))

    # Construire la grille Z
    Z = np.full((len(rate_vals), len(sensors_vals)), np.nan)
    for (nb_sensors, rate, latency) in results:
        if latency is None:
            continue
        i = rate_vals.index(rate)
        j = sensors_vals.index(nb_sensors)
        Z[i][j] = latency

    X, Y = np.meshgrid(sensors_vals, rate_vals)

    fig = plt.figure(figsize=(12, 8))
    ax = fig.add_subplot(111, projection='3d')

    surf = ax.plot_surface(X, Y, Z, cmap='plasma', edgecolor='none', alpha=0.85)
    fig.colorbar(surf, ax=ax, shrink=0.5, label='Latence p95 (ms)')

    ax.set_xlabel('Nombre de capteurs')
    ax.set_ylabel('Points / seconde / capteur')
    ax.set_zlabel('Latence p95 (ms)')
    ax.set_title('Latence p95 en fonction de la charge — RAMI IoT')

    plot_path = f'{output_name}.png'
    plt.tight_layout()
    plt.savefig(plot_path, dpi=150)
    print(f'\n[PLOT] Sauvegardé : {plot_path}')
    plt.show()


# ── CSV ────────────────────────────────────────────────────────────────────────

def write_csv(results: list, output_name: str):
    csv_path = f'{output_name}.csv'
    with open(csv_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['nb_sensors', 'rate_per_sensor', 'total_points_per_sec', 'latency_p95_ms'])
        for (nb_sensors, rate, latency) in results:
            writer.writerow([nb_sensors, rate, nb_sensors * rate, latency])
    print(f'[CSV]  Sauvegardé : {csv_path}')


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    args = parse_args()

    # Générer toutes les combinaisons
    sensor_range = list(range(args.step, args.max_sensors + 1, args.step))
    rate_range   = list(range(args.step, args.max_rate    + 1, args.step))
    total        = len(sensor_range) * len(rate_range)

    print(f'=== RAMI Load Test Matrix ===')
    print(f'  Capteurs  : {sensor_range}')
    print(f'  Taux      : {rate_range} points/s')
    print(f'  Durée/palier : {args.duration}s')
    print(f'  Total combinaisons : {total}')
    print(f'  Durée totale estimée : ~{total * (args.duration + 5) // 60} min')
    print(f'  Prometheus : {args.prometheus}')
    print()

    results = []
    step_num = 0

    try:
        for nb_sensors in sensor_range:
            for rate in rate_range:
                step_num += 1
                total_throughput = nb_sensors * rate
                print(f'[{step_num}/{total}] {nb_sensors} capteurs × {rate} pts/s = {total_throughput} pts/s total...')

                processes = run_load_test(nb_sensors, rate, args.duration, args.types, args.broker)

                # Laisser le système se stabiliser (5s) puis mesurer
                time.sleep(max(5, args.duration - 5))
                latency = query_prometheus(args.prometheus, args.duration)
                time.sleep(args.duration - max(5, args.duration - 5))

                stop_processes(processes)

                print(f'  → Latence p95 : {latency} ms')
                results.append((nb_sensors, rate, latency))

                # Petite pause entre paliers
                time.sleep(3)

    except KeyboardInterrupt:
        print('\n[STOP] Interruption — arrêt des processus...')
        if 'processes' in locals():
            stop_processes(processes)

    if not results:
        print('Aucun résultat collecté.')
        return

    output = os.path.join(os.path.dirname(__file__), args.output)
    write_csv(results, output)
    generate_plot(results, output)


if __name__ == '__main__':
    main()
