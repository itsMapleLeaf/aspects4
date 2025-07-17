import * as Ariakit from "@ariakit/react"
import { useMutation, useQuery } from "convex/react"
import type { ReactNode } from "react"
import { useActionState, useRef } from "react"
import { useLocation } from "wouter"
import { SceneViewerHelpButton } from "~/components/SceneViewer"
import { api } from "../../convex/_generated/api"
import { Id, type Doc } from "../../convex/_generated/dataModel"
import type { ClientRoom } from "../../convex/rooms.ts"
import { useLocalStorageState } from "../hooks/storage.ts"
import { useFileUpload } from "../hooks/useFileUpload.ts"
import { useMediaQuery } from "../hooks/useMediaQuery.ts"
import { panel } from "../styles/panel.ts"
import { AppLogoLink } from "./AppLogoLink.tsx"
import { AssetsPanel } from "./AssetsPanel.tsx"
import { CharacterManager } from "./CharacterManager.tsx"
import { Chat } from "./Chat.tsx"
import { ChatInputContext, ChatInputHandle } from "./ChatInputContext.tsx"
import { DocumentTitle } from "./DocumentTitle.tsx"
import { EditableText } from "./EditableText.tsx"
import { SceneViewer } from "./SceneViewer.tsx"
import { Button } from "./ui/Button.tsx"
import { Field } from "./ui/Field.tsx"
import { Icon } from "./ui/Icon.tsx"
import { UserButton } from "./UserButton.tsx"

export function Room({ slug }: { slug: string }) {
	const room = useQuery(api.rooms.getBySlug, { slug })
	const user = useQuery(api.auth.me)
	const updateRoom = useMutation(api.rooms.update)
	const chatInputRef = useRef<ChatInputHandle | null>(null)

	const [backgroundBrightness, setBackgroundBrightness] =
		useLocalStorageState<number>("backgroundBrightness", 25, (input) => {
			const value = Number(input)
			return isNaN(value) ? 25 : Math.max(0, Math.min(100, value))
		})

	// Track viewport size to determine if we should show chat as tab or panel
	const isLargeViewport = useMediaQuery("(min-width: 1280px)")

	if (room === undefined || user === undefined) {
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

	if (user === null) {
		return (
			<div className="flex h-screen items-center justify-center">
				Please sign in to access this room
			</div>
		)
	}

	if (!room.isMember) {
		return <RoomInvitation room={room} />
	}

	const baseSidebarTabs = [
		{
			name: "Characters",
			icon: <Icon icon="mingcute:group-2-fill" className="size-5" />,
			content: (
				<ChatInputContext value={chatInputRef}>
					<CharacterManager roomId={room._id} />
				</ChatInputContext>
			),
		},
		{
			name: "Assets",
			icon: <Icon icon="mingcute:pic-fill" className="size-5" />,
			content: <AssetsPanel roomId={room._id} />,
		},
		{
			name: "Settings",
			icon: <Icon icon="mingcute:settings-2-fill" className="size-5" />,
			content: (
				<RoomSettings
					onUpdateRoom={(name) => updateRoom({ roomId: room._id, name })}
					room={room}
					backgroundBrightness={backgroundBrightness}
					onBackgroundBrightnessChange={setBackgroundBrightness}
				/>
			),
		},
	]

	const sidebarTabs =
		isLargeViewport ? baseSidebarTabs : (
			[
				...baseSidebarTabs,
				{
					name: "Chat",
					icon: <Icon icon="mingcute:message-2-fill" className="size-5" />,
					content: (
						<Chat
							room={room}
							playerName={user.name || "Anonymous"}
							chatInputRef={chatInputRef}
						/>
					),
				},
			]
		)

	return (
		<DocumentTitle title={`${room.name} | Aspects VTT`}>
			<SceneViewer room={room} backgroundBrightness={backgroundBrightness} />

			<SidebarProvider>
				<div className="pointer-events-children fixed inset-0 flex flex-col gap-2 p-2">
					<header className="pointer-events-children flex items-center gap-4">
						<SidebarTabs tabs={sidebarTabs} />
						<AppLogoLink />
						<div className="ml-auto px-3">
							<UserButton />
						</div>
					</header>

					<main className="pointer-events-children flex min-h-0 flex-1 items-end gap-2">
						<div className="pointer-events-children absolute right-0 bottom-0 px-2 min-[1280px]:right-72 min-[1280px]:mr-2">
							<SceneViewerHelpButton />
						</div>

						<div className="h-full *:size-full max-[480px]:flex-1">
							<SidebarPanels tabs={sidebarTabs} />
						</div>

						{isLargeViewport && (
							<Chat
								room={room}
								playerName={user.name || "Anonymous"}
								chatInputRef={chatInputRef}
								className="ml-auto w-72"
							/>
						)}
					</main>
				</div>
			</SidebarProvider>
		</DocumentTitle>
	)
}

interface TabConfig {
	name: string
	icon: ReactNode
	content: ReactNode
}

function SidebarProvider({ children }: { children: ReactNode }) {
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
			{children}
		</Ariakit.TabProvider>
	)
}

function SidebarTabs({ tabs }: { tabs: TabConfig[] }) {
	return (
		<Ariakit.TabList className={panel("flex gap-1 p-1")}>
			{tabs.map((tab) => (
				<SidebarTab key={tab.name} name={tab.name} icon={tab.icon} />
			))}
		</Ariakit.TabList>
	)
}

function SidebarPanels({
	tabs,
	className,
}: {
	tabs: TabConfig[]
	className?: string
}) {
	return tabs.map((tab) => (
		<Ariakit.TabPanel
			key={tab.name}
			id={tab.name}
			className={className}
			unmountOnHide
		>
			{tab.content}
		</Ariakit.TabPanel>
	))
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

interface RoomSettingsProps {
	room: Doc<"rooms">
	onUpdateRoom: (name: string) => void
	backgroundBrightness: number
	onBackgroundBrightnessChange: (value: number) => void
}

function RoomSettings({
	room,
	onUpdateRoom,
	backgroundBrightness,
	onBackgroundBrightnessChange,
}: RoomSettingsProps) {
	const leaveRoom = useMutation(api.rooms.leave)
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
			<section className={panel("flex flex-col gap-4 p-4")}>
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

				<Field label="Background Brightness" htmlFor="backgroundBrightness">
					<div className="flex items-center gap-3">
						<input
							id="backgroundBrightness"
							type="range"
							min="0"
							max="100"
							value={backgroundBrightness}
							onChange={(e) =>
								onBackgroundBrightnessChange(Number(e.target.value))
							}
							className="flex-1 accent-primary-500"
						/>
						<span className="w-10 text-right text-sm text-gray-400">
							{backgroundBrightness}%
						</span>
					</div>
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
	const join = useMutation(api.rooms.join)

	const [, joinAction, isPending] = useActionState(async () => {
		await join({ roomId: room._id })
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
	const uploadFile = useFileUpload()

	const [uploadError, handleFileChange, isUploading] = useActionState(
		async (
			_state: string | void,
			event: React.ChangeEvent<HTMLInputElement>,
		) => {
			const file = event.target.files?.[0]
			if (!file) return

			try {
				const storageId = await uploadFile(file)
				await updateRoom({ roomId, backgroundId: storageId })
			} catch (error) {
				return error instanceof Error ? error.message : String(error)
			}
		},
	)

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
			<p className="text-red-300 empty:hidden">{uploadError}</p>
		</>
	)
}
