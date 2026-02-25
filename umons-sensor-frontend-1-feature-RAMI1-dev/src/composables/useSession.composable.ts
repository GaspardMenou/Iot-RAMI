import { ref } from "vue"
import { useAxios } from "@/composables/useAxios.composable"
import { io } from "socket.io-client"
import type { CreateClientSideSessionRequestBody, CreateSessionOnServerRequestBody, StartSessionResponse, CreateServorSessionResponse, Session } from "#/session"
import { UserFields, EventTypes, handleEvent } from "@/composables/useUser.composable"
import type { ChartData } from "chart.js"

enum SessionControllerPaths {
	START_SESSION_ON_CLIENT_SIDE = "sessions/new",
	COMPLETE_SESSION_ON_SERVER_SIDE = "sessions/new/on/server",
	SESSION_DATA = "sessions/:id/data", // id must be replaced by that of the session
	GET_USER_SESSIONS = "users/:userId/sessions",
	GET_USER_SESSIONS_ON_A_SENSOR = "users/:userId/sessions/on/sensor/:sensorId",
	GET_SENSOR_SESSIONS = "sensors/:sensorId/sessions",
	EXPORT_SESSION_CSV = "sessions/:id/export/csv",
}

const isValidDate = (date: any): date is Date => {
	return date instanceof Date && !isNaN(date.getTime())
}

const getCorrectUrl = (url: string, parameterToReplace: string, parameterValue: string | null): string => {
	if (parameterValue) {
		return url.replace(parameterToReplace, parameterValue)
	}
	return ""
}

const getURLForFetchingSessionData = (idSession: string): string => {
	return getCorrectUrl(SessionControllerPaths.SESSION_DATA, ":id", idSession)
}

const getURLForFetchingUserSessions = (idUser: string | null): string => {
	return getCorrectUrl(SessionControllerPaths.GET_USER_SESSIONS, ":userId", idUser)
}

const getURLForFetchingSensorSessions = (idSensor: string | null): string => {
	return getCorrectUrl(SessionControllerPaths.GET_SENSOR_SESSIONS, ":sensorId", idSensor)
}

const getURLForFetchingUserSessionsOnASensor = (idUser: string, idSensor: string) => {
	const firstReplacement = getCorrectUrl(SessionControllerPaths.GET_USER_SESSIONS_ON_A_SENSOR, ":sensorId", idSensor)
	return firstReplacement.replace(":userId", idUser)
}

const getURLForExportingSessionAsCsv = (idSession: string): string => {
	return getCorrectUrl(SessionControllerPaths.EXPORT_SESSION_CSV, ":id", idSession)
}

const useDistributionSessionBySensor = () => {
	const { axios } = useAxios()

	// **************************************************** ATTRIBUTES ****************************************************
	// *************************** [ATTRIBUTE]  Distribution of your sessions by sensor
	const chartDataSessionDistribution = ref<ChartData<"bar">>({
		labels: [],
		datasets: [
			{
				label: "Sessions number ",
				backgroundColor: "rgba(75, 192, 192, 0.5)",
				borderColor: "rgba(75, 192, 192, 1)",
				data: [],
			},
		],
	})
	const averageDuration = ref(0)

	// **************************************************** METHODS ****************************************************
	// *************************** [ATTRIBUTE]  Distribution of your sessions by sensor

	const fetchSessionsBySensor = async () => {
		try {
			const userId = localStorage.getItem(UserFields.ID)
			const { data } = await axios.get(getURLForFetchingUserSessions(userId))

			const sensorCounts = data.reduce((acc: any, session: any) => {
				acc[session.idSensor] = (acc[session.idSensor] || 0) + 1
				return acc
			}, {})

			const newLabels = Object.keys(sensorCounts)
			const newData = Object.values(sensorCounts) as (number | [number, number] | null)[]

			updateBarChartWithNewValues(newLabels, newData)

			const totalDuration = data.reduce((acc: number, session: any) => {
				const start = new Date(session.createdAt).getTime()
				const end = new Date(session.endedAt).getTime()
				return acc + (end - start)
			}, 0)

			averageDuration.value = totalDuration / data.length / 60000 // Convertir en minutes
		} catch (error) {
			console.error("Erreur lors de la récupération des sessions par capteur:", error)
		}
	}

	const updateBarChartWithNewValues = (newLabels: string[], newData: (number | [number, number] | null)[]) => {
		chartDataSessionDistribution.value.labels = newLabels
		chartDataSessionDistribution.value.datasets[0].data = newData
	}

	return {
		chartDataSessionDistribution,
		averageDuration,
		fetchSessionsBySensor,
	}
}

