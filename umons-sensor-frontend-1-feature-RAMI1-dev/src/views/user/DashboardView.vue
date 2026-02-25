<script lang="ts">
	import { defineComponent, onMounted, ref } from "vue"
	import { useSensor } from "@/composables/useSensor.composable"
	import { useAxios } from "@/composables/useAxios.composable"
	import { UserFields } from "#/user"
	import SensorCard from "@/components/sensor/SensorCard.vue"
	import type { Session } from "#/session"

	export default defineComponent({
		name: "DashboardView",
		components: { SensorCard },
		setup() {
			const { fetchSensors, sensors } = useSensor(undefined)
			const { axios } = useAxios()

			const allSessions = ref<Session[]>([])
			const firstName = localStorage.getItem(UserFields.FIRST_NAME) || "vous"
			const userId = localStorage.getItem(UserFields.ID)

			onMounted(async () => {
				await fetchSensors()
				try {
					const { data } = await axios.get(`users/${userId}/sessions`)
					allSessions.value = data
				} catch (e) {
					console.error("Erreur lors du chargement des sessions:", e)
				}
			})

			return {
				sensors,
				allSessions,
				firstName,
			}
		},
	})
</script>

<template>
	<div class="dashboard">
		<!-- Greeting -->
		<div class="greeting">
			<h1>Bonjour, {{ firstName }}</h1>
			<p class="subtitle">Voici un aperçu de vos capteurs et sessions.</p>
		</div>

		<!-- Stats -->
		<div class="stats-row">
			<div class="stat-card">
				<span class="stat-value">{{ sensors.length }}</span>
				<span class="stat-label">Capteur{{ sensors.length !== 1 ? "s" : "" }}</span>
			</div>
			<div class="stat-card">
				<span class="stat-value">{{ allSessions.length }}</span>
				<span class="stat-label">Session{{ allSessions.length !== 1 ? "s" : "" }}</span>
			</div>
			<div class="stat-card">
				<span class="stat-value">
					{{ allSessions.filter(s => !s.endedAt).length }}
				</span>
				<span class="stat-label">En cours</span>
			</div>
		</div>

		<!-- Sensors -->
		<section class="section">
			<h2 class="section-title">Mes capteurs</h2>
			<div
				v-if="sensors.length === 0"
				class="empty-state">
				Aucun capteur accessible.
			</div>
			<div
				v-else
				class="sensors-grid">
				<SensorCard
					v-for="sensor in sensors"
					:key="sensor.id"
					:sensor="sensor"
					:is-for-navigation="true" />
			</div>
		</section>

	</div>
</template>

<style scoped>
	.dashboard {
		padding: 2rem;
		max-width: 1100px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	/* Greeting */
	.greeting h1 {
		font-size: 1.8rem;
		font-weight: 700;
		margin: 0 0 0.25rem;
	}

	.subtitle {
		color: var(--color-text-muted);
		margin: 0;
	}

	/* Stats */
	.stats-row {
		display: flex;
		gap: 1rem;
	}

	.stat-card {
		flex: 1;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		padding: 1.25rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-primary);
		line-height: 1;
	}

	.stat-label {
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	/* Sections */
	.section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section-title {
		font-size: 1.1rem;
		font-weight: 700;
		margin: 0;
		color: var(--color-text);
	}

	/* Sensors grid */
	.sensors-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 1rem;
	}

	/* Empty state */
	.empty-state {
		color: var(--color-text-muted);
		text-align: center;
		padding: 2rem;
		border: 1px dashed var(--color-border);
		border-radius: 10px;
		background: var(--color-surface);
	}
</style>
