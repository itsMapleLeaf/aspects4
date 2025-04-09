import * as Ariakit from "@ariakit/react"
import { useQuery } from "convex/react"
import type { ReactNode } from "react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { useLocalStorage } from "../hooks/useLocalStorage.ts"
import { panel } from "../styles/panel.ts"
import { CharacterManager } from "./CharacterManager.tsx"
import { Chat } from "./Chat.tsx"
import { SceneViewer } from "./SceneViewer.tsx"
import { Button } from "./ui/Button.tsx"
import { Dialog, DialogPanel } from "./ui/Dialog.tsx"
import { Icon } from "./ui/Icon.tsx"
import { Input } from "./ui/Input.tsx"

export function Room({ roomId }: { roomId: Id<"rooms"> }) {
	const room = useQuery(api.rooms.get, { roomId })

	const [playerName, setPlayerName] = useLocalStorage<string | null>(
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

	return (
		<>
			<SceneViewer />
			<div className="fixed top-0 left-0 grid max-h-dvh grid-rows-[100%] p-2 opacity-90 transition-opacity hover:opacity-100">
				<Sidebar />
			</div>
			<div className="fixed right-0 bottom-0 grid max-h-dvh grid-rows-[100%] p-2 opacity-90 transition-opacity hover:opacity-100">
				<Chat roomId={roomId} playerName={playerName} />
			</div>
		</>
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

function Sidebar() {
	const [selectedTabId, setSelectedTabId] = useLocalStorage<
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
					<SidebarTab
						name="Characters"
						icon={<Icon icon="mingcute:group-2-fill" className="size-5" />}
					/>
					<SidebarTab
						name="Assets"
						icon={<Icon icon="mingcute:pic-fill" className="size-5" />}
					/>
				</Ariakit.TabList>

				<Ariakit.TabPanel id="Characters" className="min-h-0 flex-1">
					<CharacterManager />
				</Ariakit.TabPanel>
				<Ariakit.TabPanel id="Assets" className="min-h-0 flex-1">
					assets
				</Ariakit.TabPanel>
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
