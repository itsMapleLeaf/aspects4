import { createContext, createRef, type RefObject } from "react"

export interface ChatInputHandle {
	prefill: (value: string) => void
	sendMessage: (text: string) => Promise<void>
	addLocalMessage: (text: string) => void
}

export const ChatInputContext =
	// eslint-disable-next-line react-x/no-create-ref
	createContext<RefObject<ChatInputHandle | null>>(createRef())
