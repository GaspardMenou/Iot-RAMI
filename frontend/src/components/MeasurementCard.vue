<template>
	<div class="measurement-card">
		<div
			v-show="measurements.length !== 0"
			class="card"
			:class="{ 'card--expanded': expandCard }"
			@click="expandCard = !expandCard">

			<!-- En-tête -->
			<div class="card-header">
				<span class="type-name">{{ measurementType }}</span>
				<div class="header-right">
					<span class="last-value">{{ lastMeasurement() }}</span>
					<span class="expand-icon">{{ expandCard ? '▲' : '▼' }}</span>
				</div>
			</div>

			<p class="timestamp">{{ lastMeasurementTimestamp() }}</p>

			<!-- Tableau expandable -->
			<div
				v-if="expandCard"
				class="card-table">
				<table class="data-table">
					<thead>
						<tr>
							<th>VALEUR</th>
							<th>HORODATAGE</th>
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="measurement in lastNMeasurements(10)"
							:key="measurement.timestamp">
							<td>{{ measurement.value }}</td>
							<td>{{ beautifyDate(measurement.timestamp) }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

		<button
			v-show="measurements.length !== 0"
			class="btn-chart"
			@click.stop="setChartAvailableAndEmit">
			◈ GRAPHIQUE
		</button>
	</div>
</template>

<script lang="ts">
	import { defineComponent } from "vue"
	import { useMeasurementStore } from "@/stores/measurement"
	import type { Measurement } from "#/measurement"

	interface DataComponent {
		measurements: Measurement[]
		isChartAvailable: boolean
		expandCard: boolean
	}

	export default defineComponent({
		name: "measurementCard",
		emits: ["chart-data-updated"],
		props: {
			measurementType: { type: String, required: true },
			sensorName: { type: String, required: true },
		},
		data(): DataComponent {
			return {
				measurements: [],
				isChartAvailable: false,
				expandCard: false,
			}
		},
		methods: {
			beautifyDate(date: string) {
				return new Date(date).toLocaleString()
			},
			lastNMeasurements(n: number) {
				return this.measurements.slice(-n)
			},
			lastMeasurement() {
				return this.measurements.length > 0 ? this.measurements[0].value : "—"
			},
			lastMeasurementTimestamp() {
				return this.measurements.length > 0 ? this.beautifyDate(this.measurements[0].timestamp) : ""
			},
			async refreshMeasurements() {
				await useMeasurementStore().refresh()
				await useMeasurementStore().feedMeasurements()
				const data = useMeasurementStore().getMeasurementsByTypeAndSensor(this.measurementType, this.sensorName)
				if (data) {
					this.measurements = data.slice(0, 10)
				}
			},
			setChartAvailableAndEmit() {
				this.$emit("chart-data-updated", this.measurementType, this.sensorName)
			},
		},
		async mounted() {
			await this.refreshMeasurements()
		},
	})
</script>

<style lang="scss" scoped>
	.measurement-card {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.card {
		background: var(--color-surface-secondary);
		border: 1px solid var(--color-border);
		border-left: 2px solid var(--color-primary);
		cursor: pointer;
		overflow: hidden;
		transition: background-color 0.15s, border-color 0.15s;

		&:hover {
			background: rgba(255, 159, 10, 0.04);
		}

		&--expanded {
			border-left-color: var(--color-primary);
		}
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.6rem 0.85rem;
		gap: 0.5rem;
	}

	.type-name {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.last-value {
		font-family: var(--font-display);
		font-size: 1.3rem;
		font-weight: 900;
		color: var(--color-primary);
		line-height: 1;
		text-shadow: 0 0 12px var(--color-primary-glow);
	}

	.expand-icon {
		font-size: 0.55rem;
		color: var(--color-text-muted);
		line-height: 1;
	}

	.timestamp {
		padding: 0 0.85rem 0.6rem;
		font-family: var(--font-mono);
		font-size: 0.62rem;
		color: var(--color-text-muted);
		letter-spacing: 0.04em;
	}

	/* Tableau */
	.card-table {
		border-top: 1px solid var(--color-border);
		padding: 0.75rem;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-mono);
		font-size: 0.72rem;

		th {
			padding: 0.4rem 0.6rem;
			text-align: left;
			font-size: 0.6rem;
			font-weight: 700;
			letter-spacing: 0.1em;
			text-transform: uppercase;
			color: var(--color-text-muted);
			border-bottom: 1px solid var(--color-border);
		}

		td {
			padding: 0.35rem 0.6rem;
			color: var(--color-text);
			border-bottom: 1px solid var(--color-border);
		}

		tbody tr:hover td {
			background: rgba(255, 159, 10, 0.03);
		}

		tbody tr:last-child td {
			border-bottom: none;
		}
	}

	/* Bouton graphique */
	.btn-chart {
		padding: 0.4rem 0.75rem;
		font-family: var(--font-mono);
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		background: transparent;
		border: 1px solid var(--color-border-bright);
		border-top: none;
		color: var(--color-text-muted);
		cursor: pointer;
		transition: all 0.15s;
		border-radius: 0;
		width: 100%;
		text-align: left;

		&:hover {
			background: var(--color-primary-dim);
			border-color: var(--color-primary);
			color: var(--color-primary);
		}
	}
</style>
