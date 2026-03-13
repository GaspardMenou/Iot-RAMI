<script lang="ts">
	import { defineComponent } from "vue"
	import MeasurementCard from "@/components/MeasurementCard.vue"
	import { useMeasurementStore } from "@/stores/measurement"
	import type { SensorWithProperty } from "#/measurement"
	import LineChart from "@/components/LineChart.vue"

	export default defineComponent({
		name: "HomeView",
		components: {
			LineChart,
			MeasurementCard,
		},
		data() {
			return {
				measurementTypes: [] as string[],
				sensors: [] as SensorWithProperty[],
				searchedSensor: "",
				displayChart: false,
				sensor: "",
				type: "",
			}
		},
		methods: {
			useMeasurementStore,
			async refreshData() {
				await useMeasurementStore().refresh()
				this.measurementTypes = useMeasurementStore().getMeasurementTypes()
				this.sensors = useMeasurementStore().getSensors()
			},
			setMeasurementAvailable(sensorName: string) {
				useMeasurementStore().setSensorAvailability(sensorName, true)
			},
			handleChartUpdate(type: string, sensor: string) {
				this.sensor = sensor
				this.type = type
				this.displayChart = true
			},
		},
		mounted() {
			this.refreshData()
		},
		computed: {
			filteredSensors(): SensorWithProperty[] {
				return this.searchedSensor === "" ? this.sensors : this.sensors.filter(s => s.name.toLowerCase().includes(this.searchedSensor.toLowerCase()))
			},
		},
	})
</script>

<template>
	<div class="home-view">
		<!-- En-tête -->
		<div class="home-header">
			<div class="header-title">
				<h1>MEASUREMENTS</h1>
				<span class="header-sub">TABLEAU DE BORD TEMPS RÉEL</span>
			</div>
			<div class="search-wrap">
				<span class="search-icon">⌕ </span>
				<input
					v-model="searchedSensor"
					placeholder="Filtrer les capteurs…"
					class="search-input" />
			</div>
		</div>

		<!-- Grille capteurs -->
		<div
			v-if="searchedSensor !== ''"
			:class="[displayChart ? 'layout-split-left' : '']"
			class="sensors-grid">
			<div
				v-for="filteredSensor in filteredSensors"
				:key="filteredSensor.name"
				class="sensor-block">
				<div class="sensor-block-header">
					<span class="sensor-block-name">{{ filteredSensor.name }}</span>
					<button
						class="btn-activate"
						@click="setMeasurementAvailable(filteredSensor.name)">
						ACTIVER
					</button>
				</div>
				<div
					v-if="filteredSensor.propertyVerified"
					class="measurement-list">
					<measurement-card
						v-for="measurementType in measurementTypes"
						:key="measurementType"
						:measurement-type="measurementType"
						:sensor-name="filteredSensor.name"
						@chart-data-updated="handleChartUpdate" />
				</div>
			</div>

			<div
				v-if="filteredSensors.length === 0"
				class="empty-state">
				AUCUN CAPTEUR CORRESPONDANT
			</div>
		</div>

		<!-- État vide si pas de recherche -->
		<div
			v-else
			class="home-idle">
			<p class="idle-hint">↑ Entrez un nom de capteur pour afficher ses mesures</p>
		</div>
	</div>

	<!-- Graphique latéral -->
	<line-chart
		v-show="displayChart"
		:sensor="sensor"
		:type="type"
		class="chart-side" />
</template>

<style lang="scss" scoped>
	.home-view {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* En-tête */
	.home-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1.5rem;
		flex-wrap: wrap;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-border);
	}

	.header-title h1 {
		font-family: var(--font-display);
		font-size: 2.4rem;
		font-weight: 900;
		color: var(--color-text);
		letter-spacing: 0.06em;
		line-height: 1;
	}

	.header-sub {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		color: var(--color-text-muted);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		display: block;
		margin-top: 4px;
	}

	.search-wrap {
		display: flex;
		align-items: center;
		gap: 0;
		border: 1px solid var(--color-border-bright);
		background: var(--color-surface);
		overflow: hidden;
		max-width: 280px;
		width: 100%;
	}

	.search-icon {
		padding: 0 0.75rem;
		color: var(--color-text-muted);
		font-size: 1.1rem;
		line-height: 1;
		flex-shrink: 0;
		border-right: 1px solid var(--color-border);
	}

	.search-input {
		border: none;
		background: transparent;
		padding: 0.6rem 0.75rem;
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--color-text);
		flex: 1;
		outline: none;

		&::placeholder {
			color: var(--color-text-muted);
			font-size: 0.75rem;
		}

		&:focus {
			box-shadow: none;
			border-color: transparent;
		}
	}

	/* Grille capteurs */
	.sensors-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
	}

	.sensor-block {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-top: 2px solid var(--color-border-bright);
		overflow: hidden;
	}

	.sensor-block-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface-secondary);
	}

	.sensor-block-name {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 900;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text);
	}

	.btn-activate {
		padding: 3px 10px;
		font-size: 0.65rem;
		background: transparent;
		border: 1px solid var(--color-border-bright);
		color: var(--color-text-muted);
		cursor: pointer;
		font-family: var(--font-mono);
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		transition: all 0.15s;
		border-radius: 0;

		&:hover {
			border-color: var(--color-primary);
			color: var(--color-primary);
			background: var(--color-primary-dim);
		}
	}

	.measurement-list {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* État vide */
	.home-idle {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
	}

	.idle-hint {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--color-text-muted);
		letter-spacing: 0.05em;
		text-align: center;
	}

	.empty-state {
		grid-column: 1 / -1;
		text-align: center;
		padding: 3rem;
		color: var(--color-danger);
		font-family: var(--font-mono);
		font-size: 0.8rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		border: 1px dashed var(--color-danger-dim);
	}

	/* Layout split */
	@media (min-width: 900px) {
		.layout-split-left {
			position: fixed;
			top: 0;
			left: 220px;
			width: calc(50% - 110px);
			height: 100vh;
			overflow-y: auto;
			padding: 2rem 2.5rem;
			z-index: 1;
		}

		.chart-side {
			position: fixed;
			top: 0;
			right: 0;
			width: 50%;
			height: 100vh;
			z-index: 1;
			padding: 2rem;
			display: flex;
			align-items: center;
		}
	}

	@media (max-width: 900px) {
		.chart-side {
			margin-top: 1rem;
		}
	}

	@media (max-width: 600px) {
		.home-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.search-wrap {
			max-width: 100%;
		}
	}
</style>
