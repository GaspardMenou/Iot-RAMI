<template>
	<div class="user-sensor-request">
		<UserForm
			submitFunction="sensor.request"
			title="Demander la création d'un capteur" />
	</div>
</template>

<script lang="ts">
	import { defineComponent } from "vue"
	import UserForm from "@/components/user/UserForm.vue"

	export default defineComponent({
		name: "UserSensorRequest",
		components: {
			UserForm,
		},
	})
</script>

<style lang="scss" scoped></style>
