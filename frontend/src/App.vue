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
		/* Texture scanline subtile */
		background-image: repeating-linear-gradient(to bottom, transparent, transparent 3px, var(--color-overlay-light) 3px, var(--color-overlay-light) 4px);
	}

	.content {
		flex: 1;
		padding: 2rem 2.5rem;
		overflow-y: auto;
		background: transparent;
		background-image: linear-gradient(var(--color-primary-dim) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary-dim) 1px, transparent 1px);
		background-size: 40px 40px;
	}

	@media (max-width: 768px) {
		.content {
			padding: 1rem;
			padding-top: 4.5rem;
		}
	}
</style>
