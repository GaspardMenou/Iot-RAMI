<template>
	<div class="update-information-view">
		<div class="toggle-container">
			<label class="switch">
				<input
					type="checkbox"
					v-model="changePasswordVisible" />
				<span class="slider round"></span>
			</label>
			<span class="toggle-label">{{ changePasswordVisible ? "Conserver" : "Modifier" }} mon mot de passe</span>
		</div>

		<FormView
			title="Modifier mon profil"
			:formFields="filteredFormFields"
			submitButtonText="Mettre à jour"
			formName="userUpdate"
			sectionText="Retourner au tableau de bord ?"
			sectionLink="/home"
			sectionLinkText="Retour" />
	</div>
</template>

<script lang="ts">
	import { defineComponent, ref, computed } from "vue"
	import { UserFields, Sex } from "#/user"
	import FormView from "@/components/user/Form.vue"
	import FormBuilder from "@/helpers/FormBuilder"

	export default defineComponent({
		name: "UpdateInformationView",
		components: {
			FormView,
		},
		setup() {
			const changePasswordVisible = ref(false)

			const formFields = new FormBuilder()
				.addTextField(UserFields.FIRST_NAME, "Prénom", "Entrez votre prénom", localStorage.getItem(UserFields.FIRST_NAME) || "")
				.addTextField(UserFields.LAST_NAME, "Nom", "Entrez votre nom", localStorage.getItem(UserFields.LAST_NAME) || "")
				.addDateField(UserFields.DATE_OF_BIRTH, "Date de naissance", "Date de naissance", localStorage.getItem(UserFields.DATE_OF_BIRTH) || "", true)
				.addSelectField(
					UserFields.SEX,
					"Sexe",
					[
						{ value: Sex.MALE, label: "Homme" },
						{ value: Sex.FEMALE, label: "Femme" },
						{ value: Sex.OTHER, label: "Autre" },
						{ value: Sex.NOTSPECIFY, label: "Non précisé" },
					],
					localStorage.getItem(UserFields.SEX) || ""
				)
				.addTextField(UserFields.ROLE, "Rôle", "Votre rôle", localStorage.getItem(UserFields.ROLE) || "", true)
				.addTextField(UserFields.EMAIL, "Email", "Entrez votre email", localStorage.getItem(UserFields.EMAIL) || "")
				.addPasswordField(UserFields.PASSWORD, "Mot de passe actuel", "Entrez votre mot de passe actuel")
				.addPasswordField(UserFields.NEW_PASSWORD, "Nouveau mot de passe", "Entrez votre nouveau mot de passe")
				.addPasswordField(UserFields.CONFIRM_NEW_PASSWORD, "Confirmer le mot de passe", "Confirmez votre nouveau mot de passe")
				.build()

			const filteredFormFields = computed(() => {
				if (changePasswordVisible.value) {
					return formFields
				} else {
					return formFields.filter(field => field.name !== UserFields.NEW_PASSWORD && field.name !== UserFields.CONFIRM_NEW_PASSWORD)
				}
			})

			function toggleChangePassword() {
				changePasswordVisible.value = !changePasswordVisible.value
			}

			return {
				formFields,
				filteredFormFields,
				changePasswordVisible,
				toggleChangePassword,
			}
		},
	})
</script>

<style scoped>
	.update-information-view {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.toggle-container {
		display: flex;
		align-items: center;
		margin-bottom: 1rem;
	}

	.toggle-container .switch {
		margin-right: 0.5rem;
	}

	.toggle-container .toggle-label {
		font-size: 1rem;
	}
</style>
