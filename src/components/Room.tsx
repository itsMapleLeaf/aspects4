import * as Ariakit from "@ariakit/react"
import type { ReactNode } from "react"
import { useLocalStorage } from "../hooks/useLocalStorage.ts"
import { panel } from "../styles/panel.ts"
import { CharacterManager } from "./CharacterManager.tsx"
import { Chat } from "./Chat.tsx"
import { SceneViewer } from "./SceneViewer.tsx"
import { Icon } from "./ui/Icon.tsx"

export function Room() {
	return (
		<>
			<SceneViewer />
			<div className="fixed top-0 left-0 grid max-h-dvh grid-rows-[100%] p-2 opacity-90 transition-opacity hover:opacity-100">
				<Sidebar />
			</div>
			<div className="fixed right-0 bottom-0 grid max-h-dvh grid-rows-[100%] p-2 opacity-90 transition-opacity hover:opacity-100">
				<Chat />
			</div>
		</>
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
