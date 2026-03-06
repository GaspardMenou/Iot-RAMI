<template>
	<div class="sensors-view">
		<div class="view-header">
			<h1>MES CAPTEURS</h1>
			<span class="view-sub">GESTION & HISTORIQUE DES SESSIONS</span>
		</div>
		<div class="sensors-list-container">
			<SensorsList />
		</div>
		<div class="sessions-list-container">
			<SessionList />
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
		max-width: 900px;
	}

	.view-header {
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-border);
	}

	.view-header h1 {
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

	.sensors-list-container,
	.sessions-list-container {
		width: 100%;
	}
</style>
