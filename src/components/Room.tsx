import * as Ariakit from "@ariakit/react"
import { useMutation, useQuery } from "convex/react"
import type { ReactNode } from "react"
import { useActionState, useRef, useState } from "react"
import { useLocation } from "wouter"
import { api } from "../../convex/_generated/api"
import { Id, type Doc } from "../../convex/_generated/dataModel"
import type { ClientRoom } from "../../convex/rooms.ts"
import { useLocalStorageState } from "../hooks/storage.ts"
import { useFileUpload } from "../hooks/useFileUpload.ts"
import { panel } from "../styles/panel.ts"
import { AssetsPanel } from "./AssetsPanel.tsx"
import { CharacterManager } from "./CharacterManager.tsx"
import { Chat, ChatInputRef } from "./Chat.tsx"
import { DocumentTitle } from "./DocumentTitle.tsx"
import { EditableText } from "./EditableText.tsx"
import { SceneViewer } from "./SceneViewer.tsx"
import { Button } from "./ui/Button.tsx"
import { Dialog, DialogPanel } from "./ui/Dialog.tsx"
import { Field } from "./ui/Field.tsx"
import { Icon } from "./ui/Icon.tsx"
import { Input } from "./ui/Input.tsx"

export function Room({ slug }: { slug: string }) {
	const room = useQuery(api.rooms.getBySlug, { slug })
	const updateRoom = useMutation(api.rooms.update)
	const chatInputRef = useRef<ChatInputRef | null>(null)

	const [playerName, setPlayerName] = useLocalStorageState<string | null>(
		"Room:playerName",
		null,
		(input) => (input == null ? null : String(input)),
	)

	if (playerName === null) {
		return <PlayerNameDialog onSubmit={setPlayerName} />
	}

	if (room === undefined) {
		return (
			<div className="flex h-screen items-center justify-center">
				Loading room...
			</div>
		)
	}

	if (room === null) {
		return (
			<div className="flex h-screen items-center justify-center">
				Room not found
			</div>
		)
	}

	if (!room.isMember) {
		return <RoomInvitation room={room} />
	}

	const sidebarTabs = [
		{
			name: "Characters",
			icon: <Icon icon="mingcute:group-2-fill" className="size-5" />,
			content: (
				<CharacterManager chatInputRef={chatInputRef} roomId={room._id} />
			),
		},
		{
			name: "Assets",
			icon: <Icon icon="mingcute:pic-fill" className="size-5" />,
			content: <AssetsPanel />,
		},
		{
			name: "Settings",
			icon: <Icon icon="mingcute:settings-2-fill" className="size-5" />,
			content: (
				<RoomSettings
					playerName={playerName}
					onUpdateRoom={(name) => updateRoom({ roomId: room._id, name })}
					onUpdatePlayerName={setPlayerName}
					room={room}
				/>
			),
		},
	]

	return (
		<DocumentTitle title={`${room.name} | Aspects VTT`}>
			<SceneViewer room={room} />
			<div className="fixed top-0 left-0 grid h-dvh grid-rows-[100%] p-2 opacity-90 transition-opacity hover:opacity-100">
				<Sidebar tabs={sidebarTabs} />
			</div>
			<div className="fixed right-0 bottom-0 grid h-dvh grid-rows-[100%] p-2 opacity-90 transition-opacity hover:opacity-100">
				<Chat
					roomId={room._id}
					playerName={playerName}
					chatInputRef={chatInputRef}
				/>
			</div>
		</DocumentTitle>
	)
}

interface RoomSettingsProps {
	room: Doc<"rooms">
	onUpdateRoom: (name: string) => void
	playerName: string
	onUpdatePlayerName: (name: string) => void
}

function RoomSettings({
	room,
	onUpdateRoom,
	playerName,
	onUpdatePlayerName,
}: RoomSettingsProps) {
	const leaveRoom = useMutation(api.rooms.leaveRoom)
	const [, navigate] = useLocation()

	const [, leaveAction, isLeaving] = useActionState(async () => {
		try {
			await leaveRoom({ roomId: room._id })
			navigate("/")
		} catch (error) {
			console.error("Error leaving room:", error)
			return "Failed to leave room"
		}
	}, null)
	return (
		<Ariakit.HeadingLevel>
			<section className={panel("flex w-64 flex-col gap-4 p-4")}>
				<Ariakit.Heading className="text-xl font-light">
					Settings
				</Ariakit.Heading>

				<Field label="Room Name" htmlFor="roomName">
					<EditableText
						id="roomName"
						value={room.name}
						onChange={(value) => {
							if (value.trim() && value !== room.name) {
								onUpdateRoom(value.trim())
							}
						}}
						placeholder="Enter room name"
					/>
				</Field>

				<Field label="Background">
					<BackgroundUploader roomId={room._id} />
				</Field>

				<Field label="Your Name" htmlFor="localName">
					<EditableText
						id="localName"
						value={playerName}
						onChange={(value) => {
							if (value.trim() && value !== playerName) {
								onUpdatePlayerName(value.trim())
							}
						}}
						placeholder="Enter your name"
					/>
				</Field>

				<form action={leaveAction} className="contents">
					<Button
						type="submit"
						className="border border-red-900/50 text-red-400 hover:bg-red-950/30"
						icon={<Icon icon="mingcute:open-door-fill" />}
						disabled={isLeaving}
					>
						{isLeaving ? "Leaving..." : "Leave room"}
					</Button>
				</form>
			</section>
		</Ariakit.HeadingLevel>
	)
}

