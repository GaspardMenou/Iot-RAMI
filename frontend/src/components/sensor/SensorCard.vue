<template>
	<div
		class="sensor-card"
		:class="{ 'sensor-card--selected': isSelected }"
		@click="handleCardClick">
		<div class="sensor-status-section">
			<div
				class="sensor-status"
				:class="statusClass"
				@click.stop="checkSensorStatus">
				<span
					class="status-indicator"
					:title="tooltipText"></span>
				<span class="status-text">{{ status }}</span>
			</div>
		</div>
		<div class="sensor-info-section">
			<p class="sensor-name">{{ sensor.name }}</p>
			<p class="sensor-topic">{{ sensor.topic }}</p>
		</div>
	</div>
</template>

<script lang="ts">
	import { computed, defineComponent, onMounted, onUnmounted } from "vue"
	import { EventTypes, handleEvent } from "@/composables/useUser.composable"
	import { useSensor, SensorState } from "@/composables/useSensor.composable"
	import { useRouter } from "vue-router"
	import { io } from "socket.io-client"

	export default defineComponent({
		name: "SensorCard",
		props: {
			sensor: {
				type: Object,
				required: true,
			},
			selectedSensorId: {
				type: String,
				default: null,
			},
			isForRealTimeSession: {
				type: Boolean,
				default: false,
			},
			tooltipText: {
				type: String,
			},
			isForNavigation: {
				type: Boolean,
				default: false,
			},
		},
		setup(props) {
			const router = useRouter()

			const { status, statusClass, checkSensorStatus, listenToSensorStatus } = useSensor(props.sensor.name)

			const isSelected = computed(() => props.selectedSensorId === props.sensor.id)

			const selectSensor = () => {
				if (props.isForRealTimeSession) {
					handleEvent("emit", EventTypes.SENSOR_SELECTED_FOR_CREATING_SESSION, props.sensor.id)
					//console.log("NEW EVENT >>> SENSOR NEW SESSION", props.sensor.id)
				} else {
					handleEvent("emit", EventTypes.SENSOR_SELECTED_FOR_FETCHING_SESSIONS, props.sensor.id)
					//console.log("NEW EVENT >>> SENSOR NEW SESSION FETCH")
				}
			}

			const handleCardClick = () => {
				if (props.isForNavigation) {
					router.push({ name: "SensorDetail", params: { id: props.sensor.id } })
					return
				} else if (props.isForRealTimeSession) {
					if (status.value === SensorState.ONLINE) {
						selectSensor()
					}
				} else {
					selectSensor()
				}
			}

			onMounted(() => {
				checkSensorStatus()
				const socket = listenToSensorStatus()
				onUnmounted(() => {
					socket.disconnect()
				})
			})

			return {
				status,
				statusClass,
				checkSensorStatus,
				selectSensor,
				handleCardClick,
				SensorState,
				isSelected,
			}
		},
	})
</script>

<style scoped>
	.sensor-card {
		display: flex;
		border: 1px solid var(--color-border);
		padding: 16px;
		margin-bottom: 10px;
		background-color: var(--color-surface);
		border-radius: 10px;
		box-shadow: 0 2px 5px var(--color-shadow);
		cursor: pointer;
		transition: border-color 0.2s;
	}

	.sensor-card:hover {
		border-color: var(--color-primary);
	}

	.sensor-card--selected {
		border-color: var(--color-primary);
		background-color: rgba(14, 165, 233, 0.1);
	}

	.sensor-status-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding-right: 15px;
		border-right: 1px solid var(--color-border);
	}

	.sensor-info-section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding-left: 15px;
	}

	.sensor-name {
		font-size: 1.1em;
		font-weight: bold;
		color: var(--color-text);
	}

	.sensor-topic {
		font-size: 0.78em;
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		letter-spacing: -0.01em;
		margin-top: 2px;
	}

	.sensor-status {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
	}

	.status-text {
		font-size: 0.8em;
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.status-indicator {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.5; transform: scale(1.3); }
	}

	.status-online .status-indicator {
		background-color: var(--color-success);
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
	}
	.status-publishing .status-indicator {
		background-color: var(--color-warning);
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
		animation: pulse 1.5s ease-in-out infinite;
	}
	.status-offline .status-indicator { background-color: var(--color-danger); }
	.status-error .status-indicator { background-color: var(--color-text-muted); }
	.status-unknown .status-indicator { background-color: var(--color-border); }
</style>