const useSession = () => {
	const { axios } = useAxios()

	// **************************************************** ATTRIBUTES ****************************************************
	// *************************** [ATTRIBUTE]  LIST OF SESSIONS AND SELECTED SESSION
	const sessions = ref<Session[]>([])
	const selectedSession = ref<string | null>(null)

	// *************************** [ATTRIBUTE]  SESSION
	const idUser = ref("")
	const idSensor = ref("")
	const idSession = ref("")
	const createdAt = ref<Date | null>(null)
	const endedAt = ref<Date | null>(null)

	// *************************** [ATTRIBUTE]  WebSocket
	const topic = ref("")
	const socketClient = ref<any>(null)

	// *************************** [ATTRIBUTE]  GRAPH SESSION (both realtime and non realtime)
	const chartData = ref({
		labels: [] as string[],
		datasets: [
			{
				label: "Value collected from sensor via WebSocket",
				backgroundColor: "rgba(75, 192, 192, 0.5)",
				borderColor: "rgba(75, 192, 192, 1)",
				fill: false,
				data: [] as { x: Date; y: number }[],
			},
		],
	})

	// *************************** [ATTRIBUTE]  EXTRA INFORMATION (for realtime graph)
	const timeSinceLastValue = ref(0)
	const transmissionSpeed = ref(0)
	const lastMessageTime = ref<Date | null>(null)

	// **************************************************** METHODS ****************************************************
	// *************************** [ATTRIBUTE]  LIST OF SESSIONS AND SELECTED SESSION

	const handleFetchSessionData = (session: { id: string; startDate: string; endDate: string }) => {
		fetchDataAndUpdateChart(session.id)
	}

	const fetchAllSessionsOfSensor = async (sensorId: string) => {
		try {
			const response = await axios.get(getURLForFetchingSensorSessions(sensorId))
			sessions.value = response.data // Mettre à jour les sessions avec les données de l'API
		} catch (error) {
			console.error("Error fetching sessions:", error)
		}
	}

	const fetchAllSessionsOfUser = async (userId: string) => {
		try {
			const response = await axios.get(getURLForFetchingUserSessions(userId))
			sessions.value = response.data // Mettre à jour les sessions avec les données de l'API
		} catch (error) {
			console.error("Error fetching sessions:", error)
		}
	}

	const fetchUserSessionsOnASensor = async ({ idUser, idSensor }: { idUser: string; idSensor: string }) => {
		try {
			const response = await axios.get(getURLForFetchingUserSessionsOnASensor(idUser, idSensor))
			sessions.value = response.data // Mettre à jour les sessions avec les données de l'API
		} catch (error) {
			console.error("Error fetching sessions:", error)
		}
	}

	const handleSessionSelect = (sessionId: string) => {
		selectedSession.value = sessionId
		const session = sessions.value.find(s => s.id === sessionId)
		if (session) {
			handleEvent("emit", EventTypes.SESSION_SELECTED, {
				id: session.id,
				startDate: session.createdAt,
				endDate: session.endedAt,
			})
		}
	}

	const registerOrRemoveEventHandlers = (action: "on" | "off") => {
		handleEvent(action, EventTypes.SENSOR_SELECTED_FOR_FETCHING_SESSIONS, fetchAllSessionsOfSensor)
		handleEvent(action, EventTypes.USER_SELECTED_FOR_FETCHING_SESSIONS, fetchAllSessionsOfUser)
		handleEvent(action, EventTypes.USER_REQUEST_SESSION_BY_SENSOR, fetchUserSessionsOnASensor)
		handleEvent(action, EventTypes.SESSION_SELECTED, handleFetchSessionData)
	}

	// *************************** [METHOD]  SESSION

	const startSessionOnClientSide = async (clientSideSession: CreateClientSideSessionRequestBody) => {
		try {
			const { data } = (await axios.post<StartSessionResponse>(SessionControllerPaths.START_SESSION_ON_CLIENT_SIDE, { ...clientSideSession })) as { data: StartSessionResponse }
			// This retrieve the sensor topic on which you can get the values
			setupSession(clientSideSession.idUser, clientSideSession.idSensor, data.topic, new Date())
			connectToWebSocket(data.topic)
			const sessionId = data.sessionId
			idSession.value = sessionId
		} catch (error) {
			console.error("Erreur lors de la récupération du topic du capteur:", error)
		}
	}

	const createSessionOnServerSide = async () => {
		endedAt.value = new Date()

		if (!createdAt.value || !endedAt.value) {
			console.error("Les valeurs createdAt et endedAt doivent être non nulles.")
			return
		}

		if (!isValidDate(createdAt.value) || !isValidDate(endedAt.value)) {
			console.error("Les valeurs createdAt et endedAt doivent être des dates valides.")
			return
		}

		if (createdAt.value > endedAt.value) {
			console.error("La date de fin doit arriver APRES la date de début !!!")
			return
		}

		const sessionData: CreateSessionOnServerRequestBody = {
			idUser: idUser.value,
			idSensor: idSensor.value,
			createdAt: createdAt.value.toISOString(),
			endedAt: endedAt.value.toISOString(),
			idSession: idSession.value,
		}

		try {
			const { data } = (await axios.post<CreateServorSessionResponse>(SessionControllerPaths.COMPLETE_SESSION_ON_SERVER_SIDE, sessionData)) as unknown as { data: CreateServorSessionResponse }

			socketClient.value?.disconnect()
			cleanAfterSession()
		} catch (error) {
			console.error("Erreur lors de la tentative de fin de la session:", error)
		}
	}

	const setupSession = (userId: string, sensorId: string, sessionTopic: string, sessionCreatedAt: Date) => {
		idUser.value = userId
		idSensor.value = sensorId
		topic.value = sessionTopic
		createdAt.value = sessionCreatedAt
	}

	const cleanAfterSession = () => {
		idSession.value = ""
		topic.value = ""
		createdAt.value = null
		endedAt.value = null
	}
	const connectToWebSocket = (topic: string) => {
		const token = localStorage.getItem(UserFields.TOKEN)
		const socket = io(import.meta.env.VITE_SOCKET_URL)
		socketClient.value = socket
		socket.emit("join-session", { topic, token })
		socket.on("new-data", (data: any) => {
			try {
				const { timestamp, value } = data

				const date = new Date(Math.floor(timestamp / 1000))
				if (!isNaN(value)) {
					updateChart(date, parseFloat(value))
					updateTransmissionSpeed(date)
					console.log("📨 [WebSocket] Données extraites:", {
						date: date.toISOString(),
						value,
					})
				}
			} catch (error) {
				console.error("Error processing WebSocket data:", error)
			}
		})

		return socket
	}
	// *************************** [METHOD]  GRAPH SESSION (both realtime and non realtime)

	const updateChartWithNewValues = (newLabels: string[], newData: { x: Date; y: number }[]) => {
		chartData.value = {
			labels: newLabels,
			datasets: [
				{
					label: chartData.value.datasets[0].label,
					backgroundColor: chartData.value.datasets[0].backgroundColor,
					borderColor: chartData.value.datasets[0].borderColor,
					fill: false,
					data: newData,
				},
			],
		}
	}

	const updateChart = (label: Date, value: number) => {
		const newLabels = [...chartData.value.labels, label.toISOString()]
		const newData = [...chartData.value.datasets[0].data, { x: label, y: value }]

		if (newLabels.length > 100) {
			newLabels.shift()
			newData.shift()
		}

		updateChartWithNewValues(newLabels, newData)
	}

	const fetchDataAndUpdateChart = async (idSession: string) => {
		try {
			const response = await axios.get(getURLForFetchingSessionData(idSession))
			const sessionData = response.data

			const newLabels = sessionData.map((item: any) => new Date(item.time).toISOString())
			const newData = sessionData.map((item: any) => ({ x: new Date(item.time), y: item.value }))

			updateChartWithNewValues(newLabels, newData)
		} catch (error) {
			console.error("Error fetching data", error)
		}
	}

	// *************************** [METHOD]  EXTRA INFORMATION (for realtime graph)

	const updateTransmissionSpeed = (currentTime: Date) => {
		if (lastMessageTime.value) {
			const timeDiff = (currentTime.getTime() - lastMessageTime.value.getTime()) / 1000
			timeSinceLastValue.value = timeDiff
			if (timeDiff > 0) {
				transmissionSpeed.value = 1 / timeDiff
			}
		}
		lastMessageTime.value = currentTime
	}

	const exportSessionToCsv = async (sessionId: string) => {
		try {
			const url = getURLForExportingSessionAsCsv(sessionId)
			const response = await axios.get(url, { responseType: 'blob' })
			const blobUrl = URL.createObjectURL(response.data)
			const link = document.createElement('a')
			link.href = blobUrl
			link.download = `session-${sessionId}.csv`
			link.click()
			URL.revokeObjectURL(blobUrl)
		} catch (error) {
			console.error("Error exporting session to CSV:", error)
		}
	}

	return {
		idUser,
		idSensor,
		idSession,
		topic,
		chartData,
		timeSinceLastValue,
		transmissionSpeed,
		startSessionOnClientSide,
		createSessionOnServerSide,
		fetchDataAndUpdateChart,
		fetchAllSessionsOfSensor,
		sessions,
		selectedSession,
		handleSessionSelect,
		registerOrRemoveEventHandlers,
		exportSessionToCsv,
	}
}
export { useDistributionSessionBySensor, useSession }
