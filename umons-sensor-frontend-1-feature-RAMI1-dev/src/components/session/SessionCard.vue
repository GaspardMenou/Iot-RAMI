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
