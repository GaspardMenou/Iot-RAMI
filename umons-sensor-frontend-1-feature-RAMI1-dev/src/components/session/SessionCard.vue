<template>
	<div class="session-container">
		<p>{{ formatHumanReadableDate(session.createdAt) }}</p>
		<p v-if="session.endedAt">Durée: {{ calculateDuration(session.createdAt, session.endedAt) }}</p>
		<button @click.stop="exportSessionToCsv(session.id)">Export CSV</button>
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

<style lang="scss" scoped>
	.session-container {
		padding: 5px;
		margin-bottom: 10px;
		border-radius: 0px;
	}
	button {
		margin-top: 10px;
		padding: 6px 14px;
		font-size: 0.85em;
		font-weight: 600;
		letter-spacing: 0.03em;
		border: none;
		border-radius: 6px;
		background-color: #007bff;
		color: white;
		cursor: pointer;
		transition: background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);

		&:hover {
			background-color: #0069d9;
			box-shadow: 0 4px 8px rgba(0, 123, 255, 0.4);
		}

		&:active {
			transform: translateY(1px);
			box-shadow: 0 1px 2px rgba(0, 123, 255, 0.3);
		}
	}
</style>
