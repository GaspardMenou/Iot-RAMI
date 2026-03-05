<template>
	<div class="admin-role">
		<p class="description">Modifier le rôle d'un utilisateur existant.</p>
		<form
			class="role-form"
			@submit.prevent="submitUpdateUserRole">
			<div class="field">
				<label class="field-label">Utilisateur</label>
				<select
					v-model="userSelected"
					class="field-select">
					<option
						value=""
						disabled>
						Sélectionner un utilisateur
					</option>
					<option
						v-for="user in users"
						:key="user.email"
						:value="user.email">
						{{ user.email }} — {{ user.role }}
					</option>
				</select>
			</div>
			<div class="field">
				<label class="field-label">Nouveau rôle</label>
				<select
					v-model="roleSelected"
					class="field-select">
					<option
						value=""
						disabled>
						Sélectionner un rôle
					</option>
					<option
						v-for="role in roles"
						:key="role"
						:value="role">
						{{ role }}
					</option>
				</select>
			</div>
			<button
				type="submit"
				class="btn-submit"
				:disabled="!userSelected || !roleSelected">
				Mettre à jour
			</button>
		</form>
	</div>
</template>

<script lang="ts">
	import { defineComponent } from "vue"
	import type { User } from "#/user"
	import { Role, useUser } from "@/composables/useUser.composable"

	interface Data {
		users: User[]
		userSelected: string
		roles: Role[]
		roleSelected: string
	}

	const token = localStorage.getItem("token")

	export default defineComponent({
		name: "AdminRoleComponent",
		data(): Data {
			return {
				users: [],
				userSelected: "",
				roles: [Role.REGULAR, Role.PRIVILEGED, Role.ADMIN],
				roleSelected: "",
			}
		},
		methods: {
			async submitUpdateUserRole(e: Event) {
				e.preventDefault()
				const email = this.userSelected
				const role = this.roleSelected as Role
				if (!useUser().canUpdateUserRole(token, { email: email, role: role })) {
					alert("You are not allowed to update this user's role")
					return
				} else {
					const result = await useUser().updateRole(token as string, { email: email, role: role })
					if (result.valid) {
						await this.refreshUsers(token as string)
					} else {
						alert(result.error)
					}
				}
			},
			async refreshUsers(token: string) {
				const result = await useUser().getAllUsers(token)
				if (result) {
					this.users = result
				} else {
					console.error("Error while fetching users")
				}
			},
		},
		async mounted() {
			await this.refreshUsers(token as string)
		},
	})
</script>

<style scoped>
	.admin-role {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.description {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		margin: 0;
	}

	.role-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 480px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.field-label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.field-select {
		padding: 8px 12px;
		background: var(--color-surface-secondary);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		font-size: 0.9rem;
		width: 100%;
		cursor: pointer;
	}

	.field-select:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.btn-submit {
		padding: 9px 20px;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		width: fit-content;
		align-self: center;
		transition: background-color 0.15s;
	}

	.btn-submit:hover:not(:disabled) {
		background: var(--color-primary-hover, var(--color-primary));
	}

	.btn-submit:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
