import type { UserSensorAccess, UserSensorAccessUpdateResponse, UserSensorRequest, UserSensorRequestUpdateResponse } from "#/userSensor"
import { useAxios } from "@/composables/useAxios.composable"
import { useUserSensorOrMeasurementTypeStore } from "@/stores/userSensorOrMeasurementType"
import type { UserMeasurementTypeRequest, UserMeasurementTypeUpdateResponse } from "#/userMeasurementType"

export interface ComposableResponse<T> {
	data: T | null
	error: string | null
	httpStatus: number | null
}

const useUserSensorOrMeasurementType = () => {
	const { axios } = useAxios()

	const handleErrors = (e: any): ComposableResponse<any> => {
		const httpStatus: number = e.response?.status || 500
		const { message, status } = e.response?.data ?? {}
		const messageClean = "Error " + (status ?? httpStatus) + " - " + message
		return { data: null, error: messageClean, httpStatus }
	}

	const getAllUserSensorAccess = async (): Promise<ComposableResponse<UserSensorAccess[]>> => {
		try {
			const { data } = await axios.get<UserSensorAccess[]>("/users/sensors/access?number=1000")
			return { data, error: null, httpStatus: 200 }
		} catch (e) {
			return handleErrors(e)
		}
	}

	const getAllUserSensorRequest = async (): Promise<ComposableResponse<UserSensorRequest[]>> => {
		try {
			const { data } = await axios.get<UserSensorRequest[]>("/users/sensors/creation?number=1000")
			return { data, error: null, httpStatus: 200 }
		} catch (e) {
			return handleErrors(e)
		}
	}

	const updateUserSensorAccess = async (user: string, sensor: string, banned: string): Promise<ComposableResponse<string>> => {
		try {
			const { data } = await axios.post<UserSensorAccessUpdateResponse>("/users/sensors/access", { userName: user, sensorName: sensor, banned: banned })
			await useUserSensorOrMeasurementTypeStore().refresh()
			return { data: data.message, error: null, httpStatus: 200 }
		} catch (e) {
			return handleErrors(e)
		}
	}

	const updateUserSensorRequest = async (user: string, sensor: string, banned: string): Promise<ComposableResponse<string>> => {
		try {
			const { data } = await axios.post<UserSensorRequestUpdateResponse>("/users/sensors/creation", { userName: user, sensorName: sensor, banned: banned })
			await useUserSensorOrMeasurementTypeStore().refresh()
			return { data: data.message, error: null, httpStatus: 200 }
		} catch (e) {
			return handleErrors(e)
		}
	}

	const createUserSensorAccess = async (user: string, sensor: string): Promise<ComposableResponse<string>> => {
		try {
			const { data } = await axios.post<UserSensorAccessUpdateResponse>("/users/sensors/access/ask", { user: user, sensor: sensor })
			return { data: data.message, error: null, httpStatus: 200 }
		} catch (e) {
			return handleErrors(e)
		}
	}

	const createUserSensorRequest = async (user: string, sensor: string): Promise<ComposableResponse<string>> => {
		try {
			const { data } = await axios.post<UserSensorRequestUpdateResponse>("/users/sensors/creation/ask", { user: user, sensor: sensor })
			return { data: data.message, error: null, httpStatus: 200 }
		} catch (e) {
			return handleErrors(e)
		}
	}

	const getAllUserMeasurementTypeRequest = async (): Promise<ComposableResponse<UserMeasurementTypeRequest[]>> => {
		try {
			const { data } = await axios.get<UserMeasurementTypeRequest[]>("/users/measurementTypes/creation?number=1000")
			return { data, error: null, httpStatus: 200 }
		} catch (e) {
			return handleErrors(e)
		}
	}

	const updateUserMeasurementTypeRequest = async (user: string, type: string, banned: string): Promise<ComposableResponse<string>> => {
		try {
			const { data } = await axios.post<UserMeasurementTypeUpdateResponse>("/users/measurementTypes/creation", { userName: user, type: type, banned: banned })
			await useUserSensorOrMeasurementTypeStore().refresh()
			return { data: data.message, error: null, httpStatus: 200 }
		} catch (e) {
			return handleErrors(e)
		}
	}

	const createUserMeasurementTypeRequest = async (user: string, type: string): Promise<ComposableResponse<string>> => {
		try {
			const { data } = await axios.post<UserMeasurementTypeUpdateResponse>("/users/measurementTypes/creation/ask", { user: user, type: type })
			return { data: data.message, error: null, httpStatus: 200 }
		} catch (e) {
			return handleErrors(e)
		}
	}

	const submitForm = async (user: string, sensor: string, submitFunction: string): Promise<ComposableResponse<string>> => {
		switch (submitFunction) {
			case "sensor.access":
				return await createUserSensorAccess(user, sensor)
			case "sensor.request":
				return await createUserSensorRequest(user, sensor)
			case "measurementType.request":
				return await createUserMeasurementTypeRequest(user, sensor)
			default:
				return { data: null, error: "No function", httpStatus: 400 }
		}
	}

	return {
		getAllUserSensorAccess,
		updateUserSensorAccess,
		createUserSensorAccess,
		getAllUserSensorRequest,
		updateUserSensorRequest,
		createUserSensorRequest,
		submitForm,
		getAllUserMeasurementTypeRequest,
		updateUserMeasurementTypeRequest,
		createUserMeasurementTypeRequest,
	}
}

export default useUserSensorOrMeasurementType
