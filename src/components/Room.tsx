import * as Ariakit from "@ariakit/react"
import { useMutation, useQuery } from "convex/react"
import type { ReactNode } from "react"
import { useRef, useState } from "react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { useLocalStorageState } from "../hooks/storage.ts"
import { panel } from "../styles/panel.ts"
import { AssetsPanel } from "./AssetsPanel.tsx"
import { CharacterManager } from "./CharacterManager.tsx"
import { Chat, ChatInputRef } from "./Chat.tsx"
import { DocumentTitle } from "./DocumentTitle.tsx"
import { EditableText } from "./EditableText.tsx"
import { SceneViewer } from "./SceneViewer.tsx"
import { Button } from "./ui/Button.tsx"
import { Dialog, DialogPanel } from "./ui/Dialog.tsx"
import { Icon } from "./ui/Icon.tsx"
import { Input } from "./ui/Input.tsx"

export function Room({ roomId }: { roomId: Id<"rooms"> }) {
	const room = useQuery(api.rooms.get, { roomId })
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

	return (
		<DocumentTitle title={`${room.name} | Aspects VTT`}>
			<SceneViewer roomId={roomId} />
			<div className="fixed top-0 left-0 grid max-h-dvh grid-rows-[100%] p-2 opacity-90 transition-opacity hover:opacity-100">
				<Sidebar
					tabs={[
						{
							name: "Characters",
							icon: <Icon icon="mingcute:group-2-fill" className="size-5" />,
							content: <CharacterManager chatInputRef={chatInputRef} />,
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
									roomName={room?.name || ""}
									playerName={playerName}
									onUpdateRoom={(name) => updateRoom({ roomId, name })}
									onUpdatePlayerName={setPlayerName}
								/>
							),
						},
					]}
				/>
			</div>
			<div className="fixed right-0 bottom-0 grid max-h-dvh grid-rows-[100%] p-2 opacity-90 transition-opacity hover:opacity-100">
				<Chat
					roomId={roomId}
					playerName={playerName}
					chatInputRef={chatInputRef}
				/>
			</div>
		</DocumentTitle>
	)
}

interface RoomSettingsProps {
	roomName: string
	playerName: string
	onUpdateRoom: (name: string) => void
	onUpdatePlayerName: (name: string) => void
}

function RoomSettings({
	roomName,
	playerName,
	onUpdateRoom,
	onUpdatePlayerName,
}: RoomSettingsProps) {
	return (
		<div className={panel("flex w-64 flex-col gap-4 p-4")}>
			<h2 className="text-xl font-light">Settings</h2>

			<div className="flex flex-col gap-4">
				<EditableText
					label="Room Name"
					value={roomName}
					onChange={(value) => {
						if (value.trim() && value !== roomName) {
							onUpdateRoom(value.trim())
						}
					}}
					placeholder="Enter room name"
				/>
			</div>

			<div className="flex flex-col gap-4">
				<EditableText
					label="Your Name"
					value={playerName}
					onChange={(value) => {
						if (value.trim() && value !== playerName) {
							onUpdatePlayerName(value.trim())
						}
					}}
					placeholder="Enter your name"
				/>
			</div>
		</div>
	)
}

function PlayerNameDialog({ onSubmit }: { onSubmit: (name: string) => void }) {
	const [nameInput, setNameInput] = useState("")

	return (
		<Dialog open>
			<DialogPanel title="Enter Your Name">
				<form
					action={() => {
						const name = nameInput.trim()
						if (name) {
							onSubmit(name)
						}
					}}
					className="flex flex-col gap-4"
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
				className="aria-selected:text-primary-300 flex size-8 items-center justify-center rounded transition-colors hover:bg-white/5 aria-selected:bg-white/5"
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
