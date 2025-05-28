import { createContext, createRef, type RefObject } from "react"

export interface ChatInputHandle {
	prefill: (value: string) => void
}

export const ChatInputContext =
	createContext<RefObject<ChatInputHandle | null>>(createRef())
