<script lang="ts">
	import { defineComponent, onMounted, ref } from "vue"
	import { useRouter } from "vue-router"
	import { useSensor } from "@/composables/useSensor.composable"
	import { useAxios } from "@/composables/useAxios.composable"
	import { UserFields } from "#/user"
	import SensorCard from "@/components/sensor/SensorCard.vue"

	export default defineComponent({
		name: "DashboardView",
		components: { SensorCard },
		setup() {
			const { fetchSensors, sensors } = useSensor(undefined)
			const { axios } = useAxios()
			const router = useRouter()

			const totalSessions = ref(0)
			const activeSessions = ref(0)
			const firstName = localStorage.getItem(UserFields.FIRST_NAME) || "vous"
			const userId = localStorage.getItem(UserFields.ID)
			const isLoading = ref(true)

			onMounted(async () => {
				try {
					await fetchSensors()
					const [sessionsRes, activeRes] = await Promise.all([axios.get(`users/${userId}/sessions?page=1&limit=1`), axios.get("sessions/active")])
					const payload = sessionsRes.data
					totalSessions.value = payload.total ?? (Array.isArray(payload) ? payload.length : 0)
					activeSessions.value = Array.isArray(activeRes.data) ? activeRes.data.length : 0
				} catch (e) {
					console.error("Erreur lors du chargement des sessions:", e)
				} finally {
					isLoading.value = false
				}
			})

			return {
				sensors,
				totalSessions,
				activeSessions,
				firstName,
				isLoading,
				goToSensors: () => router.push({ name: "sensors" }),
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
			<div
				class="stat-card stat-card--link"
				title="Voir mes capteurs"
				@click="goToSensors">
				<span
					v-if="isLoading"
					class="stat-num stat-skeleton"
					>--</span
				>
				<span
					v-else
					class="stat-num"
					>{{ String(sensors.length).padStart(2, "0") }}</span
				>
				<span class="stat-label">CAPTEURS</span>
			</div>
			<div
				class="stat-card stat-card--link"
				title="Voir l'historique des sessions"
				@click="goToSensors">
				<span
					v-if="isLoading"
					class="stat-num stat-skeleton"
					>--</span
				>
				<span
					v-else
					class="stat-num"
					>{{ String(totalSessions).padStart(2, "0") }}</span
				>
				<span class="stat-label">SESSIONS TOTAL</span>
			</div>
			<div
				class="stat-card stat-card--live stat-card--link"
				title="Voir les sessions en cours"
				@click="goToSensors">
				<span
					v-if="isLoading"
					class="stat-num stat-skeleton"
					>--</span
				>
				<span
					v-else
					class="stat-num"
					>{{ String(activeSessions).padStart(2, "0") }}</span
				>
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
				v-if="isLoading"
				class="sensors-loading">
				<div
					v-for="i in 3"
					:key="i"
					class="sensor-skeleton" />
			</div>

			<div
				v-else-if="sensors.length === 0"
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
		max-width: 1400px;
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
		padding: 2rem 2.5rem;
		display: flex;
		flex-direction: column;
		gap: 4px;
		transition: background-color 0.15s;
	}

	.stat-card--link {
		cursor: pointer;
	}

	.stat-card--link:hover {
		background: var(--color-surface-secondary);
		outline: 1px solid var(--color-border-bright);
	}

	.stat-card--link:hover .stat-label::after {
		content: " →";
		opacity: 0.5;
	}

	.stat-skeleton {
		opacity: 0.2;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.2;
		}
		50% {
			opacity: 0.5;
		}
	}

	.stat-card--live .stat-num {
		color: var(--color-success);
		text-shadow: 0 0 20px var(--color-success-dim);
	}

	.stat-num {
		font-family: var(--font-display);
		font-size: 4rem;
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
		background: var(--color-surface-secondary);
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
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0;
		border: 1px solid var(--color-border);
	}

	.sensors-grid > * {
		border-bottom: 1px solid var(--color-border);
		border-right: 1px solid var(--color-border);
	}

	.sensors-grid > *:nth-child(2n) {
		border-right: none;
	}

	/* Skeleton loaders */
	.sensors-loading {
		display: flex;
		flex-direction: column;
		gap: 0;
		border: 1px solid var(--color-border);
	}

	.sensor-skeleton {
		height: 64px;
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
		animation: shimmer 1.5s ease-in-out infinite;
		background-image: linear-gradient(90deg, var(--color-surface) 0%, var(--color-surface-secondary) 50%, var(--color-surface) 100%);
		background-size: 200% 100%;
	}

	.sensor-skeleton:last-child {
		border-bottom: none;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
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
			grid-template-columns: repeat(3, 1fr);
		}

		.stat-card {
			padding: 0.75rem;
		}

		.stat-num {
			font-size: 2rem;
		}

		.section-hint {
			display: none;
		}
	}
</style>
