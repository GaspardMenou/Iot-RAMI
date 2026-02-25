<template>
	<aside class="sidebar">
		<div class="sidebar-header">
			<h2>RAMI</h2>
		</div>
		<nav class="sidebar-nav">
			<ul>
				<li
					v-for="(item, index) in items"
					:key="index">
					<router-link
						:class="[isActive(item.path) ? 'active-link' : '']"
						:to="item.path">
						{{ item.name }}
					</router-link>
				</li>
			</ul>
		</nav>
		<div class="sidebar-footer">
			<button
				class="logout-button"
				@click="logout">
				Log out
			</button>
		</div>
	</aside>
</template>

<script lang="ts">
	import { defineComponent, reactive } from "vue"
	import { useUser } from "@/composables/useUser.composable"

	const { cleanUserLocalStorage } = useUser()

	interface DataComponent {
		items: MenuItem[]
	}

	interface MenuItem {
		path: string
		name: string
	}

	export default defineComponent({
		name: "NavBar",
		data(): DataComponent {
			const role = localStorage.getItem("role")
			const isAdmin = role === "admin"

			const items: MenuItem[] = [
				{ path: "/home", name: "Dashboard" },
				{ path: "/sensors", name: "Mes capteurs" },
				{ path: "/user", name: "Mon profil" },
			]

			if (isAdmin) {
				items.push({ path: "/users/all", name: "Tous les utilisateurs" })
				items.push({ path: "/admin", name: "Administration" })
			}

			return { items: reactive(items) }
		},
		methods: {
			isActive(path: string): boolean {
				return this.$route.path === path
			},
			logout() {
				cleanUserLocalStorage()
				location.href = "/"
			},
		},
	})
</script>

<style scoped>
	.sidebar {
		width: 240px;
		min-width: 240px;
		background-color: var(--color-sidebar-bg);
		display: flex;
		flex-direction: column;
		padding: 1.5rem 1rem;
		box-sizing: border-box;
	}

	.sidebar-header {
		margin-bottom: 2rem;
		padding: 0 0.5rem;
	}

	.sidebar-header h2 {
		margin: 0;
		font-size: 1.4rem;
		font-weight: 700;
		color: var(--color-sidebar-text-active);
		letter-spacing: 0.05em;
	}

	.sidebar-nav {
		flex: 1;
	}

	.sidebar-nav ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.sidebar-nav ul li a {
		text-decoration: none;
		color: var(--color-sidebar-text);
		display: block;
		padding: 0.6rem 0.75rem;
		border-radius: 8px;
		font-size: 0.95rem;
		transition: background-color 0.15s, color 0.15s;
	}

	.sidebar-nav ul li a:hover {
		background-color: var(--color-sidebar-hover);
		color: var(--color-sidebar-text-active);
	}

	.sidebar-nav ul li a.active-link {
		background-color: var(--color-primary);
		color: var(--color-sidebar-text-active);
		font-weight: 600;
	}

	.sidebar-footer {
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
	}

	.logout-button {
		width: 100%;
		padding: 0.6rem;
		background-color: transparent;
		border: 1px solid var(--color-secondary-hover);
		border-radius: 8px;
		cursor: pointer;
		color: var(--color-sidebar-text);
		font-size: 0.9rem;
		transition: background-color 0.15s, color 0.15s;
	}

	.logout-button:hover {
		background-color: var(--color-danger);
		border-color: var(--color-danger);
		color: white;
	}
</style>
