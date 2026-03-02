<script lang="ts">
	import { defineComponent, ref } from "vue"
	import AdminRoleComponent from "@/components/AdminRole.vue"
	import AdminSensorAccess from "@/components/AdminSensorAccess.vue"
	import AdminSensorRequest from "@/components/AdminSensorRequest.vue"
	import AdminMeasurementTypeRequest from "@/components/AdminMeasurementTypeRequest.vue"
	import AdminActiveSessions from "@/components/AdminActiveSessions.vue"
	import AdminDiscoveredSensors from "@/components/AdminDiscoveredSensors.vue"

	const tabs = [
		{ key: "roles", label: "Rôles utilisateurs" },
		{ key: "access", label: "Accès capteurs" },
		{ key: "sensor-requests", label: "Création capteurs" },
		{ key: "measure-requests", label: "Types de mesure" },
		{ key: "sessions", label: "Sessions actives" },
		{ key: "discover", label: "Découverte" },
	] as const

	type TabKey = (typeof tabs)[number]["key"]

	export default defineComponent({
		name: "AdminView",
		components: {
			AdminRoleComponent,
			AdminSensorAccess,
			AdminSensorRequest,
			AdminMeasurementTypeRequest,
			AdminActiveSessions,
			AdminDiscoveredSensors,
		},
		setup() {
			const activeTab = ref<TabKey>("roles")

			return { tabs, activeTab }
		},
	})
</script>

<template>
	<div class="admin">
		<h1 class="admin-title">Administration</h1>

		<!-- Tabs -->
		<div class="tabs">
			<button
				v-for="tab in tabs"
				:key="tab.key"
				class="tab-btn"
				:class="{ active: activeTab === tab.key }"
				@click="activeTab = tab.key">
				{{ tab.label }}
			</button>
		</div>

		<!-- Content -->
		<div class="tab-content">
			<AdminRoleComponent v-if="activeTab === 'roles'" />
			<AdminSensorAccess v-else-if="activeTab === 'access'" />
			<AdminSensorRequest v-else-if="activeTab === 'sensor-requests'" />
			<AdminMeasurementTypeRequest v-else-if="activeTab === 'measure-requests'" />
			<AdminActiveSessions v-else-if="activeTab === 'sessions'" />
			<AdminDiscoveredSensors v-else-if="activeTab === 'discover'" />
		</div>
	</div>
</template>

<style scoped>
	.admin {
		padding: 2rem;
		max-width: 1100px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.admin-title {
		font-size: 1.8rem;
		font-weight: 700;
		margin: 0;
	}

	/* Tabs */
	.tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		border-bottom: 2px solid var(--color-border);
		padding-bottom: 0;
	}

	.tab-btn {
		padding: 0.6rem 1.25rem;
		font-size: 0.9rem;
		font-weight: 500;
		background: transparent;
		color: var(--color-text-muted);
		border: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
		border-radius: 0;
		cursor: pointer;
		white-space: nowrap;
		transition: color 0.15s, border-color 0.15s;
	}

	.tab-btn:hover {
		color: var(--color-text);
		background: transparent;
	}

	.tab-btn.active {
		color: var(--color-primary);
		border-bottom-color: var(--color-primary);
		background: transparent;
	}

	/* Content panel */
	.tab-content {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		padding: 1.5rem 2rem;
	}

	/* Dark theme override for all tables inside admin components */
	.tab-content :deep(h1),
	.tab-content :deep(h2) {
		font-size: 1rem;
		font-weight: 700;
		margin: 0 0 1rem;
		color: var(--color-text);
	}

	.tab-content :deep(table) {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.tab-content :deep(thead tr) {
		background: var(--color-background);
	}

	.tab-content :deep(th) {
		padding: 0.75rem 1rem;
		text-align: left;
		font-weight: 600;
		color: var(--color-text-muted);
		border-bottom: 1px solid var(--color-border);
		cursor: pointer;
		user-select: none;
		white-space: nowrap;
	}

	.tab-content :deep(th:hover) {
		color: var(--color-text);
	}

	.tab-content :deep(td) {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border);
		color: var(--color-text);
		vertical-align: middle;
	}

	.tab-content :deep(tbody tr:hover) {
		background: var(--color-surface-secondary);
	}

	/* Select filter */
	.tab-content :deep(select) {
		background: var(--color-surface-secondary);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 0.4rem 0.75rem;
		font-size: 0.875rem;
		margin-bottom: 1rem;
		cursor: pointer;
	}

	.tab-content :deep(label) {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	/* Action buttons inside tables */
	.tab-content :deep(td button) {
		padding: 4px 12px;
		font-size: 0.8rem;
		font-weight: 600;
		border-radius: 5px;
		border: none;
		cursor: pointer;
		transition: background-color 0.15s;
		/* Default: success (Accept column) */
		background-color: var(--color-success);
		color: white;
	}

	.tab-content :deep(td button:hover) {
		background-color: var(--color-success-hover);
	}

	/* 6th column = Reject */
	.tab-content :deep(tr td:nth-child(6) button) {
		background-color: var(--color-danger);
	}

	.tab-content :deep(tr td:nth-child(6) button:hover) {
		background-color: var(--color-danger-hover);
	}

	/* AdminRole form */
	.tab-content :deep(form) {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 400px;
	}

	.tab-content :deep(form label) {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.4rem;
	}

	.tab-content :deep(form select) {
		width: 100%;
		margin-bottom: 0;
	}

	.tab-content :deep(form button[type="submit"]) {
		padding: 8px 20px;
		background-color: var(--color-primary);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		align-self: flex-start;
		transition: background-color 0.2s;
	}

	.tab-content :deep(form button[type="submit"]:hover) {
		background-color: var(--color-primary-hover);
	}
</style>