function RoomInvitation({ room }: { room: ClientRoom }) {
	const joinRoom = useMutation(api.rooms.joinRoom)

	const [, joinAction, isPending] = useActionState(async () => {
		await joinRoom({ roomId: room._id })
	}, undefined)

	return (
		<div className="flex h-screen flex-col items-center justify-center gap-6 bg-gray-950 p-6 text-center">
			<form
				action={joinAction}
				className="flex max-w-md flex-col items-center gap-4"
			>
				<p className="text-sm font-medium text-gray-400">
					You have been invited to
				</p>
				<Ariakit.HeadingLevel>
					<Ariakit.Heading className="text-4xl font-light text-white">
						{room.name}
					</Ariakit.Heading>
				</Ariakit.HeadingLevel>
				<Button
					type="submit"
					className="mt-4 hover:bg-gray-800"
					icon={<Icon icon="mingcute:open-door-fill" />}
					pending={isPending}
				>
					{isPending ? "Joining..." : "Join room"}
				</Button>
			</form>
		</div>
	)
}

function BackgroundUploader({ roomId }: { roomId: Id<"rooms"> }) {
	const updateRoom = useMutation(api.rooms.update)
	const room = useQuery(api.rooms.get, { roomId })

	const { uploadFile, isUploading } = useFileUpload({
		onSuccess: async (storageId) => {
			await updateRoom({ roomId, backgroundId: storageId })
		},
		onError: (error) => {
			console.error("Error uploading background:", error)
		},
	})

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0]
		if (file) {
			await uploadFile(file)
		}
	}

	return (
		<>
			<div className="group relative aspect-video w-full overflow-hidden rounded border border-gray-800 bg-gray-950/25 transition focus-within:ring-2 focus-within:ring-primary-500/50 hover:border-gray-700 hover:bg-gray-950/50">
				{room?.backgroundUrl && (
					<div
						className={`h-full w-full bg-cover bg-center brightness-25 transition group-hover:brightness-50`}
						style={{ backgroundImage: `url(${room.backgroundUrl})` }}
					/>
				)}
				<label className="absolute inset-0 flex items-center justify-center gap-2 p-2">
					<Icon
						icon={
							isUploading ? "mingcute:loading-3-fill" : "mingcute:upload-2-fill"
						}
						className={`size-5 ${isUploading ? "animate-spin" : ""}`}
						aria-hidden
					/>
					<span className="text-sm font-medium">
						{room?.backgroundUrl ? "Change Background" : "Upload Background"}
					</span>
					<input
						type="file"
						accept="image/*"
						className="hidden"
						onChange={handleFileChange}
					/>
				</label>
			</div>
			{room?.backgroundUrl && (
				<Button
					icon={<Icon icon="mingcute:close-fill" />}
					onClick={() => {
						updateRoom({ roomId, backgroundId: null })
					}}
				>
					Remove Background
				</Button>
			)}
		</>
	)
}

function PlayerNameDialog({ onSubmit }: { onSubmit: (name: string) => void }) {
	const [nameInput, setNameInput] = useState("")

	return (
		<Dialog open>
			<DialogPanel title="Enter Your Name">
				<form
					className="flex flex-col gap-4"
					action={() => {
						const name = nameInput.trim()
						if (name) {
							onSubmit(name)
						}
					}}
				>
					<Input
						label="Your name"
						placeholder="Enter your player name"
						required
						value={nameInput}
						onChange={(e) => setNameInput(e.target.value)}
						autoFocus
					/>
					<Button
						type="submit"
						appearance="default"
						size="default"
						className="w-full"
					>
						Enter Room
					</Button>
				</form>
			</DialogPanel>
		</Dialog>
	)
}

interface TabConfig {
	name: string
	icon: ReactNode
	content: ReactNode
}

interface SidebarProps {
	tabs: TabConfig[]
}

function Sidebar({ tabs }: SidebarProps) {
	const [selectedTabId, setSelectedTabId] = useLocalStorageState<
		string | undefined | null
	>("Sidebar:selectedTabId", null, (input) =>
		input == null ? null : String(input),
	)

	return (
		<Ariakit.TabProvider
			selectedId={selectedTabId}
			setSelectedId={setSelectedTabId}
		>
			<div className="flex h-full flex-col items-start gap-2">
				<Ariakit.TabList className={panel("flex gap-1 p-1")}>
					{tabs.map((tab) => (
						<SidebarTab key={tab.name} name={tab.name} icon={tab.icon} />
					))}
				</Ariakit.TabList>

				{tabs.map((tab) => (
					<Ariakit.TabPanel
						key={tab.name}
						id={tab.name}
						className="min-h-0 flex-1"
					>
						{tab.content}
					</Ariakit.TabPanel>
				))}
			</div>
		</Ariakit.TabProvider>
	)
}

function SidebarTab({ name, icon }: { name: string; icon: ReactNode }) {
	const store = Ariakit.useTabContext()
	const selectedTabId = Ariakit.useStoreState(
		store,
		(state) => state?.selectedId,
	)
	return (
		<Ariakit.TooltipProvider placement="bottom-start">
			<Ariakit.Tab
				id={name}
				className="flex size-8 items-center justify-center rounded transition-colors hover:bg-white/5 aria-selected:bg-white/5 aria-selected:text-primary-300"
				render={<Ariakit.TooltipAnchor />}
				onClick={() => {
					if (selectedTabId === name) {
						store?.setSelectedId(null)
					} else {
						store?.setSelectedId(name)
					}
				}}
			>
				{icon}
			</Ariakit.Tab>
			<Ariakit.Tooltip className="translate-y-1 rounded border border-gray-300 bg-white px-2 py-0.5 text-sm font-bold text-gray-900 opacity-0 transition data-enter:translate-y-0 data-enter:opacity-100">
				{name}
			</Ariakit.Tooltip>
		</Ariakit.TooltipProvider>
	)
}
