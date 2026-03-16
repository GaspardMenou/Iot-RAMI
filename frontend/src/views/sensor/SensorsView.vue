<template>
	<div class="sensors-view">
		<!-- En-tête page -->
		<div class="view-header">
			<div class="view-header-left">
				<div class="view-breadcrumb">
					<span class="breadcrumb-root">RAMI</span>
					<span class="breadcrumb-sep">/</span>
					<span class="breadcrumb-current">CAPTEURS</span>
				</div>
				<h1 class="view-title">MES CAPTEURS</h1>
				<span class="view-sub">GESTION & HISTORIQUE DES SESSIONS</span>
			</div>
			<div class="view-header-right">
				<div class="status-summary">
					<div class="status-pill status-pill--online">
						<span class="pill-dot" />
						<span class="pill-label">EN LIGNE</span>
					</div>
					<div class="status-pill status-pill--offline">
						<span class="pill-dot" />
						<span class="pill-label">HORS LIGNE</span>
					</div>
					<div class="status-pill status-pill--unknown">
						<span class="pill-dot" />
						<span class="pill-label">INCONNU</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Grille principale -->
		<div class="sensors-grid">
			<div class="sensors-list-container">
				<SensorsList :standalone="true" />
			</div>
			<div class="sessions-list-container">
				<SessionList />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { defineComponent } from "vue"
	import SensorsList from "@/components/sensor/SensorsList.vue"
	import SessionList from "@/components/session/SessionsList.vue"

	export default defineComponent({
		name: "SensorsView",
		components: {
			SensorsList,
			SessionList,
		},
	})
</script>

<style scoped>
	.sensors-view {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
		flex: 1;
		min-height: 0;
	}

	/* ── En-tête ── */
	.view-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-border);
		flex-wrap: wrap;
	}

	.view-header-left {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.view-breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-family: var(--font-mono);
		font-size: 0.58rem;
		letter-spacing: 0.14em;
		color: var(--color-text-muted);
		text-transform: uppercase;
		margin-bottom: 2px;
	}

	.breadcrumb-sep {
		opacity: 0.4;
	}

	.breadcrumb-current {
		color: var(--color-primary);
	}

	.view-title {
		font-family: var(--font-display);
		font-size: 2.4rem;
		font-weight: 900;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		line-height: 1;
		color: var(--color-text);
	}

	.view-sub {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		color: var(--color-text-muted);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		display: block;
		margin-top: 4px;
	}

	/* ── Capsules de statut ── */
	.view-header-right {
		flex-shrink: 0;
		padding-bottom: 4px;
	}

	.status-summary {
		display: flex;
		flex-direction: column;
		gap: 4px;
		align-items: flex-end;
	}

	.status-pill {
		display: flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font-mono);
		font-size: 0.58rem;
		letter-spacing: 0.12em;
		color: var(--color-text-muted);
		padding: 2px 8px 2px 6px;
		border: 1px solid var(--color-border);
		background: var(--color-surface-secondary);
	}

	.pill-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.status-pill--online .pill-dot {
		background: var(--color-success);
		box-shadow: 0 0 4px var(--color-success);
	}

	.status-pill--offline .pill-dot {
		background: var(--color-danger);
	}

	.status-pill--unknown .pill-dot {
		background: var(--color-text-muted);
	}

	/* ── Grille ── */
	.sensors-grid {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		flex: 1;
		min-height: 0;
	}

	.sensors-list-container {
		width: 100%;
	}

	.sessions-list-container {
		width: 100%;
		flex: 1;
		min-height: 500px;
		display: flex;
		flex-direction: column;
	}

	@media (max-width: 600px) {
		.view-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.status-summary {
			flex-direction: row;
			flex-wrap: wrap;
			align-items: flex-start;
		}
	}
</style>
