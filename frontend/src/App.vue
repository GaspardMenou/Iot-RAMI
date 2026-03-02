<script lang="ts" setup>
	import { RouterView } from "vue-router"
	import NavBar from "@/components/NavBar.vue"
</script>

<template>
	<div class="app-container">
		<NavBar />
		<main class="content">
			<RouterView />
		</main>
	</div>
</template>

<style lang="scss">
	.app-container {
		display: flex;
		height: 100vh;
		background: var(--color-background);
	}

	.content {
		flex: 1;
		padding: 1.5rem 2rem;
		overflow-y: auto;
		background: var(--color-background);
	}

	@media (max-width: 768px) {
		.content {
			padding: 1rem;
			padding-top: 4rem;
		}
	}
</style>
