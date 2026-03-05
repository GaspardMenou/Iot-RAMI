<template>
	<div class="container">
		<div class="header">
			<h2 v-if="sessions.length > 0">There are {{ sessions.length }} sessions</h2>
			<h2 v-else>There are no sessions</h2>
			<hr />
		</div>
		<div
			class="content"
			v-if="sessions.length > 0">
			<div class="sessions-list">
				<div
					v-for="session in sessions"
					:key="session.id"
					@click="handleSessionSelect(session.id)"
					:class="{ 'session-card--selected': selectedSession === session.id }"
					class="session-card">
					<SessionCard :session="session" />
				</div>
			</div>
			<div class="graph">
				<Graph :chartData="chartData" />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { defineComponent, provide, onMounted, onUnmounted } from "vue"
	import SessionCard from "@/components/session/SessionCard.vue"
	import Graph from "@/components/session/Graph.vue"
	import { useSession } from "@/composables/useSession.composable"

	export default defineComponent({
		components: {
			SessionCard,
			Graph,
		},
		setup() {
			const { chartData, sessions, selectedSession, handleSessionSelect, registerOrRemoveEventHandlers } = useSession()

			provide("title", "Session Chart")
			provide("chartData", chartData)

			onMounted(() => {
				registerOrRemoveEventHandlers("on")
			})

			onUnmounted(() => {
				registerOrRemoveEventHandlers("off")
			})

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
	.container {
		display: flex;
		flex-direction: column;
		background-color: var(--color-surface);
		border-radius: 12px;
		box-shadow: 0 2px 8px var(--color-shadow);
		padding: 1.5rem;
		width: 100%;
		margin: auto;
	}

	.header {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 1rem;
	}

	.header h2 {
		font-size: 1.1rem;
		font-weight: 700;
		margin: 0;
		color: var(--color-text);
	}

	.header hr {
		width: 100%;
		border: none;
		border-top: 1px solid var(--color-border);
		margin: 0.75rem 0;
	}

	.content {
		display: flex;
		flex-direction: row;
		gap: 1rem;
		width: 100%;
		height: 520px;
		overflow: hidden;
	}

	.sessions-list {
		display: flex;
		flex-direction: column;
		width: 220px;
		min-width: 220px;
		overflow-y: auto;
		gap: 0.5rem;
	}

	.graph {
		flex: 1;
		min-width: 0;
	}

	.session-card {
		border: 1px solid var(--color-border);
		padding: 0.75rem;
		background-color: var(--color-surface-secondary);
		border-radius: 8px;
		cursor: pointer;
		transition: background-color 0.2s, border-color 0.2s;
	}

	.session-card:hover {
		border-color: var(--color-primary);
	}

	.session-card--selected {
		border-color: var(--color-primary);
		background-color: rgba(14, 165, 233, 0.1);
	}
</style>
