<template>
	<div
		class="sensor-card"
		:class="[statusClass, { 'sensor-card--selected': isSelected, 'sensor-card--clickable': !isForNavigation || true }]"
		@click="handleCardClick">

		<!-- Barre de statut gauche -->
		<div class="sensor-status-bar">
			<span
				class="status-led"
				:title="tooltipText" />
		</div>

		<!-- Infos principales -->
		<div class="sensor-body">
			<div class="sensor-name-row">
				<span class="sensor-name">{{ sensor.name }}</span>
				<span class="status-tag">{{ status }}</span>
			</div>
			<span class="sensor-topic">{{ sensor.topic }}</span>
		</div>

		<!-- Icône flèche (si navigation) -->
		<div
			v-if="isForNavigation"
			class="sensor-arrow">
			›
		</div>
	</div>
</template>

<script lang="ts">
	import { computed, defineComponent, onMounted, onUnmounted } from "vue"
	import { EventTypes, handleEvent } from "@/composables/useUser.composable"
	import { useSensor, SensorState } from "@/composables/useSensor.composable"
	import { useRouter } from "vue-router"

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
				} else {
					handleEvent("emit", EventTypes.SENSOR_SELECTED_FOR_FETCHING_SESSIONS, props.sensor.id)
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
		align-items: center;
		gap: 0;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-left: 3px solid var(--color-border-bright);
		padding: 0;
		cursor: pointer;
		transition: border-color 0.15s, background-color 0.15s, box-shadow 0.15s;
		overflow: hidden;
	}

	.sensor-card:hover {
		border-color: var(--color-primary);
		border-left-color: var(--color-primary);
		background: var(--color-surface-secondary);
		box-shadow: 0 0 20px rgba(255, 159, 10, 0.06), inset 0 0 30px rgba(255, 159, 10, 0.02);
	}

	.sensor-card--selected {
		border-color: var(--color-primary);
		border-left-color: var(--color-primary);
		background: var(--color-primary-dim);
		box-shadow: 0 0 16px var(--color-primary-glow);
	}

	/* Barre de statut gauche */
	.sensor-status-bar {
		width: 48px;
		min-width: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		align-self: stretch;
		background: var(--color-overlay);
		border-right: 1px solid var(--color-border);
	}

	.status-led {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	/* Corps */
	.sensor-body {
		flex: 1;
		padding: 0.75rem 1rem;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.sensor-name-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.sensor-name {
		font-family: var(--font-display);
		font-size: 1.15rem;
		font-weight: 900;
		color: var(--color-text);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.status-tag {
		font-family: var(--font-mono);
		font-size: 0.62rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		font-weight: 600;
		padding: 2px 7px;
		flex-shrink: 0;
		border: 1px solid;
	}

	.sensor-topic {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--color-text-muted);
		letter-spacing: 0.02em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.sensor-arrow {
		padding: 0 1rem;
		font-size: 1.4rem;
		color: var(--color-text-muted);
		font-weight: 300;
		transition: color 0.15s, transform 0.15s;
		align-self: center;
	}

	.sensor-card:hover .sensor-arrow {
		color: var(--color-primary);
		transform: translateX(3px);
	}

	/* ── Statuts ── */
	@keyframes pulse-led {
		0%, 100% { opacity: 1; box-shadow: 0 0 6px currentColor; }
		50% { opacity: 0.4; box-shadow: 0 0 2px currentColor; }
	}

	.status-online .status-led {
		background: var(--color-success);
		color: var(--color-success);
		box-shadow: 0 0 8px var(--color-success);
	}
	.status-online .status-tag {
		color: var(--color-success);
		border-color: rgba(57, 255, 20, 0.3);
		background: var(--color-success-dim);
	}

	.status-publishing .status-led {
		background: var(--color-warning);
		color: var(--color-warning);
		animation: pulse-led 1.2s ease-in-out infinite;
	}
	.status-publishing .status-tag {
		color: var(--color-warning);
		border-color: rgba(255, 204, 0, 0.3);
		background: rgba(255, 204, 0, 0.08);
	}

	.status-offline .status-led {
		background: var(--color-danger);
		color: var(--color-danger);
	}
	.status-offline .status-tag {
		color: var(--color-danger);
		border-color: rgba(255, 64, 64, 0.3);
		background: var(--color-danger-dim);
	}

	.status-error .status-led,
	.status-unknown .status-led {
		background: var(--color-text-muted);
	}
	.status-error .status-tag,
	.status-unknown .status-tag {
		color: var(--color-text-muted);
		border-color: var(--color-border-bright);
	}
</style>
