<template>
	<div class="sensors-list-view">
		<div class="list-header">
			<h2>MES CAPTEURS</h2>
			<span class="sensor-count">{{ sensors.length }} UNIT{{ sensors.length > 1 ? 'S' : '' }}</span>
		</div>
		<div
			class="sensors-list"
			:class="{ 'sensors-list--empty': sensors.length === 0 }">
			<SensorCard
				v-for="sensor in sensors"
				:key="sensor.id"
				:sensor="sensor"
				:isForRealTimeSession="props.isForRealTimeSession"
				:selectedSensorId="selectedSensor"
				@click="handleSensorSelect(sensor.id)" />
			<div
				v-if="sensors.length === 0"
				class="empty-state">
				AUCUN CAPTEUR ASSIGNÉ
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

	.list-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface-secondary);
	}

	.list-header h2 {
		font-family: var(--font-display);
		font-size: 0.9rem;
		font-weight: 900;
		letter-spacing: 0.15em;
		color: var(--color-text-muted);
	}

	.sensor-count {
		font-family: var(--font-mono);
		font-size: 0.62rem;
		color: var(--color-primary);
		letter-spacing: 0.1em;
		opacity: 0.7;
	}

	.sensors-list {
		display: flex;
		flex-direction: column;
		gap: 0;
		max-height: 300px;
		overflow-y: auto;
	}

	.sensors-list > *:not(:last-child) {
		border-bottom: 1px solid var(--color-border);
	}

	.sensors-list--empty {
		padding: 2rem;
	}

	.empty-state {
		text-align: center;
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
</style>
