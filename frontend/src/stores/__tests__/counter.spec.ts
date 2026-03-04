import { describe, it, expect, beforeEach } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { useCounterStore } from "@/stores/counter"

describe("useCounterStore", () => {
	beforeEach(() => {
		setActivePinia(createPinia())
	})

	it("should start at 0", () => {
		const store = useCounterStore()
		expect(store.count).toBe(0)
	})

	it("should increment count by 1", () => {
		const store = useCounterStore()
		store.increment()
		expect(store.count).toBe(1)
	})

	it("should compute doubleCount correctly", () => {
		const store = useCounterStore()
		store.increment()
		store.increment()
		expect(store.doubleCount).toBe(4)
	})

	it("should increment multiple times", () => {
		const store = useCounterStore()
		store.increment()
		store.increment()
		store.increment()
		expect(store.count).toBe(3)
	})
})
