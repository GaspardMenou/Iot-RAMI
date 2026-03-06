<template>
	<div class="view-title">
		<div class="title-content">
			<h1>{{ title }}</h1>
			<span
				v-if="role"
				class="role-badge">
				{{ role }}
			</span>
		</div>
		<div class="title-line" />
	</div>
</template>

<script lang="ts">
	import { defineComponent } from "vue"

	export default defineComponent({
		name: "ViewTitle",
		props: {
			title: String,
			role: String,
		},
	})
</script>

<style lang="scss" scoped>
	.view-title {
		margin-bottom: 2rem;
	}

	.title-content {
		display: flex;
		align-items: baseline;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	h1 {
		font-family: var(--font-display);
		font-size: 2.4rem;
		font-weight: 900;
		color: var(--color-text);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		line-height: 1;
	}

	.role-badge {
		font-family: var(--font-mono);
		font-size: 0.65rem;
		color: var(--color-primary);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		border: 1px solid rgba(255, 159, 10, 0.35);
		padding: 2px 8px;
		background: var(--color-primary-dim);
	}

	.title-line {
		height: 1px;
		background: linear-gradient(to right, var(--color-primary), rgba(255, 159, 10, 0.2), transparent);
	}
</style>
