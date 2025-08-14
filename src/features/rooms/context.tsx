/* eslint-disable react-refresh/only-export-components */
import { type } from "arktype"
import { createContext, use } from "react"
import { raise, recordValues } from "../../lib/utils.ts"
import { useLocalStorageStateWithSchema } from "../dom/storage.ts"

const RoomContext = createContext<RoomContextValue>()

export function RoomProvider({ children }: { children: React.ReactNode }) {
	const state = useRoomContextValue()
	return <RoomContext value={state}>{children}</RoomContext>
}

export function useRoomContext() {
	return use(RoomContext) ?? raise("RoomProvider not found")
}

export const RoomTabNames = {
	Assets: "Assets",
	Scenes: "Scenes",
	Chat: "Chat",
	Settings: "Settings",
} as const

const RoomTabName = type.enumerated(...recordValues(RoomTabNames))

export function resolveRoomTabName(input: string) {
	return RoomTabName.allows(input) ? input : undefined
}

export type RoomContextValue = ReturnType<typeof useRoomContextValue>

function useRoomContextValue() {
	const [selectedTabId, setSelectedTabId] = useLocalStorageStateWithSchema({
		key: "Room:selectedTabId",
		schema: RoomTabName.or("null | undefined"),
		defaultValue: null,
	})

	return {
		selectedTabId,
		setSelectedTabId,
	}
}
