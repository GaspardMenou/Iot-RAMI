<script lang="ts">
	import { defineComponent, onMounted, computed, ref } from "vue"
	import { useRouter } from "vue-router"
	import { useSensor } from "@/composables/useSensor.composable"
	import { useSession } from "@/composables/useSession.composable"
	import { useAxios } from "@/composables/useAxios.composable"
	import SensorCard from "@/components/sensor/SensorCard.vue"
	import SessionCard from "@/components/session/SessionCard.vue"
	import type { Sensor } from "#/sensor"

	export default defineComponent({
		name: "SensorDetailView",
		components: { SensorCard, SessionCard },
		props: {
			id: { type: String, required: true },
		},
		setup(props) {
			const router = useRouter()
			const { axios } = useAxios()
			const { fetchSensors, sensors } = useSensor(undefined)
			const { sessions, fetchAllSessionsOfSensor } = useSession()
			const hasActiveSession = ref(false)

			onMounted(async () => {
				await fetchSensors()
				await fetchAllSessionsOfSensor(props.id)
				try {
					const { data } = await axios.get("sessions/active")
					hasActiveSession.value = data.some((s: any) => s.idSensor === props.id)
				} catch {
					hasActiveSession.value = false
				}
			})

			const sensor = computed(() => sensors.value.find((s: Sensor) => s.id === props.id))
			const goToSession = () => router.push({ name: "newsession", params: { id: props.id } })

			return { sensor, sessions, goToSession, hasActiveSession }
		},
	})
</script>

<template>
	<div class="sensor-detail">
		<div v-if="sensor">

			<!-- En-tête capteur -->
			<div class="detail-header">
				<div class="detail-sensor-info">
					<SensorCard
						:sensor="sensor"
						:is-for-navigation="false" />
				</div>
				<button
					class="btn-session"
					:class="{ 'btn-session--active': hasActiveSession }"
					@click="goToSession">
					<span class="btn-session-icon">{{ hasActiveSession ? '◉' : '+' }}</span>
					{{ hasActiveSession ? "SESSION EN COURS" : "NOUVELLE SESSION" }}
				</button>
			</div>

			<!-- Sessions -->
			<div class="sessions-panel">
				<div class="panel-header">
					<h2>SESSIONS PASSÉES</h2>
					<span class="session-count">{{ sessions.length }} ENREG.</span>
					<span class="session-hint">→ MES CAPTEURS POUR REJOUER</span>
				</div>

				<div
					v-if="sessions.length === 0"
					class="empty-state">
					AUCUNE SESSION ENREGISTRÉE POUR CE CAPTEUR
				</div>

				<div
					v-else
					class="sessions-list">
					<SessionCard
						v-for="session in sessions"
						:key="session.id"
						:session="session" />
				</div>
			</div>
		</div>

		<div
			v-else
			class="empty-state">
			CAPTEUR INTROUVABLE
		</div>
	</div>
</template>

<style scoped>
	.sensor-detail {
		max-width: 900px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* En-tête */
	.detail-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		justify-content: space-between;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		padding: 1rem 1.25rem;
		flex-wrap: wrap;
	}

	.detail-sensor-info {
		flex: 1;
		min-width: 0;
	}

	.detail-sensor-info :deep(.sensor-card) {
		border: none;
		background: transparent;
		box-shadow: none;
		padding-left: 0;
	}

	.detail-sensor-info :deep(.status-tag) {
		display: none;
	}

	.btn-session {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.65rem 1.25rem;
		background: var(--color-success-dim);
		border: 1px solid rgba(57, 255, 20, 0.35);
		color: var(--color-success);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		cursor: pointer;
		transition: all 0.15s;
		border-radius: 0;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.btn-session:hover {
		background: var(--color-success);
		border-color: var(--color-success);
		color: #070600;
		box-shadow: 0 0 16px rgba(57, 255, 20, 0.25);
	}

	.btn-session--active {
		background: var(--color-primary-dim);
		border-color: rgba(255, 159, 10, 0.35);
		color: var(--color-primary);
	}

	.btn-session--active:hover {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: var(--color-text-second);
		box-shadow: 0 0 16px var(--color-primary-glow);
	}

	.btn-session-icon {
		font-size: 0.85rem;
	}

	/* Panel sessions */
	.sessions-panel {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		overflow: hidden;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1.25rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface-secondary);
	}

	.panel-header h2 {
		font-family: var(--font-display);
		font-size: 0.9rem;
		font-weight: 900;
		letter-spacing: 0.15em;
		color: var(--color-text-muted);
	}

	.session-count {
		font-family: var(--font-mono);
		font-size: 0.62rem;
		color: var(--color-text-muted);
		letter-spacing: 0.1em;
	}

	.session-hint {
		font-family: var(--font-mono);
		font-size: 0.58rem;
		color: var(--color-primary);
		letter-spacing: 0.1em;
		opacity: 0.45;
		margin-left: auto;
	}

	.sessions-list {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.sessions-list > *:not(:last-child) {
		border-bottom: 1px solid var(--color-border);
	}

	.empty-state {
		padding: 3rem;
		text-align: center;
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		border: 1px dashed var(--color-border-bright);
	}

	@media (max-width: 600px) {
		.session-hint {
			display: none;
		}

		.detail-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.btn-session {
			width: 100%;
			justify-content: center;
		}
	}
</style>
