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

			const sensor = computed(() => {
				return sensors.value.find((s: Sensor) => s.id === props.id)
			})

			const goToSession = () => {
				router.push({ name: "newsession", params: { id: props.id } })
			}

			return { sensor, sessions, goToSession, hasActiveSession }
		},
	})
</script>

<template>
	<div class="sensor-detail">
		<div v-if="sensor">
			<!-- Header : infos capteur -->
			<div class="sensor-header">
				<SensorCard
					:sensor="sensor"
					:is-for-navigation="false" />
				<button
					class="btn-new-session"
					:class="{ 'btn-active-session': hasActiveSession }"
					@click="goToSession">
					{{ hasActiveSession ? "Voir la session actuelle" : "+ Nouvelle session" }}
				</button>
			</div>

			<!-- Sessions -->
			<div class="sessions-section">
				<h2>Sessions passées</h2>

				<div
					v-if="sessions.length === 0"
					class="empty-state">
					Aucune session pour ce capteur.
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
			Capteur introuvable.
		</div>
	</div>
</template>

<style scoped>
	.sensor-detail {
		padding: 2rem;
		max-width: 960px;
		margin: 0 auto;
	}

	/* Header */
	.sensor-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		background: var(--color-surface);
		border-radius: 12px;
		padding: 1.25rem 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
	}

	/* Retire le style "card" du SensorCard quand il est dans le header */
	.sensor-header :deep(.sensor-card) {
		border: none;
		box-shadow: none;
		padding: 0;
		margin: 0;
		background: transparent;
	}

	.sensor-header :deep(.sensor-name) {
		white-space: nowrap;
		font-size: 1.2rem;
	}

	.btn-new-session {
		padding: 10px 20px;
		background-color: var(--color-success);
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.95rem;
		white-space: nowrap;
		flex-shrink: 0;
		transition: background-color 0.2s;
	}

	.btn-new-session:hover {
		background-color: var(--color-success-hover);
	}

	.btn-active-session {
		background-color: var(--color-primary);
	}

	.btn-active-session:hover {
		background-color: var(--color-primary-hover, var(--color-primary));
	}

	/* Sessions */
	.sessions-section {
		background: var(--color-surface);
		border-radius: 12px;
		padding: 1.5rem 2rem;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
	}

	.sessions-section h2 {
		font-size: 1.1rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: var(--color-text);
	}

	.sessions-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	/* Override SessionCard style for this page only */
	.sessions-list :deep(.session-container) {
		background: var(--color-surface-secondary);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		padding: 1rem 1.25rem;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.sessions-list :deep(.session-date) {
		font-size: 0.95rem;
		font-weight: 600;
	}

	.sessions-list :deep(.session-duration),
	.sessions-list :deep(.session-active) {
		font-size: 0.85rem;
	}

	.sessions-list :deep(.btn-export) {
		padding: 8px 16px;
		font-size: 0.85rem;
		flex-shrink: 0;
	}

	.empty-state {
		color: var(--color-text-muted);
		text-align: center;
		padding: 3rem 2rem;
		border-radius: 12px;
		border: 1px dashed var(--color-border);
		background: var(--color-surface);
	}
</style>
