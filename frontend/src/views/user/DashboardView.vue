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
		<div class="greeting-block">
			<div class="greeting-label">TERMINAL RAMI — ACCÈS AUTORISÉ</div>
			<h1 class="greeting-name">{{ firstName.toUpperCase() }}</h1>
			<div class="greeting-line" />
		</div>

		<!-- Stats -->
		<div class="stats-row">
			<div class="stat-card">
				<span class="stat-num">{{ String(sensors.length).padStart(2, '0') }}</span>
				<span class="stat-label">CAPTEURS</span>
			</div>
			<div class="stat-card">
				<span class="stat-num">{{ String(allSessions.length).padStart(2, '0') }}</span>
				<span class="stat-label">SESSIONS TOTAL</span>
			</div>
			<div class="stat-card stat-card--live">
				<span class="stat-num">{{ String(allSessions.filter(s => !s.endedAt).length).padStart(2, '0') }}</span>
				<span class="stat-label">EN COURS</span>
			</div>
		</div>

		<!-- Capteurs — navigation rapide -->
		<section class="section">
			<div class="section-header">
				<h2>ACCÈS RAPIDE AUX CAPTEURS</h2>
				<span class="section-hint">CLIQUER POUR ACCÉDER AU DÉTAIL</span>
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
		max-width: 1000px;
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
		gap: 4px;
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

	/* Section capteurs */
	.section {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.65rem 1rem;
		background: rgba(0,0,0,0.2);
		border: 1px solid var(--color-border);
		border-bottom: none;
	}

	.section-header h2 {
		font-family: var(--font-display);
		font-size: 0.85rem;
		font-weight: 900;
		letter-spacing: 0.15em;
		color: var(--color-text-muted);
		text-transform: uppercase;
	}

	.section-hint {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		color: var(--color-primary);
		letter-spacing: 0.1em;
		opacity: 0.5;
	}

	/* Grille capteurs — navigation */
	.sensors-grid {
		display: flex;
		flex-direction: column;
		gap: 0;
		border: 1px solid var(--color-border);
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
