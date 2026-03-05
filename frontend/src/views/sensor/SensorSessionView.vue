<script lang="ts">
	import { defineComponent, onMounted, onUnmounted, provide, ref } from "vue"
	import { useSession } from "@/composables/useSession.composable"
	import { useSensor } from "@/composables/useSensor.composable"
	import SensorCard from "@/components/sensor/SensorCard.vue"
	import Graph from "@/components/session/Graph.vue"
	export default defineComponent({
		name: "SensorSessionView",
		components: { SensorCard, Graph },
		props: {
			id: { type: String, required: true },
		},
		setup(props) {
			const { idSensor, chartData, timeSinceLastValue, transmissionSpeed, checkAndJoinActiveSession, endSession } = useSession()
			const { fetchSensors, sensors } = useSensor(undefined)

			const isSessionActive = ref(false)
			const sensor = ref<any>(null)

			provide("title", "Session en cours")
			provide("chartData", chartData)

			onMounted(async () => {
				await fetchSensors()
				sensor.value = sensors.value.find(s => s.id === props.id)
				idSensor.value = props.id

				const sensorTopic = (sensor.value?.topic ?? "") + "/sensor"
				const alreadyActive = await checkAndJoinActiveSession(props.id, sensorTopic)
				if (alreadyActive) isSessionActive.value = true
			})
			onUnmounted(async () => {
				endSession()
			})

				return {
				sensor,
				isSessionActive,
				timeSinceLastValue,
				transmissionSpeed,
			}
		},
	})
</script>

<template>
	<div class="session-view">
		<div
			v-if="sensor"
			class="sensor-header">
			<SensorCard
				:sensor="sensor"
				:is-for-navigation="false" />

			<div class="session-controls">
				<div
					v-if="isSessionActive"
					class="active-controls">
					<div class="transmission-info">
						<span>Dernière valeur : {{ timeSinceLastValue.toFixed(2) }}s</span>
						<span>Vitesse : {{ transmissionSpeed.toFixed(2) }} val/s</span>
					</div>
					<span class="badge-active">Session en cours</span>
				</div>
				<span
					v-else
					class="badge-inactive">
					Aucune session active
				</span>
			</div>
		</div>

		<div
			v-if="isSessionActive"
			class="graph-container">
			<Graph :is-real-time="true" />
		</div>
	</div>
</template>

<style scoped>
	.session-view {
		padding: 2rem;
		max-width: 1000px;
		margin: 0 auto;
	}

	.sensor-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding: 1.25rem 1.5rem;
		background: var(--color-surface);
		border-radius: 12px;
		box-shadow: 0 2px 8px var(--color-shadow);
	}

	.session-controls {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		flex-shrink: 0;
	}

	.active-controls {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.badge-active {
		padding: 6px 14px;
		background-color: var(--color-success);
		color: white;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.badge-inactive {
		padding: 6px 14px;
		background-color: var(--color-surface-secondary);
		color: var(--color-text-muted);
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.transmission-info {
		display: flex;
		flex-direction: row;
		gap: 1rem;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	.transmission-info span {
		background: var(--color-surface-secondary);
		padding: 4px 10px;
		border-radius: 6px;
	}

	.graph-container {
		background: var(--color-surface);
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px var(--color-shadow);
		min-height: 450px;
	}
</style>
