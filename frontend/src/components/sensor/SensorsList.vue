<template>
	<div class="sensors-list-view">
		<div class="header">
			<h2>Mes capteurs</h2>
			<hr />
		</div>
		<div class="sensors-list">
			<SensorCard
				v-for="sensor in sensors"
				:key="sensor.id"
				:sensor="sensor"
				:isForRealTimeSession="props.isForRealTimeSession"
				:selectedSensorId="selectedSensor"
				@click="handleSensorSelect(sensor.id)" />
		</div>
	</div>
</template>

<script lang="ts">
	import { defineComponent, onMounted } from "vue"
	import SensorCard from "@/components/sensor/SensorCard.vue"
	import { useSensor } from "@/composables/useSensor.composable"

	export default defineComponent({
		name: "SensorsListView",
		components: {
			SensorCard,
		},
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
		background-color: var(--color-surface);
		border-radius: 10px;
		box-shadow: 0 2px 5px var(--color-shadow);
		padding: 20px;
	}

	.header {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 10px;
	}

	.header h2 {
		font-size: 1.2em;
		font-weight: bold;
		margin: 0;
		color: var(--color-text);
	}

	.header hr {
		width: 100%;
		border: none;
		border-top: 1px solid var(--color-border);
		margin: 10px 0;
	}

	.sensors-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
		max-height: 240px;
		overflow-y: auto;
	}
</style>
