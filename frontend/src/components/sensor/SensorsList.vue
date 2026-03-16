<template>
	<div
		class="sensors-list-view"
		:class="{ 'sensors-list-view--standalone': standalone }">
		<!-- En-tête du panel -->
		<div class="list-header">
			<div class="list-header-left">
				<h2>INVENTAIRE CAPTEURS</h2>
				<span class="sensor-count">
					<span class="count-total">{{ sensors.length }}</span>
					<span class="count-unit">UNIT{{ sensors.length > 1 ? "S" : "" }}</span>
				</span>
			</div>
			<div class="list-header-right">
				<span class="header-tag">TEMPS RÉEL</span>
			</div>
		</div>

		<!-- Corps de la liste -->
		<div
			class="sensors-list"
			:class="{ 'sensors-list--empty': sensors.length === 0 }">
			<div
				v-if="sensors.length > 0"
				class="sensors-list-inner">
				<div
					v-for="(sensor, index) in sensors"
					:key="sensor.id"
					class="sensor-row">
					<span class="sensor-index">{{ String(index + 1).padStart(2, "0") }}</span>
					<SensorCard
						:sensor="sensor"
						:isForRealTimeSession="props.isForRealTimeSession"
						:selectedSensorId="selectedSensor"
						:isForNavigation="standalone"
						@click="handleSensorSelect(sensor.id)" />
				</div>
			</div>
			<div
				v-else
				class="empty-state">
				<span class="empty-icon">◌</span>
				<span class="empty-text">AUCUN CAPTEUR ASSIGNÉ</span>
				<span class="empty-hint">Contactez un administrateur pour obtenir l'accès aux capteurs.</span>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { defineComponent, onMounted } from "vue"
	import SensorCard from "@/components/sensor/SensorCard.vue"
	import { useSensor } from "@/composables/useSensor.composable"

	export default defineComponent({
		name: "SensorsListView",
		components: { SensorCard },
		props: {
			isForRealTimeSession: {
				type: Boolean,
				default: false,
			},
			standalone: {
				type: Boolean,
				default: false,
			},
		},
		setup(props) {
			const { sensors, selectedSensor, fetchSensors, handleSensorSelect } = useSensor(undefined)

			onMounted(() => {
				fetchSensors()
			})

			return {
				sensors,
				selectedSensor,
				handleSensorSelect,
				props,
			}
		},
	})
</script>

<style scoped>
	.sensors-list-view {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
	}

	/* ── En-tête ── */
	.list-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.6rem 1rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface-secondary);
		gap: 0.75rem;
	}

	.list-header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.list-header h2 {
		font-family: var(--font-display);
		font-size: 0.85rem;
		font-weight: 900;
		letter-spacing: 0.18em;
		color: var(--color-text-muted);
		text-transform: uppercase;
	}

	.sensor-count {
		display: flex;
		align-items: baseline;
		gap: 4px;
	}

	.count-total {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 900;
		color: var(--color-primary);
		line-height: 1;
	}

	.count-unit {
		font-family: var(--font-mono);
		font-size: 0.55rem;
		color: var(--color-primary);
		letter-spacing: 0.12em;
		opacity: 0.6;
	}

	.list-header-right {
		flex-shrink: 0;
	}

	.header-tag {
		font-family: var(--font-mono);
		font-size: 0.55rem;
		letter-spacing: 0.14em;
		color: var(--color-text-muted);
		text-transform: uppercase;
		padding: 2px 6px;
		border: 1px solid var(--color-border-bright);
		opacity: 0.6;
	}

	/* ── Liste ── */
	.sensors-list {
		display: flex;
		flex-direction: column;
	}

	/* Mode panel interne (ex: RealTimeSession) — hauteur contrainte */
	.sensors-list-view:not(.sensors-list-view--standalone) .sensors-list {
		max-height: min(50vh, 480px);
		overflow-y: auto;
	}

	.sensors-list--empty {
		padding: 2.5rem 1rem;
	}

	.sensors-list-inner {
		display: flex;
		flex-direction: column;
	}

	/* Ligne capteur avec index */
	.sensor-row {
		display: flex;
		align-items: stretch;
		border-bottom: 1px solid var(--color-border);
	}

	.sensor-row:last-child {
		border-bottom: none;
	}

	.sensor-index {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		color: var(--color-border-bright);
		letter-spacing: 0.08em;
		padding: 0 0.6rem;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 36px;
		border-right: 1px solid var(--color-border);
		background: var(--color-surface-secondary);
		flex-shrink: 0;
		user-select: none;
		transition: color 0.15s;
	}

	/* Le SensorCard prend tout le reste de la largeur */
	.sensor-row :deep(.sensor-card) {
		flex: 1;
		border: none;
		border-radius: 0;
	}

	/* Hover de la ligne : l'index s'illumine */
	.sensor-row:hover .sensor-index {
		color: var(--color-primary);
	}

	/* ── État vide ── */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		text-align: center;
	}

	.empty-icon {
		font-size: 1.8rem;
		color: var(--color-border-bright);
		line-height: 1;
	}

	.empty-text {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.empty-hint {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		color: var(--color-text-muted);
		opacity: 0.5;
		max-width: 280px;
		line-height: 1.5;
	}
</style>
