import { ref, computed } from "vue"
import type { Sensor } from "#/sensor"
import { useAxios } from "@/composables/useAxios.composable"
import { EventTypes, handleEvent } from "@/composables/useUser.composable"
import { io } from "socket.io-client"

/******************************************* ROUTES PATHS & INTERFACE **********************************************/

/**
 * Enum for User Routes Paths (Backend)
 * This enum defines the different API endpoint paths for sensor-related operations.
 */

enum SensorAPIEndpoint {
	GET_SENSOR_STATUS = "/sensors/connexion/online/:sensorName",
	GET_ALL_SENSOR = "/sensors",
}

const getURLForGettingSensorStatus = (sensorName: string | undefined): string => {
	if (sensorName) {
		return SensorAPIEndpoint.GET_SENSOR_STATUS.replace(":sensorName", sensorName)
	}
	return ""
}

export enum SensorState {
	ONLINE = "online",
	PUBLISHING = "publishing",
	OFFLINE = "offline",
	ERROR = "error",
	UNKNOWN = "unknow",
}

export const useSensor = (sensorName: string | undefined) => {
	const { axios } = useAxios()

	// **************************************************** ATTRIBUTES ****************************************************
	// *************************** [ATTRIBUTE]  SENSOR STATUS

	const status = ref<SensorState>(SensorState.UNKNOWN)

	// *************************** [ATTRIBUTE]  SENSOR LIST AND SENSOR SELECTION

	const sensors = ref<Sensor[]>([])
	const selectedSensor = ref<string | undefined>(undefined) // Change initial value to undefined

	// **************************************************** METHODS ****************************************************
	// *************************** [METHOD]  SENSOR STATUS

	const checkSensorStatus = async () => {
		try {
			const response = await axios.get(getURLForGettingSensorStatus(sensorName))
			//console.log(response)
			if (response.data.message) {
				status.value = response.data.message
				//console.log(response.data.message)
			}
		} catch (error) {
			console.error("Error pinging sensor:", error)
			status.value = SensorState.ERROR
		}
	}

	const statusClass = computed(() => {
		return {
			"status-online": status.value === SensorState.ONLINE,
			"status-publishing": status.value === SensorState.PUBLISHING,
			"status-offline": status.value === SensorState.OFFLINE,
			"status-error": status.value === SensorState.ERROR,
			"status-unknown": status.value === SensorState.UNKNOWN,
		}
	})

	// *************************** [METHOD]  SENSOR LIST AND SENSOR SELECTION

	const getAllSensors = async () => {
		const allSensors: Sensor[] = []
		let page = 1
		const limit = 100
		while (true) {
			const result = (await axios.get(SensorAPIEndpoint.GET_ALL_SENSOR, { params: { page, limit } })) as { data: { data: Sensor[]; totalPages: number } | Sensor[] }
			const payload = result.data
			if (Array.isArray(payload)) return payload
			allSensors.push(...payload.data)
			if (page >= payload.totalPages) break
			page++
		}
		return allSensors
	}

	const fetchSensors = async () => {
		try {
			const allSensors = await getAllSensors()
			sensors.value = allSensors
		} catch (error) {
			console.error("Error fetching sensors:", error)
		}
	}

	const handleSensorSelect = (sensorId: string) => {
		selectedSensor.value = sensorId
	}

	// *************************** [METHOD] DEALING WITH GOOG FORMAT

	const calculateDuration = (createdAt: string, endedAt: string) => {
		const startDate = new Date(createdAt)
		const endDate = new Date(endedAt)

		if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
			return "Invalid date"
		}

		const duration = (endDate.getTime() - startDate.getTime()) / 1000
		const hours = Math.floor(duration / 3600)
		const minutes = Math.floor((duration % 3600) / 60)
		const seconds = Math.floor(duration % 60)

		return `${hours}h ${minutes}m ${seconds}s`
	}

	const formatHumanReadableDate = (isoDateString: string, omitTime: boolean = false, compact: boolean = false) => {
		const date = new Date(isoDateString)

		if (isNaN(date.getTime())) {
			return "Invalid date"
		}

		if (compact) {
			const dd = String(date.getDate()).padStart(2, "0")
			const mm = String(date.getMonth() + 1).padStart(2, "0")
			const hh = String(date.getHours()).padStart(2, "0")
			const min = String(date.getMinutes()).padStart(2, "0")
			const ss = String(date.getSeconds()).padStart(2, "0")
			return `${dd}/${mm} ${hh}:${min}:${ss}`
		}

		const options: Intl.DateTimeFormatOptions = omitTime
			? {
					year: "numeric",
					month: "long",
					day: "numeric",
			  }
			: {
					year: "numeric",
					month: "long",
					day: "numeric",
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					timeZoneName: "short",
			  }

		return date.toLocaleDateString("be-BE", options)
	}

	// *************************** [METHOD] DEALING WITH GOOG FORMAT
	const throwUserRequestSessionBySensor = (idSensor: string) => {
		handleEvent("emit", EventTypes.USER_REQUEST_SESSION_BY_SENSOR, { idSensor })
	}

	const listenToSensorStatus = () => {
		const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000")
		socket.on("sensor-status", (data: { sensorName: string; status: SensorState }) => {
			if (data.sensorName === sensorName) {
				status.value = data.status
			}
		})
		return socket
	}

	return {
		status,
		statusClass,
		checkSensorStatus,
		fetchSensors,
		handleSensorSelect,
		listenToSensorStatus,
		sensors,
		selectedSensor,
		calculateDuration,
		formatHumanReadableDate,
		throwUserRequestSessionBySensor,
	}
}
