<script lang="ts">
	import { defineComponent } from "vue"
	import { useUserSensorOrMeasurementTypeStore } from "@/stores/userSensorOrMeasurementType"
	import type { UserSensorRequest } from "#/userSensor"
	import { Status } from "#/userSensor"
	import useUserSensorOrMeasurementType from "@/composables/useUserSensorOrMeasurementType.composable"
	import { useDate } from "@/composables/useDate.composable"

	export default defineComponent({
		name: "AdminSensorRequest",
		data() {
			return {
				usersSensor: [] as UserSensorRequest[],
				sortDirection: "asc",
				sortColumn: "User.email",
				statusDisplay: "all",
				status: ["all", Status.ACCEPTED, Status.PENDING, Status.REJECTED],
			errorMsg: "",
			}
		},
		computed: {
			filteredUsers() {
				if (this.statusDisplay === "all") {
					return this.usersSensor
				} else {
					return this.usersSensor.filter(user => user.status === this.statusDisplay)
				}
			},
		},
		methods: {
			sortTable(column: string) {
				if (column === this.sortColumn) {
					this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc"
				} else {
					this.sortColumn = column
					this.sortDirection = "asc"
				}

				this.usersSensor.sort((a, b) => {
					if (column === "User.email") {
						return this.sortDirection === "asc" ? a.User.email.localeCompare(b.User.email) : b.User.email.localeCompare(a.User.email)
					}
					if (column === "sensorName") {
						return this.sortDirection === "asc" ? a.sensorName.localeCompare(b.sensorName) : b.sensorName.localeCompare(a.sensorName)
					}
					if (column === "status") {
						return this.sortDirection === "asc" ? a.status.toString().localeCompare(b.status.toString()) : b.status.toString().localeCompare(a.status.toString())
					}
					if (column === "created_at") {
						return this.sortDirection === "asc" ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)
					}
					return 0
				})
			},
			async submitUpdateUserRequest(userSensor: UserSensorRequest, accessApi: string) {
				const result = await useUserSensorOrMeasurementType().updateUserSensorRequest(userSensor.User.email, userSensor.sensorName, accessApi)
				if (result.httpStatus && [401, 403].includes(result.httpStatus) && result.error) this.errorMsg = result.error
				else if (result.error) console.error(result.error)
				this.usersSensor = useUserSensorOrMeasurementTypeStore().getUserSensorRequest()
			},
			beautifulDate(date: string) {
				return useDate().beautifulDate(date)
			},
		},
		async mounted() {
			const store = useUserSensorOrMeasurementTypeStore()
			await store.refresh()
			this.usersSensor = store.getUserSensorRequest()
		},
	})
</script>

<template>
	<div class="admin-sensor-request">
		<div
			v-if="errorMsg"
			class="inline-error">
			{{ errorMsg }}
		</div>
		<div class="toolbar">
			<label class="filter-label">
				Filtrer :
				<select v-model="statusDisplay">
					<option value="all">Tous</option>
					<option value="pending">En attente</option>
					<option value="accepted">Acceptés</option>
					<option value="rejected">Refusés</option>
				</select>
			</label>
		</div>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th @click="sortTable('User.email')">Utilisateur</th>
						<th @click="sortTable('sensorName')">Capteur demandé</th>
						<th @click="sortTable('status')">Statut</th>
						<th @click="sortTable('created_at')">Date</th>
						<th>Accepter</th>
						<th>Refuser</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="user in filteredUsers"
						:key="user.User.email + user.sensorName + user.status">
						<td>{{ user.User.email }}</td>
						<td>{{ user.sensorName }}</td>
						<td>{{ user.status }}</td>
						<td>{{ beautifulDate(user.createdAt) }}</td>
						<td><button @click="submitUpdateUserRequest(user, 'false')">ACCEPTER</button></td>
						<td><button class="btn-danger" @click="submitUpdateUserRequest(user, 'true')">REFUSER</button></td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<style scoped>
	.admin-sensor-request {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.filter-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.inline-error {
		font-family: var(--font-mono);
		font-size: 0.68rem;
		letter-spacing: 0.08em;
		color: var(--color-danger);
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-danger-dim);
		background: var(--color-danger-dim);
		margin-bottom: 0.5rem;
	}

	.table-wrapper {
		width: 100%;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}
</style>
