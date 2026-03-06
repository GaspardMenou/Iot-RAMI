<template>
	<div class="sessions-panel">
		<div class="panel-header">
			<h2>HISTORIQUE DES SESSIONS</h2>
			<span class="session-count">{{ sessions.length }} ENREG.</span>
		</div>

		<div
			v-if="sessions.length > 0"
			class="panel-body">

			<!-- Liste des sessions -->
			<div class="sessions-list">
				<div
					v-for="session in sessions"
					:key="session.id"
					class="session-row"
					:class="{ 'session-row--selected': selectedSession === session.id }"
					@click="handleSessionSelect(session.id)">
					<SessionCard :session="session" />
				</div>
			</div>

			<!-- Graphique -->
			<div class="graph-area">
				<div
					v-if="!selectedSession"
					class="graph-placeholder">
					<span class="placeholder-arrow">←</span>
					<span class="placeholder-text">SÉLECTIONNER UNE SESSION</span>
				</div>
				<Graph
					v-else
					:chartData="chartData" />
			</div>
		</div>

		<div
			v-else
			class="empty-state">
			AUCUNE SESSION ENREGISTRÉE
		</div>
	</div>
</template>

<script lang="ts">
	import { defineComponent, provide, onMounted, onUnmounted } from "vue"
	import SessionCard from "@/components/session/SessionCard.vue"
	import Graph from "@/components/session/Graph.vue"
	import { useSession } from "@/composables/useSession.composable"

	export default defineComponent({
		components: { SessionCard, Graph },
		setup() {
			const { chartData, sessions, selectedSession, handleSessionSelect, registerOrRemoveEventHandlers } = useSession()

			provide("title", "HISTORIQUE SESSION")
			provide("chartData", chartData)

			onMounted(() => registerOrRemoveEventHandlers("on"))
			onUnmounted(() => registerOrRemoveEventHandlers("off"))

			return {
				sessions,
				chartData,
				selectedSession,
				handleSessionSelect,
			}
		},
	})
</script>

<style scoped>
	.sessions-panel {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		width: 100%;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
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

	.panel-body {
		display: flex;
		flex-direction: row;
		gap: 0;
		height: 500px;
		overflow: hidden;
	}

	/* Liste */
	.sessions-list {
		width: 220px;
		min-width: 220px;
		overflow-y: auto;
		border-right: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.sessions-list > *:not(:last-child) {
		border-bottom: 1px solid var(--color-border);
	}

	.session-row {
		cursor: pointer;
		transition: background-color 0.1s;
		border-left: 2px solid transparent;
	}

	.session-row:hover {
		background: rgba(255, 159, 10, 0.04);
	}

	.session-row--selected {
		background: var(--color-primary-dim);
		border-left-color: var(--color-primary);
	}

	/* Graphique */
	.graph-area {
		flex: 1;
		min-width: 0;
		padding: 0;
	}

	.graph-area :deep(.graph-container) {
		height: 100%;
		border: none;
		border-top: none;
	}

	.graph-area :deep(.chart-wrapper) {
		height: calc(100% - 44px);
	}

	/* Placeholder graphique */
	.graph-placeholder {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		color: var(--color-text-muted);
		opacity: 0.5;
	}

	.placeholder-arrow {
		font-family: var(--font-mono);
		font-size: 2rem;
		animation: nudge 2s ease-in-out infinite;
	}

	.placeholder-text {
		font-family: var(--font-mono);
		font-size: 0.65rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	@keyframes nudge {
		0%, 100% { transform: translateX(0); }
		50% { transform: translateX(-6px); }
	}

	@media (max-width: 600px) {
		.panel-body {
			flex-direction: column;
			height: auto;
		}

		.sessions-list {
			width: 100%;
			min-width: unset;
			max-height: 220px;
			border-right: none;
			border-bottom: 1px solid var(--color-border);
		}

		.graph-area {
			height: 320px;
		}

		.graph-placeholder {
			height: 320px;
		}
	}

	/* Empty */
	.empty-state {
		padding: 3rem;
		text-align: center;
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
</style>
