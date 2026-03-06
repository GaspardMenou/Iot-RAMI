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

		<!-- Header -->
		<div class="sidebar-header">
			<div class="sidebar-logo">
				<span class="logo-bracket">[</span>
				<span class="logo-text">RAMI</span>
				<span class="logo-bracket">]</span>
			</div>
			<p class="logo-sub">SENSOR MONITOR v1.0</p>
			<button
				class="close-btn"
				aria-label="Close menu"
				@click="isOpen = false">
				✕
			</button>
		</div>

		<div class="sidebar-divider" />

		<!-- Navigation -->
		<nav class="sidebar-nav">
			<ul>
				<li
					v-for="(item, index) in items"
					:key="index">
					<router-link
						:class="[isActive(item.path) ? 'active-link' : '']"
						:to="item.path"
						@click="closeSidebarOnMobile">
						<span class="nav-indicator" />
						<span class="nav-icon">{{ item.icon }}</span>
						<span class="nav-label">{{ item.name }}</span>
					</router-link>
				</li>
			</ul>
		</nav>

		<!-- Footer -->
		<div class="sidebar-footer">
			<div class="system-status">
				<span class="status-dot" />
				<span class="status-label">SYS ONLINE</span>
			</div>
			<button
				class="logout-button"
				@click="logout">
				<span>⏻</span> DÉCONNECTER
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
		icon: string
	}

	export default defineComponent({
		name: "NavBar",
		data(): DataComponent {
			const role = localStorage.getItem("role")
			const isAdmin = role === "admin"
			const isOpen = window.innerWidth > 768

			const items: MenuItem[] = [
				{ path: "/home", name: "Dashboard", icon: "◈" },
				{ path: "/sensors", name: "Mes capteurs", icon: "⬡" },
				{ path: "/user", name: "Mon profil", icon: "◎" },
			]

			if (isAdmin) {
				items.push({ path: "/users/all", name: "Utilisateurs", icon: "⬟" })
				items.push({ path: "/admin", name: "Administration", icon: "⬠" })
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
	/* ── Sidebar ── */
	.sidebar {
		width: 220px;
		min-width: 220px;
		background-color: var(--color-sidebar-bg);
		border-right: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		padding: 0;
		box-sizing: border-box;
		overflow: hidden;
	}

	/* ── Header ── */
	.sidebar-header {
		padding: 1.5rem 1.25rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.sidebar-logo {
		display: flex;
		align-items: baseline;
		gap: 1px;
		line-height: 1;
	}

	.logo-bracket {
		font-family: var(--font-mono);
		font-size: 1.4rem;
		color: var(--color-primary);
		font-weight: 700;
		opacity: 0.6;
	}

	.logo-text {
		font-family: var(--font-display);
		font-size: 2.2rem;
		font-weight: 900;
		color: var(--color-primary);
		letter-spacing: 0.12em;
		text-shadow: 0 0 20px var(--color-primary-glow);
		line-height: 1;
	}

	.logo-sub {
		font-family: var(--font-mono);
		font-size: 0.58rem;
		color: var(--color-text-muted);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		font-weight: 300;
		margin-top: 4px;
	}

	.close-btn {
		display: none;
	}

	.sidebar-divider {
		height: 1px;
		background: linear-gradient(to right, var(--color-primary-dim), var(--color-border), transparent);
		margin: 0 1.25rem 1rem;
		flex-shrink: 0;
	}

	/* ── Navigation ── */
	.sidebar-nav {
		flex: 1;
		padding: 0 0.5rem;
	}

	.sidebar-nav ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.sidebar-nav ul li a {
		text-decoration: none;
		color: var(--color-sidebar-text);
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.65rem 0.75rem;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		font-weight: 400;
		transition: color 0.15s, background-color 0.15s;
		border-left: 2px solid transparent;
	}

	.nav-indicator {
		width: 0;
		height: 0;
	}

	.nav-icon {
		font-size: 0.9rem;
		width: 16px;
		text-align: center;
		flex-shrink: 0;
	}

	.nav-label {
		flex: 1;
	}

	.sidebar-nav ul li a:hover {
		background-color: var(--color-sidebar-hover);
		color: var(--color-primary);
		border-left-color: rgba(255, 159, 10, 0.4);
	}

	.sidebar-nav ul li a.active-link {
		color: var(--color-primary);
		background-color: var(--color-primary-dim);
		border-left-color: var(--color-primary);
		font-weight: 700;
		box-shadow: inset 0 0 20px rgba(255, 159, 10, 0.04);
	}

	/* ── Footer ── */
	.sidebar-footer {
		padding: 1rem 1.25rem 1.5rem;
		border-top: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.system-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--color-success);
		box-shadow: 0 0 6px var(--color-success);
		flex-shrink: 0;
		animation: pulse-dot 2s ease-in-out infinite;
	}

	@keyframes pulse-dot {
		0%, 100% { opacity: 1; box-shadow: 0 0 6px var(--color-success); }
		50% { opacity: 0.6; box-shadow: 0 0 2px var(--color-success); }
	}

	.status-label {
		font-family: var(--font-mono);
		font-size: 0.62rem;
		color: var(--color-success);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		font-weight: 600;
	}

	.logout-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.55rem;
		background-color: transparent;
		border: 1px solid var(--color-border-bright);
		cursor: pointer;
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		transition: all 0.15s;
		border-radius: 0;
	}

	.logout-button:hover {
		background-color: var(--color-danger-dim);
		border-color: var(--color-danger);
		color: var(--color-danger);
		box-shadow: 0 0 10px rgba(255, 64, 64, 0.15);
	}

	/* ── Hamburger ── */
	.hamburger {
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
			top: 1rem;
			left: 1rem;
			z-index: 200;
			width: 2rem;
			height: 1.4rem;
			background: none;
			border: none;
			cursor: pointer;
			padding: 0;
		}

		.hamburger span {
			display: block;
			width: 100%;
			height: 2px;
			background-color: var(--color-primary);
			border-radius: 0;
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
			background: rgba(0, 0, 0, 0.7);
			z-index: 99;
		}

		.close-btn {
			display: block;
			position: absolute;
			top: 1.5rem;
			right: 1.25rem;
			background: none;
			border: none;
			color: var(--color-text-muted);
			font-size: 1rem;
			cursor: pointer;
			padding: 0.25rem;
		}

		.close-btn:hover {
			color: var(--color-primary);
		}
	}
</style>
