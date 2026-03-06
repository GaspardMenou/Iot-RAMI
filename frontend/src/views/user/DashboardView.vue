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

		<!-- Accueil -->
		<div class="greeting-block">
			<div class="greeting-label">TERMINAL RAMI — ACCÈS AUTORISÉ</div>
			<h1 class="greeting-name">{{ firstName.toUpperCase() }}</h1>
			<div class="greeting-line" />
		</div>

		<!-- Stats -->
		<div class="stats-row">
			<div class="stat-card">
				<span class="stat-num">{{ String(sensors.length).padStart(2, "0") }}</span>
				<span class="stat-label">CAPTEURS</span>
			</div>
			<div class="stat-card">
				<span class="stat-num">{{ String(allSessions.length).padStart(2, "0") }}</span>
				<span class="stat-label">SESSIONS TOTAL</span>
			</div>
			<div class="stat-card stat-card--live">
				<span class="stat-num">{{ String(allSessions.filter(s => !s.endedAt).length).padStart(2, "0") }}</span>
				<span class="stat-label">EN COURS</span>
			</div>
		</div>

		<!-- Capteurs -->
		<section class="section">
			<div class="section-header">
				<h2>CAPTEURS ASSIGNÉS</h2>
				<span class="section-count">{{ sensors.length }} UNIT{{ sensors.length > 1 ? "S" : "" }}</span>
			</div>

			<div
				v-if="sensors.length === 0"
				class="empty-state">
				AUCUN CAPTEUR ACCESSIBLE
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
		max-width: 1100px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	/* Greeting */
	.greeting-block {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.greeting-label {
		font-family: var(--font-mono);
		font-size: 0.62rem;
		color: var(--color-primary);
		letter-spacing: 0.2em;
		text-transform: uppercase;
		opacity: 0.6;
	}

	.greeting-name {
		font-family: var(--font-display);
		font-size: clamp(2.5rem, 6vw, 4rem);
		font-weight: 900;
		color: var(--color-text);
		letter-spacing: 0.05em;
		text-transform: uppercase;
		line-height: 1;
		text-shadow: 0 0 40px rgba(255, 159, 10, 0.08);
	}

	.greeting-line {
		height: 1px;
		background: linear-gradient(to right, var(--color-primary), rgba(255, 159, 10, 0.15), transparent);
		margin-top: 4px;
	}

	/* Stats */
	.stats-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1px;
		background: var(--color-border);
		border: 1px solid var(--color-border);
	}

	.stat-card {
		background: var(--color-surface);
		padding: 1.25rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 6px;
		transition: background-color 0.15s;
	}

	.stat-card:hover {
		background: var(--color-surface-secondary);
	}

	.stat-card--live .stat-num {
		color: var(--color-success);
		text-shadow: 0 0 20px rgba(57, 255, 20, 0.3);
	}

	.stat-num {
		font-family: var(--font-display);
		font-size: 3rem;
		font-weight: 900;
		color: var(--color-primary);
		line-height: 1;
		text-shadow: 0 0 20px var(--color-primary-glow);
	}

	.stat-label {
		font-family: var(--font-mono);
		font-size: 0.62rem;
		color: var(--color-text-muted);
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	/* Section */
	.section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-border);
	}

	.section-header h2 {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 900;
		letter-spacing: 0.14em;
		color: var(--color-text-muted);
		text-transform: uppercase;
	}

	.section-count {
		font-family: var(--font-mono);
		font-size: 0.62rem;
		color: var(--color-primary);
		opacity: 0.6;
		letter-spacing: 0.1em;
	}

	/* Grille capteurs */
	.sensors-grid {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.sensors-grid > *:not(:last-child) {
		border-bottom: 1px solid var(--color-border);
	}

	/* Empty state */
	.empty-state {
		padding: 2.5rem;
		text-align: center;
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		border: 1px dashed var(--color-border-bright);
	}

	@media (max-width: 600px) {
		.stats-row {
			grid-template-columns: 1fr;
		}

		.stat-num {
			font-size: 2rem;
		}
	}
</style>
