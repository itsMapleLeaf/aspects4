import { useMutation } from "convex/react"
import {
	createContext,
	use,
	useState,
	type Context as ChatContext,
} from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { raise } from "../lib/utils.ts"

export type ChatController = ReturnType<typeof useChatController>

function useChatController(roomId: Id<"rooms">) {
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

const ChatContext = createContext<ChatController>()

export function ChatProvider({
	roomId,
	children,
}: {
	roomId: Id<"rooms">
	children: React.ReactNode
}) {
	const controller = useChatController(roomId)
	return <ChatContext value={controller}>{children}</ChatContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChatContext() {
	return use(ChatContext) ?? raise("ChatProvider not found")
}
