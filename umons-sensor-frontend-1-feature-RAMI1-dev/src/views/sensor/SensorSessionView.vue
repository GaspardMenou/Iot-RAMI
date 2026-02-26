<script lang="ts">
	import { defineComponent, onMounted, onUnmounted, provide, ref } from "vue"
	import { useSession } from "@/composables/useSession.composable"
	import { useSensor } from "@/composables/useSensor.composable"
	import { UserFields } from "@/composables/useUser.composable"
	import SensorCard from "@/components/sensor/SensorCard.vue"
	import Graph from "@/components/session/Graph.vue"
	export default defineComponent({
		name: "SensorSessionView",
		components: { SensorCard, Graph },
		props: {
			id: { type: String, required: true },
		},
		setup(props) {
			const { idUser, idSensor, chartData, timeSinceLastValue, transmissionSpeed, startSessionOnClientSide, createSessionOnServerSide, checkAndJoinActiveSession } = useSession()
			const { fetchSensors, sensors } = useSensor(undefined)

			const isSessionActive = ref(false)
			const sensor = ref<any>(null)

			provide("title", "Session en cours")
			provide("chartData", chartData)

			onMounted(async () => {
				await fetchSensors()
				sensor.value = sensors.value.find(s => s.id === props.id)

				idUser.value = localStorage.getItem(UserFields.ID) || ""
				idSensor.value = props.id

				const sensorTopic = (sensor.value?.topic ?? "") + "/sensor"
				const alreadyActive = await checkAndJoinActiveSession(props.id, sensorTopic, idUser.value)
				if (alreadyActive) isSessionActive.value = true
			})
			onUnmounted(async () => {
				endSession()
			})

			const startSession = () => {
				const sensorTopic = (sensor.value?.topic ?? "") + "/sensor"
				startSessionOnClientSide(sensorTopic, idUser.value, idSensor.value)
				isSessionActive.value = true
			}

			const endSession = () => {
				createSessionOnServerSide()
				isSessionActive.value = false
			}

			return {
				sensor,
				isSessionActive,
				timeSinceLastValue,
				transmissionSpeed,
				startSession,
				endSession,
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
				<button
					v-if="!isSessionActive"
					class="btn-start"
					@click="startSession">
					Démarrer la session
				</button>
				<div
					v-else
					class="active-controls">
					<div class="transmission-info">
						<span>Dernière valeur : {{ timeSinceLastValue.toFixed(2) }}s</span>
						<span>Vitesse : {{ transmissionSpeed.toFixed(2) }} val/s</span>
					</div>
					<button
						class="btn-stop"
						@click="endSession">
						Arrêter la session
					</button>
				</div>
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
		flex-wrap: nowrap;
		gap: 1.5rem;
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

	.btn-start {
		padding: 10px 24px;
		background-color: var(--color-success);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.btn-start:hover {
		background-color: var(--color-success-hover);
	}

	.active-controls {
		display: flex;
		align-items: center;
		gap: 1.5rem;
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

	.btn-stop {
		padding: 10px 24px;
		background-color: var(--color-danger);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s;
		white-space: nowrap;
	}

	.btn-stop:hover {
		background-color: var(--color-danger-hover);
	}

	.graph-container {
		background: var(--color-surface);
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px var(--color-shadow);
		min-height: 450px;
	}
</style>
