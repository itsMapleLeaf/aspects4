import * as Ariakit from "@ariakit/react"
import { ArkErrors } from "arktype"
import { useMutation, useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"
import type { ReactNode } from "react"
import { useActionState } from "react"
import { useLocation } from "wouter"
import { SceneViewerHelpButton } from "../components/SceneViewer.tsx"
import { api } from "../../convex/_generated/api"
import type { ClientRoom } from "../../convex/rooms.ts"
import { Chat } from "../chat/Chat.tsx"
import { ChatProvider } from "../chat/context.tsx"
import { AppLogoLink } from "../components/AppLogoLink.tsx"
import { AssetsPanel } from "../components/AssetsPanel.tsx"
import { CharacterManager } from "../components/CharacterManager.tsx"
import { DocumentTitle } from "../components/DocumentTitle.tsx"
import { EditableText } from "../components/EditableText.tsx"
import { SceneViewer } from "../components/SceneViewer.tsx"
import { Button } from "../components/ui/Button.tsx"
import { Field } from "../components/ui/Field.tsx"
import { Icon } from "../components/ui/Icon.tsx"
import { UserButton } from "../components/UserButton.tsx"
import { useLocalStorageState } from "../hooks/storage.ts"
import { useMediaQuery } from "../hooks/useMediaQuery.ts"
import { defaultViewportTransform, ViewportTransform } from "../lib/viewport.ts"
import { panel } from "../styles/panel.ts"
import {
	resolveRoomTabName,
	RoomProvider,
	RoomTabNames,
	useRoomContext,
} from "./context.tsx"

export function Room({ slug }: { slug: string }) {
	const room = useQuery(api.rooms.getBySlug, { slug })
	const user = useQuery(api.auth.me)

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

	return (
		<ChatProvider roomId={room._id}>
			<RoomProvider>
				<RoomInternal room={room} user={user} />
			</RoomProvider>
		</ChatProvider>
	)
}

function RoomInternal({
	room,
	user,
}: {
	room: NonNullable<FunctionReturnType<typeof api.rooms.getBySlug>>
	user: NonNullable<FunctionReturnType<typeof api.auth.me>>
}) {
	const roomContext = useRoomContext()
	const updateRoom = useMutation(api.rooms.update)

	const [backgroundBrightness, setBackgroundBrightness] =
		useLocalStorageState<number>("backgroundBrightness", 50, (input) => {
			const value = Number(input)
			return isNaN(value) ? 50 : Math.max(0, Math.min(100, value))
		})

	const fullWidthAssetPanel = useMediaQuery("(width < 540px)")
	const standaloneChat = useMediaQuery("(width > 1176px)")

	const [viewportTransform, setViewportTransform] =
		useLocalStorageState<ViewportTransform>(
			"viewportTransform",
			defaultViewportTransform,
			(input) => {
				const result = ViewportTransform(input)
				if (result instanceof ArkErrors) {
					console.warn(result)
					return defaultViewportTransform
				}
				return result
			},
		)

	const sidebarTabs = [
		{
			name: RoomTabNames.Characters,
			icon: <Icon icon="mingcute:group-2-fill" className="size-5" />,
			content: <CharacterManager roomId={room._id} />,
		},

		{
			name: RoomTabNames.Assets,
			icon: <Icon icon="mingcute:file-fill" className="size-5" />,
			content: (
				<AssetsPanel
					room={room}
					viewportTransform={viewportTransform}
					onAssetAdded={() => {
						if (fullWidthAssetPanel) {
							roomContext.setSelectedTabId(null)
						}
					}}
					className={fullWidthAssetPanel ? "" : "w-[20rem]"}
				/>
			),
		},

		// ...(room.isOwner ?
		// 	[
		// 		{
		// 			name: RoomTabNames.Scenes,
		// 			icon: <Icon icon="mingcute:pic-fill" className="size-5" />,
		// 			content: (
		// 				<ScenesPanel
		// 					room={room}
		// 					className={fullWidthAssetPanel ? "" : "w-[20rem]"}
		// 				/>
		// 			),
		// 		},
		// 	]
		// :	[]),

		...(standaloneChat ?
			[]
		:	[
				{
					name: RoomTabNames.Chat,
					icon: <Icon icon="mingcute:message-2-fill" className="size-5" />,
					content: (
						<div className="pointer-events-children flex h-full flex-col justify-end">
							<Chat
								room={room}
								playerName={user.name || "Anonymous"}
								className="flex-1"
							/>
						</div>
					),
				},
			]),

		{
			name: RoomTabNames.Settings,
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

	return (
		<DocumentTitle title={`${room.name} | Aspects VTT`}>
			<SceneViewer
				room={room}
				backgroundBrightness={backgroundBrightness}
				viewportTransform={viewportTransform}
				updateViewportTransform={setViewportTransform}
			/>

			<Ariakit.TabProvider
				selectedId={roomContext.selectedTabId}
				setSelectedId={(id) =>
					roomContext.setSelectedTabId(id ? resolveRoomTabName(id) : null)
				}
			>
				<header className="pointer-events-children fixed inset-x-0 top-0 flex h-14 items-center gap-4 px-2">
					<SidebarTabs tabs={sidebarTabs} />
					<AppLogoLink />
					<div className="ml-auto px-3">
						<UserButton />
					</div>
				</header>

				<main className="pointer-events-children">
					{standaloneChat ? null : (
						<div className="pointer-events-children fixed right-0 bottom-0 p-3">
							<SceneViewerHelpButton />
						</div>
					)}

					{sidebarTabs.map((tab) => (
						<Ariakit.TabPanel
							key={tab.name}
							id={tab.name}
							className="pointer-events-children fixed top-12 bottom-0 left-0 p-2 max-[540px]:right-0"
							unmountOnHide
						>
							{tab.content}
						</Ariakit.TabPanel>
					))}

					{standaloneChat && (
						<div className="pointer-events-children fixed top-10 right-0 bottom-0 flex items-end gap-2 p-3">
							<SceneViewerHelpButton />
							<Chat
								room={room}
								playerName={user.name || "Anonymous"}
								className="w-72"
							/>
						</div>
					)}
				</main>
			</Ariakit.TabProvider>
		</DocumentTitle>
	)
}

interface TabConfig {
	name: string
	icon: ReactNode
	content: ReactNode
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
	room: ClientRoom
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
			<section className={panel("flex max-w-[360px] flex-col gap-4 p-4")}>
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
