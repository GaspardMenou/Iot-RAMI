<template>
	<div class="session-container">
		<div class="session-info">
			<span class="session-date">{{ formatHumanReadableDate(session.createdAt) }}</span>
			<span
				v-if="session.endedAt"
				class="session-duration">{{ calculateDuration(session.createdAt, session.endedAt) }}</span>
			<span
				v-else
				class="session-active">En cours</span>
		</div>
		<button
			class="btn-export"
			@click.stop="exportSessionToCsv(session.id)">
			Export CSV
		</button>
	</div>
</template>

<script lang="ts">
	import { defineComponent } from "vue"
	import { useSensor } from "@/composables/useSensor.composable"
	import { useSession } from "@/composables/useSession.composable"

	export default defineComponent({
		props: {
			session: {
				type: Object,
				required: true,
			},
		},
		setup() {
			const { calculateDuration, formatHumanReadableDate } = useSensor(undefined)
			const { exportSessionToCsv } = useSession()

			return {
				calculateDuration,
				formatHumanReadableDate,
				exportSessionToCsv,
			}
		},
	})
</script>

<style scoped>
	.session-container {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.25rem 0;
	}

	.session-info {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}

	.session-date {
		font-size: 0.78rem;
		color: var(--color-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.session-duration {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.session-active {
		font-size: 0.75rem;
		color: var(--color-success);
		font-weight: 600;
	}

	.btn-export {
		padding: 4px 10px;
		font-size: 0.75rem;
		font-weight: 600;
		border: none;
		border-radius: 6px;
		background-color: var(--color-primary);
		color: white;
		cursor: pointer;
		align-self: flex-start;
		transition: background-color 0.2s;
	}

	.btn-export:hover {
		background-color: var(--color-primary-hover);
	}
</style>
