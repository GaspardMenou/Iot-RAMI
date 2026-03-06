<template>
	<div
		v-if="isOpen"
		class="sidebar-overlay"
		@click="isOpen = false" />

	<button
		class="hamburger"
		aria-label="Menu"
		@click="isOpen = !isOpen">
		<span />
		<span />
		<span />
	</button>

	<aside
		class="sidebar"
		:class="{ open: isOpen }">
		<div class="sidebar-header">
			<h2>RAMI</h2>
			<button
				class="close-btn"
				aria-label="Close menu"
				@click="isOpen = false">
				✕
			</button>
		</div>
		<nav class="sidebar-nav">
			<ul>
				<li
					v-for="(item, index) in items"
					:key="index">
					<router-link
						:class="[isActive(item.path) ? 'active-link' : '']"
						:to="item.path"
						@click="closeSidebarOnMobile">
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
		isOpen: boolean
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
			const isOpen = window.innerWidth > 768

			const items: MenuItem[] = [
				{ path: "/home", name: "Dashboard" },
				{ path: "/sensors", name: "Mes capteurs" },
				{ path: "/user", name: "Mon profil" },
			]

			if (isAdmin) {
				items.push({ path: "/users/all", name: "Tous les utilisateurs" })
				items.push({ path: "/admin", name: "Administration" })
			}

			return { items: reactive(items), isOpen }
		},
		methods: {
			isActive(path: string): boolean {
				return this.$route.path === path
			},
			logout() {
				cleanUserLocalStorage()
				location.href = "/"
			},
			closeSidebarOnMobile() {
				if (window.innerWidth <= 768) {
					this.isOpen = false
				}
			},
		},
	})
</script>

<style scoped>
	/* ── Desktop sidebar (unchanged) ── */
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
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.sidebar-header h2 {
		margin: 0;
		font-size: 1.4rem;
		font-weight: 700;
		color: var(--color-sidebar-text-active);
		letter-spacing: 0.12em;
		font-family: var(--font-mono);
		text-transform: uppercase;
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

	/* ── Hidden on desktop ── */
	.hamburger {
		display: none;
	}

	.close-btn {
		display: none;
	}

	.sidebar-overlay {
		display: none;
	}

	/* ── Mobile ── */
	@media (max-width: 768px) {
		.hamburger {
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			position: fixed;
			top: 0.9rem;
			left: 0.9rem;
			z-index: 200;
			width: 2.2rem;
			height: 1.6rem;
			background: none;
			border: none;
			cursor: pointer;
			padding: 0;
		}

		.hamburger span {
			display: block;
			width: 100%;
			height: 2px;
			background-color: var(--color-text);
			border-radius: 2px;
		}

		.sidebar {
			position: fixed;
			top: 0;
			left: 0;
			height: 100vh;
			z-index: 100;
			transform: translateX(-100%);
			transition: transform 0.25s ease;
		}

		.sidebar.open {
			transform: translateX(0);
		}

		.sidebar-overlay {
			display: block;
			position: fixed;
			inset: 0;
			background: rgba(0, 0, 0, 0.5);
			z-index: 99;
		}

		.close-btn {
			display: block;
			background: none;
			border: none;
			color: var(--color-sidebar-text);
			font-size: 1.1rem;
			cursor: pointer;
			padding: 0.25rem;
			line-height: 1;
		}

		.close-btn:hover {
			color: var(--color-sidebar-text-active);
		}
	}
</style>
