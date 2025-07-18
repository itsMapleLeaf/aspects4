import { type } from "arktype"
import { createContext, use } from "react"
import { useLocalStorageStateWithSchema } from "../hooks/storage.ts"
import { raise } from "../lib/utils.ts"

const RoomContext = createContext<RoomContextValue>()

export function RoomProvider({ children }: { children: React.ReactNode }) {
	const state = useRoomContextValue()
	return <RoomContext value={state}>{children}</RoomContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRoomContext() {
	return use(RoomContext) ?? raise("RoomProvider not found")
}

export type RoomContextValue = ReturnType<typeof useRoomContextValue>

function useRoomContextValue() {
	const [selectedTabId, setSelectedTabId] = useLocalStorageStateWithSchema({
		key: "Room:selectedTabId",
		schema: type("string | null | undefined"),
		defaultValue: null,
	})

	return {
		selectedTabId,
		setSelectedTabId,
	}
}
