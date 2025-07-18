import { useMutation } from "convex/react"
import { createContext, use, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { raise } from "../lib/utils.ts"

export type ChatState = ReturnType<typeof useChatState>

function useChatState(roomId: Id<"rooms">) {
	const [input, setInput] = useState("")
	const createMessage = useMutation(api.messages.create)

	return {
		input,
		setInput,
		sendMessage: (content: string) => {
			return createMessage({ content, roomId })
		},
	}
}

const ChatContext = createContext<ChatState>()

export function ChatProvider({
	roomId,
	children,
}: {
	roomId: Id<"rooms">
	children: React.ReactNode
}) {
	const state = useChatState(roomId)
	return <ChatContext value={state}>{children}</ChatContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChatContext() {
	return use(ChatContext) ?? raise("ChatProvider not found")
}
