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
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 14px;
		background-color: rgba(34, 197, 94, 0.15);
		color: var(--color-success);
		border: 1px solid var(--color-success);
		border-radius: 20px;
		font-size: 0.82rem;
		font-weight: 600;
		font-family: var(--font-mono);
		letter-spacing: 0.04em;
		white-space: nowrap;
	}

	.badge-active::before {
		content: '';
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background-color: var(--color-success);
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.5; transform: scale(1.3); }
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
		font-size: 0.82rem;
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		white-space: nowrap;
	}

	.transmission-info span {
		background: var(--color-surface-secondary);
		padding: 4px 10px;
		border-radius: 6px;
		border: 1px solid var(--color-border);
	}

	.graph-container {
		background: var(--color-surface);
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px var(--color-shadow);
		min-height: 450px;
	}
</style>
