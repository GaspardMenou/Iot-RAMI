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
					console.error("Error fetching active sessions:", error)
				}
			},
			async forceEndSession(session: Session) {
				try {
					const { axios } = useAxios()
					await axios.post("sessions/new/on/server", {
						idUser: session.idUser,
						idSensor: session.idSensor,
						createdAt: session.createdAt,
						endedAt: new Date().toISOString(),
						idSession: session.id,
					})
					await this.fetchActiveSessions()
				} catch (error) {
					console.error("Erreur lors de la fermeture de la session:", error)
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
		<div
			v-if="activeSessions.length === 0"
			class="empty-state">
			Aucune session active en ce moment.
		</div>
		<div class="table-wrapper">
		<table
			v-if="activeSessions.length > 0"
			class="session-table">
			<thead>
				<tr>
					<th>Session ID</th>
					<th>User ID</th>
					<th>Sensor ID</th>
					<th>Démarré le</th>
					<th>Action</th>
				</tr>
			</thead>
			<tbody>
				<tr
					v-for="session in activeSessions"
					:key="session.id">
					<td class="id-cell">{{ session.id }}</td>
					<td class="id-cell">{{ session.idUser }}</td>
					<td class="id-cell">{{ session.idSensor }}</td>
					<td>{{ new Date(session.createdAt).toLocaleString() }}</td>
					<td>
						<button
							class="btn-end"
							@click="forceEndSession(session)">
							Terminer
						</button>
					</td>
				</tr>
			</tbody>
		</table>
		</div>
	</div>
</template>

<style scoped>
	.empty-state {
		color: var(--color-text-muted);
		text-align: center;
		padding: 2rem;
	}

	.table-wrapper {
		width: 100%;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.session-table {
		width: 100%;
		min-width: 600px;
		border-collapse: collapse;
	}

	.id-cell {
		font-family: monospace;
		font-size: 0.78rem;
		color: var(--color-text-muted);
		max-width: 180px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.btn-end {
		padding: 4px 12px;
		font-size: 0.8rem;
		font-weight: 600;
		background-color: var(--color-danger);
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.btn-end:hover {
		background-color: var(--color-danger-hover);
	}
</style>
