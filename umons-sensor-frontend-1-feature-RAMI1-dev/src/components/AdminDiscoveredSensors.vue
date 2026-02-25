<script lang="ts">
	import { defineComponent, ref, onMounted } from "vue"
	import { useAxios } from "@/composables/useAxios.composable"

	interface DiscoveredSensor {
		baseTopic: string
		firstSeenAt: string
		lastSeenAt: string
		count: number
	}

	export default defineComponent({
		name: "AdminDiscoveredSensors",
		setup() {
			const { axios } = useAxios()
			const discovered = ref<DiscoveredSensor[]>([])
			const names = ref<Record<string, string>>({})
			const registering = ref<Record<string, boolean>>({})

			const fetch = async () => {
				try {
					const { data } = await axios.get("sensors/discovered")
					discovered.value = data
				} catch (e) {
					console.error("Erreur fetch discovered:", e)
				}
			}

			const register = async (sensor: DiscoveredSensor) => {
				const name = names.value[sensor.baseTopic]?.trim()
				if (!name) return
				registering.value[sensor.baseTopic] = true
				try {
					await axios.post("sensors", { name, topic: sensor.baseTopic })
					await fetch()
				} catch (e: any) {
					if (e.response?.status === 401 || e.response?.status === 403) {
						alert("Vous n'avez pas les droits pour enregistrer un capteur.")
					} else {
						console.error("Erreur register:", e)
					}
				} finally {
					registering.value[sensor.baseTopic] = false
				}
			}

			const formatDate = (iso: string) =>
				new Date(iso).toLocaleString("fr-BE", {
					day: "2-digit",
					month: "2-digit",
					year: "numeric",
					hour: "2-digit",
					minute: "2-digit",
				})

			onMounted(fetch)

			return { discovered, names, registering, register, formatDate, fetch }
		},
	})
</script>

<template>
	<div class="discovered">
		<div class="header-row">
			<p class="description">Capteurs qui ont publié des données sur MQTT mais ne sont pas encore enregistrés dans la base.</p>
			<button
				class="btn-refresh"
				@click="fetch">
				Rafraîchir
			</button>
		</div>

		<div
			v-if="discovered.length === 0"
			class="empty-state">
			Aucun nouveau capteur détecté pour le moment.
		</div>

		<div class="table-wrapper">
			<table
				v-if="discovered.length > 0"
				class="discovered-table">
				<thead>
					<tr>
						<th>Topic MQTT</th>
						<th>Première détection</th>
						<th>Dernière activité</th>
						<th>Messages</th>
						<th>Nom à donner</th>
						<th>Action</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="sensor in discovered"
						:key="sensor.baseTopic">
						<td class="topic-cell">{{ sensor.baseTopic }}</td>
						<td>{{ formatDate(sensor.firstSeenAt) }}</td>
						<td>{{ formatDate(sensor.lastSeenAt) }}</td>
						<td class="count-cell">{{ sensor.count }}</td>
						<td>
							<input
								v-model="names[sensor.baseTopic]"
								class="name-input"
								type="text"
								placeholder="ex: ECG chambre 1" />
						</td>
						<td>
							<button
								class="btn-register"
								:disabled="!names[sensor.baseTopic]?.trim() || registering[sensor.baseTopic]"
								@click="register(sensor)">
								{{ registering[sensor.baseTopic] ? "..." : "Enregistrer" }}
							</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<style scoped>
	.discovered {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.description {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		margin: 0;
	}

	.btn-refresh {
		padding: 6px 14px;
		font-size: 0.8rem;
		font-weight: 600;
		background: var(--color-surface-secondary);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		cursor: pointer;
		white-space: nowrap;
		transition: background-color 0.15s;
	}

	.btn-refresh:hover {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.empty-state {
		color: var(--color-text-muted);
		text-align: center;
		padding: 2rem;
		border: 1px dashed var(--color-border);
		border-radius: 8px;
	}

	.table-wrapper {
		width: 100%;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.discovered-table {
		width: 100%;
		min-width: 650px;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.discovered-table th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-weight: 600;
		color: var(--color-text-muted);
		border-bottom: 1px solid var(--color-border);
		white-space: nowrap;
		background: var(--color-background);
	}

	.discovered-table td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border);
		color: var(--color-text);
		vertical-align: middle;
	}

	.discovered-table tbody tr:hover {
		background: var(--color-surface-secondary);
	}

	.topic-cell {
		font-family: monospace;
		font-size: 0.82rem;
		color: var(--color-primary);
	}

	.count-cell {
		text-align: center;
		font-weight: 600;
	}

	.name-input {
		background: var(--color-surface-secondary);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 5px 10px;
		font-size: 0.85rem;
		width: 100%;
		min-width: 120px;
	}

	.name-input:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.btn-register {
		padding: 5px 14px;
		font-size: 0.8rem;
		font-weight: 600;
		background: var(--color-success);
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		white-space: nowrap;
		transition: background-color 0.15s;
	}

	.btn-register:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.btn-register:not(:disabled):hover {
		background: var(--color-success-hover);
	}
</style>
