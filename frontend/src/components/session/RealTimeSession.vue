<template>
	<div class="create-session-container">
		<h1>Créer une nouvelle session</h1>

		<!-- Étape 1 : Choix du capteur -->
		<div
			class="step"
			:class="{ active: activeStep === 1 }">
			<h2 @click="toggleStep(1)">
				<span>Étape 1: Choix du capteur</span>
				<span
					class="arrow"
					:class="{ down: activeStep === 1 }"
					>▼</span
				>
			</h2>
			<div
				class="step-content"
				v-if="activeStep === 1">
				<SensorsList :isForRealTimeSession="true" />
				<div class="sensor-info">
					<p>Vous ne pouvez pas sélectionner un capteur hors ligne.</p>
				</div>
			</div>
		</div>

		<!-- Étape 2 : En attente de session -->
		<div
			class="step"
			:class="{ active: activeStep === 2 }">
			<h2 @click="toggleStep(2)">
				<span>Étape 2: En attente de session</span>
				<span
					class="arrow"
					:class="{ down: activeStep === 2 }"
					>▼</span
				>
			</h2>
			<div
				class="step-content"
				v-if="activeStep === 2">
				<p>Aucune session active détectée pour ce capteur. La session démarrera automatiquement dès que le capteur commencera à publier.</p>
			</div>
		</div>

		<!-- Étape 3 : Déroulement de la session -->
		<div
			class="step"
			:class="{ active: activeStep === 3 }">
			<h2 @click="toggleStep(3)">
				<span>Étape 3: Déroulement de la session</span>
				<span
					class="arrow"
					:class="{ down: activeStep === 3 }"
					>▼</span
				>
			</h2>
			<div
				class="step-content"
				v-if="activeStep === 3">
				<div class="graph-container">
					<Graph :isRealTime="true" />
				</div>
				<div class="info-columns">
					<div class="info-box">
						<p>Dernière valeur reçue : il y a {{ timeSinceLastValue.toFixed(3) }} secondes</p>
					</div>
					<div class="info-box">
						<p>Vitesse de transmission : {{ transmissionSpeed.toFixed(3) }} valeurs/seconde</p>
					</div>
				</div>
				<span class="badge-active">Session en cours</span>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { ref, provide, defineComponent, onMounted, onUnmounted } from "vue"
	import Graph from "@/components/session/Graph.vue"
	import SensorsList from "@/components/sensor/SensorsList.vue"
	import { EventTypes, handleEvent } from "@/composables/useUser.composable"
	import { useSession } from "@/composables/useSession.composable"
	import { useSensor } from "@/composables/useSensor.composable"

	export default defineComponent({
		name: "CreateSession",
		components: {
			Graph,
			SensorsList,
		},
		setup() {
			const { idSensor, chartData, timeSinceLastValue, transmissionSpeed, checkAndJoinActiveSession } = useSession()
			const { fetchSensors, sensors } = useSensor(undefined)

			const activeStep = ref(1)
			const selectedSensorName = ref("")

			provide("title", "Current session chart")
			provide("chartData", chartData)

			const sensorSelectedCallback = async (sensorId: string) => {
				idSensor.value = sensorId
				const sensor = sensors.value.find(s => s.id === sensorId)
				const sensorTopic = (sensor?.topic ?? "") + "/sensor"
				const alreadyActive = await checkAndJoinActiveSession(sensorId, sensorTopic)
				if (alreadyActive) {
					activeStep.value = 3
				} else {
					nextStep()
				}
			}

			onMounted(async () => {
				await fetchSensors()
				handleEvent("on", EventTypes.SENSOR_SELECTED_FOR_CREATING_SESSION, sensorSelectedCallback)
			})

			onUnmounted(() => {
				handleEvent("off", EventTypes.SENSOR_SELECTED_FOR_CREATING_SESSION, sensorSelectedCallback)
			})

			const nextStep = () => {
				if (activeStep.value < 3) {
					activeStep.value += 1
				}
			}

			const toggleStep = (step: number) => {
				if (activeStep.value === step) {
					activeStep.value = 0
				} else {
					activeStep.value = step
				}
			}

			return {
				activeStep,
				selectedSensorName,
				chartData,
				timeSinceLastValue,
				transmissionSpeed,
				toggleStep,
			}
		},
	})
</script>

<style scoped>
	.create-session-container {
		width: 100%;
		margin: 0 auto;
		padding: 20px;
		border: 1px solid #ccc;
		border-radius: 10px;
		background-color: var(--color-surface);
	}

	.step {
		margin-bottom: 20px;
		background-color: var(--color-surface);
		border-radius: 10px;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		transition: max-height 0.2s ease-out;
	}

	.step h2 {
		cursor: pointer;
		padding: 15px;
		margin: 0;
		font-size: 1.1em;
		background-color: var(--color-surface-secondary);
		color: var(--color-text);
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: background-color 0.15s;
	}

	.step h2:hover {
		background-color: var(--color-sidebar-hover);
	}

	.step h2 .arrow {
		transition: transform 0.2s;
	}

	.step h2 .arrow.down {
		transform: rotate(180deg);
	}

	.step-content {
		padding: 20px;
		border-top: 1px solid var(--color-border);
	}

	.sensor-info {
		margin-top: 10px;
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
	}

	.badge-active::before {
		content: '';
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background-color: var(--color-success);
		animation: pulse 1.5s ease-in-out infinite;
	}

	.slider-container {
		margin-top: 20px;
	}

	.slider {
		width: 100%;
	}

	.graph-container {
		margin-top: 20px;
		height: clamp(400px, 60vh, 1000px);
	}

	.end-session {
		margin-top: 10px;
	}

	.info-columns {
		display: flex;
		justify-content: space-between;
		gap: 10px;
	}

	.info-box {
		background-color: var(--color-surface-secondary);
		padding: 10px 14px;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		width: 48%;
		text-align: center;
		font-family: var(--font-mono);
		font-size: 0.85rem;
	}

	@media (max-width: 768px) {
		.info-columns {
			flex-direction: column;
		}

		.info-box {
			width: 100%;
		}

		.create-session-container {
			padding: 12px;
		}
	}
</style>
