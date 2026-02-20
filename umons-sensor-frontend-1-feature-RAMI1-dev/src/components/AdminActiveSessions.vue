<script lang="ts">
	import { defineComponent } from "vue"
	import { useAxios } from "@/composables/useAxios.composable"
	import type { Session } from "#/session"
	export default defineComponent({
		name: "AdminActiveSessions",
		data() {
			return {
				activeSessions: [] as Session[],
			}
		},
		methods: {
			async fetchActiveSessions() {
				try {
					const { axios } = useAxios()
					const { data } = await axios.get("/sessions/active")
					this.activeSessions = data
				} catch (error) {
					alert("Error fetching active sessions: " + error)
				}
			},
		},
		mounted() {
			this.fetchActiveSessions()
		},
	})
</script>

<template>
	<div class="admin-active-sessions">
		<h2>Active Sessions</h2>
		<table class="session-table">
			<thead>
				<tr>
					<th>Session ID</th>
					<th>User ID</th>
					<th>Start Time</th>
				</tr>
			</thead>
			<tbody>
				<tr
					v-for="session in activeSessions"
					:key="session.id">
					<td>{{ session.id }}</td>
					<td>{{ session.idUser }}</td>
					<td>{{ new Date(session.createdAt).toLocaleString() }}</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<style lang="scss" scoped>
	.session-table {
		width: 100%;
		border-collapse: collapse;

		th {
			background-color: var(--color-background);
			font-weight: bold;
			cursor: pointer;
		}

		td,
		th {
			padding: 10px;
			border: 1px solid var(--color-shadow);
		}

		tbody tr:hover {
			background-color: var(--color-secondary-hover);
		}
	}
</style>
