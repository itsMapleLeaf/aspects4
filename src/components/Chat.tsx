import { useMutation, useQuery } from "convex/react"
import { useCallback, useImperativeHandle, useRef, useState } from "react"
import { twMerge } from "tailwind-merge"
import { rollDice } from "~/lib/dice.ts"
import { panel } from "~/styles/panel.ts"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import type { ChatInputHandle } from "./ChatInputContext.tsx"
import { Icon } from "./ui/Icon.tsx"

type LocalMessage = {
	_id: string
	_creationTime: number
	sender: string
	content: string
	isLocal: true
}

function createLocalMessage(playerName: string, content: string): LocalMessage {
	return {
		_id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
		_creationTime: Date.now(),
		sender: playerName,
		content,
		isLocal: true,
	}
}

const shortTimeFormat = new Intl.DateTimeFormat(undefined, {
	timeStyle: "short",
})

const fullDateFormat = new Intl.DateTimeFormat(undefined, {
	dateStyle: "long",
	timeStyle: "medium",
})

export function Chat({
	room,
	playerName,
	chatInputRef,
	className,
}: {
	room: { _id: Id<"rooms">; name: string }
	playerName: string
	chatInputRef: React.RefObject<ChatInputHandle | null>
	className?: string
}) {
	const remoteMessages = useQuery(api.messages.list, { roomId: room._id })
	const createMessage = useMutation(api.messages.create)
	const [localMessages, setLocalMessages] = useState<LocalMessage[]>(() => [
		createLocalMessage(
			playerName,
			`Welcome to ${room.name}!\nType /help to see available commands.`,
		),
	])

	const addLocalMessage = (content: string) => {
		const newMessage: LocalMessage = createLocalMessage(playerName, content)
		setLocalMessages((prev) => [...prev, newMessage])
	}

	const removeLocalMessage = (id: string) => {
		setLocalMessages((prev) => prev.filter((msg) => msg._id !== id))
	}

	const allMessages = [...(remoteMessages ?? []), ...localMessages].sort(
		(a, b) => a._creationTime - b._creationTime,
	)

	type Command = {
		usage: string[]
		run: (args: string[]) => void
	}

	const commands = {
		help: {
			usage: ["/help - Show available commands"],
			run: async () => {
				let helpMessage = "Available commands:\n"
				Object.entries(commands).forEach(([_cmd, info]) => {
					for (const line of info.usage) {
						helpMessage += line + "\n"
					}
				})
				addLocalMessage(helpMessage)
			},
		},
		roll: {
			usage: [
				"/roll XdY - Roll dice (e.g. /roll 3d12)",
				"/roll aspects X - Roll X aspect dice (e.g. /roll aspects 3)",
				"/roll a[X] - Shorthand for aspects dice (e.g. /roll a3)",
				"/r [...] - Shorthand for /roll (e.g. /r a3)",
			],
			run: async (args) => {
				const result = rollDice(args)
				if (result.success) {
					await createMessage({
						sender: playerName,
						content: result.message,
						roomId: room._id,
					})
				} else {
					addLocalMessage(result.message)
				}
			},
		},
		rollpriv: {
			usage: [
				"/rollpriv [...] - Same as /roll, but only you can see it (e.g. /rollpriv 3d12)",
				"/rp [...] - Shorthand for /rollpriv (e.g. /rp 3d12)",
			],
			run: async (args) => {
				const result = rollDice(args)
				if (result.success) {
					addLocalMessage(result.message)
				} else {
					addLocalMessage(result.message)
				}
			},
		},
	} satisfies Record<string, Command>

	const commandMap = new Map(Object.entries(commands))
	commandMap.set("r", commands.roll)
	commandMap.set("rp", commands.rollpriv)

	const textareaRef = useRef<HTMLTextAreaElement>(null)

	useImperativeHandle(chatInputRef, () => ({
		prefill: (value: string) => {
			if (textareaRef.current) {
				textareaRef.current.value = value
				textareaRef.current.focus()
			}
		},
		async sendMessage(text) {
			await createMessage({
				roomId: room._id,
				sender: playerName,
				content: text,
			})
		},
		addLocalMessage,
	}))

	const handleKeyDown = async (
		event: React.KeyboardEvent<{ value: string }>,
	) => {
		if (event.key === "Enter" && !event.shiftKey && !event.ctrlKey) {
			event.preventDefault()

			const content = event.currentTarget.value.trim()
			if (!content) return

			event.currentTarget.value = ""

			try {
				if (content.startsWith("/")) {
					const commandParts = content.slice(1).split(/\s+/)
					const commandName = commandParts[0]?.toLowerCase()
					const command = commandName && commandMap.get(commandName)
					if (command) {
						await command.run(commandParts.slice(1))
					} else {
						addLocalMessage(
							`Unknown command "/${commandName}". Type "/help" for available commands.`,
						)
					}
				} else {
					await createMessage({
						sender: playerName,
						content,
						roomId: room._id,
					})
				}
			} catch (error) {
				console.error(error)
				addLocalMessage(
					`Error: ${error instanceof Error ? error.message : "Something went wrong. Try again."}`,
				)
				event.currentTarget.value = content
			}
		}
	}

	const bottomScrollRef = useCallback((element: Element | null) => {
		if (!element?.firstElementChild) return

		const obs = new MutationObserver(() => {
			element.scrollTo({
				top: element.scrollHeight,
				behavior: "smooth",
			})
		})
		obs.observe(element.firstElementChild, { childList: true })
		return () => obs.disconnect()
	}, [])

	return (
		<section
			aria-label="Chat"
			className={twMerge(
				"flex h-full flex-col gap-2 overflow-y-auto [scrollbar-gutter:stable]",
				className,
			)}
			ref={bottomScrollRef}
		>
			<ul className="flex flex-1 flex-col justify-end gap-2">
				{allMessages.map((message) => (
					<li key={message._id} className={panel("flex flex-col")}>
						{"isLocal" in message ? null : (
							<p className="text-sm text-gray-300">
								{message.sender} &bull;{" "}
								<time
									dateTime={new Date(message._creationTime).toISOString()}
									title={fullDateFormat.format(message._creationTime)}
								>
									{shortTimeFormat.format(message._creationTime)}
								</time>
							</p>
						)}
						{message.content.split(/(\r?\n)+/).map((line) => (
							<p key={line} className="mt-0.5">
								{line}
							</p>
						))}
						{"isLocal" in message && (
							<div className="flex translate-y-0.5 items-center gap-1 font-medium text-gray-400">
								<Icon icon="mingcute:eye-2-fill" className="text-gray-600" />
								<p className="text-xs">Only you can see this</p>
								<span aria-hidden>&bull;</span>
								<button
									className="text-xs text-primary-400 hover:text-primary-300 hover:underline"
									onClick={() => removeLocalMessage(message._id)}
								>
									Dismiss
								</button>
							</div>
						)}
					</li>
				))}
			</ul>

			<footer
				className={panel(
					"sticky bottom-0 p-0 shadow-[0_0_8px_black] focus-within:border-gray-700",
				)}
			>
				<textarea
					ref={textareaRef}
					placeholder="Say something!"
					className="block field-sizing-content w-full resize-none px-3 py-2 focus:outline-none"
					onKeyDown={handleKeyDown}
				/>
			</footer>
		</section>
	)
}
