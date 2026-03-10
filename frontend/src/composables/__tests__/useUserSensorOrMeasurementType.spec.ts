import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest"
import { setActivePinia, createPinia } from "pinia"

const mockGet = vi.fn()
const mockPost = vi.fn()
vi.mock("@/composables/useAxios.composable", () => ({
	useAxios: () => ({ axios: { get: mockGet, post: mockPost } }),
}))

vi.mock("@/stores/userSensorOrMeasurementType", () => ({
	useUserSensorOrMeasurementTypeStore: () => ({
		refresh: vi.fn().mockResolvedValue(undefined),
	}),
}))

import useUserSensorOrMeasurementType from "@/composables/useUserSensorOrMeasurementType.composable"

const getItemMock = vi.fn()

describe("useUserSensorOrMeasurementType", () => {
	beforeAll(() => {
		Object.defineProperty(window, "localStorage", {
			value: { getItem: getItemMock, setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
			writable: true,
			configurable: true,
		})
	})

	beforeEach(() => {
		setActivePinia(createPinia())
		mockGet.mockReset()
		mockPost.mockReset()
		getItemMock.mockReset()
	})

	describe("getAllUserSensorAccess()", () => {
		it("should return 401 when no token in localStorage", async () => {
			getItemMock.mockReturnValue(null)
			const { getAllUserSensorAccess } = useUserSensorOrMeasurementType()
			const result = await getAllUserSensorAccess()
			expect(result.httpStatus).toBe(401)
			expect(result.error).toBe("No token")
		})

		it("should return data on success", async () => {
			getItemMock.mockReturnValue("fake-token")
			mockGet.mockResolvedValue({ data: [{ id: "1", sensor: "s1" }] })
			const { getAllUserSensorAccess } = useUserSensorOrMeasurementType()
			const result = await getAllUserSensorAccess()
			expect(result.httpStatus).toBe(200)
			expect(result.data).toEqual([{ id: "1", sensor: "s1" }])
			expect(result.error).toBeNull()
		})

		it("should handle API errors with correct status", async () => {
			getItemMock.mockReturnValue("fake-token")
			mockGet.mockRejectedValue({ response: { status: 403, data: { message: "Forbidden", status: 403 } } })
			const { getAllUserSensorAccess } = useUserSensorOrMeasurementType()
			const result = await getAllUserSensorAccess()
			expect(result.httpStatus).toBe(403)
			expect(result.error).toContain("Forbidden")
			expect(result.data).toBeNull()
		})

		it("should fallback to 500 on error without response", async () => {
			getItemMock.mockReturnValue("fake-token")
			mockGet.mockRejectedValue(new Error("Network error"))
			const { getAllUserSensorAccess } = useUserSensorOrMeasurementType()
			const result = await getAllUserSensorAccess()
			expect(result.httpStatus).toBe(500)
		})
	})

	describe("getAllUserSensorRequest()", () => {
		it("should return 401 when no token", async () => {
			getItemMock.mockReturnValue(null)
			const { getAllUserSensorRequest } = useUserSensorOrMeasurementType()
			const result = await getAllUserSensorRequest()
			expect(result.httpStatus).toBe(401)
		})

		it("should return data on success", async () => {
			getItemMock.mockReturnValue("fake-token")
			mockGet.mockResolvedValue({ data: [{ id: "r1" }] })
			const { getAllUserSensorRequest } = useUserSensorOrMeasurementType()
			const result = await getAllUserSensorRequest()
			expect(result.httpStatus).toBe(200)
			expect(result.data).toEqual([{ id: "r1" }])
		})
	})

	describe("getAllUserMeasurementTypeRequest()", () => {
		it("should return 401 when no token", async () => {
			getItemMock.mockReturnValue(null)
			const { getAllUserMeasurementTypeRequest } = useUserSensorOrMeasurementType()
			const result = await getAllUserMeasurementTypeRequest()
			expect(result.httpStatus).toBe(401)
		})

		it("should return data on success", async () => {
			getItemMock.mockReturnValue("fake-token")
			mockGet.mockResolvedValue({ data: [{ id: "m1", type: "ecg" }] })
			const { getAllUserMeasurementTypeRequest } = useUserSensorOrMeasurementType()
			const result = await getAllUserMeasurementTypeRequest()
			expect(result.httpStatus).toBe(200)
			expect(result.data).toEqual([{ id: "m1", type: "ecg" }])
		})
	})

	describe("updateUserSensorAccess()", () => {
		it("should return 401 when no token", async () => {
			getItemMock.mockReturnValue(null)
			const { updateUserSensorAccess } = useUserSensorOrMeasurementType()
			const result = await updateUserSensorAccess("user1", "sensor1", "false")
			expect(result.httpStatus).toBe(401)
		})

		it("should post and return message on success", async () => {
			getItemMock.mockReturnValue("fake-token")
			mockPost.mockResolvedValue({ data: { message: "Access updated" } })
			const { updateUserSensorAccess } = useUserSensorOrMeasurementType()
			const result = await updateUserSensorAccess("user1", "sensor1", "false")
			expect(result.httpStatus).toBe(200)
			expect(result.data).toBe("Access updated")
		})
	})

	describe("updateUserSensorRequest()", () => {
		it("should return 401 when no token", async () => {
			getItemMock.mockReturnValue(null)
			const { updateUserSensorRequest } = useUserSensorOrMeasurementType()
			const result = await updateUserSensorRequest("user1", "sensor1", "true")
			expect(result.httpStatus).toBe(401)
		})

		it("should post and return message on success", async () => {
			getItemMock.mockReturnValue("fake-token")
			mockPost.mockResolvedValue({ data: { message: "Request updated" } })
			const { updateUserSensorRequest } = useUserSensorOrMeasurementType()
			const result = await updateUserSensorRequest("user1", "sensor1", "true")
			expect(result.httpStatus).toBe(200)
			expect(result.data).toBe("Request updated")
		})
	})

	describe("updateUserMeasurementTypeRequest()", () => {
		it("should return 401 when no token", async () => {
			getItemMock.mockReturnValue(null)
			const { updateUserMeasurementTypeRequest } = useUserSensorOrMeasurementType()
			const result = await updateUserMeasurementTypeRequest("user1", "ecg", "false")
			expect(result.httpStatus).toBe(401)
		})

		it("should post and return message on success", async () => {
			getItemMock.mockReturnValue("fake-token")
			mockPost.mockResolvedValue({ data: { message: "Type updated" } })
			const { updateUserMeasurementTypeRequest } = useUserSensorOrMeasurementType()
			const result = await updateUserMeasurementTypeRequest("user1", "ecg", "false")
			expect(result.httpStatus).toBe(200)
			expect(result.data).toBe("Type updated")
		})
	})

	describe("submitForm()", () => {
		it("should call createUserSensorAccess for sensor.access", async () => {
			getItemMock.mockReturnValue("fake-token")
			mockPost.mockResolvedValue({ data: { message: "ok" } })
			const { submitForm } = useUserSensorOrMeasurementType()
			const result = await submitForm("user1", "sensor1", "sensor.access")
			expect(result.httpStatus).toBe(200)
		})

		it("should call createUserSensorRequest for sensor.request", async () => {
			getItemMock.mockReturnValue("fake-token")
			mockPost.mockResolvedValue({ data: { message: "ok" } })
			const { submitForm } = useUserSensorOrMeasurementType()
			const result = await submitForm("user1", "sensor1", "sensor.request")
			expect(result.httpStatus).toBe(200)
		})

		it("should call createUserMeasurementTypeRequest for measurementType.request", async () => {
			getItemMock.mockReturnValue("fake-token")
			mockPost.mockResolvedValue({ data: { message: "ok" } })
			const { submitForm } = useUserSensorOrMeasurementType()
			const result = await submitForm("user1", "type1", "measurementType.request")
			expect(result.httpStatus).toBe(200)
		})

		it("should return 400 for unknown submitFunction", async () => {
			const { submitForm } = useUserSensorOrMeasurementType()
			const result = await submitForm("user1", "sensor1", "unknown.function")
			expect(result.httpStatus).toBe(400)
			expect(result.error).toBe("No function")
		})

		it("should call post without manual Authorization header", async () => {
			mockPost.mockResolvedValue({ data: { message: "ok" } })
			const { submitForm } = useUserSensorOrMeasurementType()
			await submitForm("user1", "sensor1", "sensor.access")
			expect(mockPost).toHaveBeenCalledWith(expect.any(String), expect.any(Object))
		})
	})
})
