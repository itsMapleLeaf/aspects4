import * as Ariakit from "@ariakit/react"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { CharacterEditor } from "../characters/CharacterEditor.tsx"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { useLocalStorageState } from "../hooks/storage.ts"
import { useMediaQuery } from "../hooks/useMediaQuery.ts"
import { Icon } from "./ui/Icon.tsx"
import { SmallIconButton } from "./ui/SmallIconButton.tsx"
import { Tooltip } from "./ui/Tooltip.tsx"

export function CharacterManager({ roomId }: { roomId: Id<"rooms"> }) {
	const characters = useQuery(api.characters.listByRoom, { roomId })
	const createCharacter = useMutation(api.characters.create)
	const isMediumViewport = useMediaQuery("(width < 720px)")
	const [tabsPopoverOpen, setTabsPopoverOpen] = useState(false)

	const [activeCharacterIdState, setActiveCharacterId] = useLocalStorageState<
		string | undefined | null
	>("CharacterManager:activeCharacterId", null, (input) =>
		input == null ? null : String(input),
	)

	// on mobile view, always show an active character
	let activeCharacterId = activeCharacterIdState
	if (isMediumViewport) {
		activeCharacterId ??= characters?.[0]?._id
	}

	async function addNewCharacter() {
		const character = await createCharacter({ roomId })
		setActiveCharacterId(character._id)
	}

	const header = (
		<header className="flex items-center justify-between">
			<h2 className="heading-xl leading-none">Characters</h2>
			<SmallIconButton
				className="-mr-2"
				icon="mingcute:user-add-2-fill"
				label="New Character"
				onClick={addNewCharacter}
			/>
		</header>
	)

	return (
		<Ariakit.TabProvider selectedId={activeCharacterId} orientation="vertical">
			<Ariakit.HeadingLevel level={2}>
				<section className="pointer-events-children flex h-full gap-2">
					{isMediumViewport ? null : (
						<Ariakit.TabList className="flex w-48 flex-col gap-2 panel px-3 pt-2 pb-1">
							{header}
							<ul className="flex flex-col gap-1">
								{characters?.map((character) => (
									<li key={character._id} className="-mx-2 flex gap-1">
										<Ariakit.Tab
											type="button"
											id={character._id}
											className="flex h-9 min-w-0 flex-1 cursor-default items-center gap-1.5 rounded px-2 transition-colors hover:bg-white/5 aria-selected:bg-white/5 aria-selected:text-primary-300"
											onClick={() => {
												if (activeCharacterId === character._id) {
													setActiveCharacterId(null)
												} else {
													setActiveCharacterId(character._id)
												}
											}}
										>
											<span className="truncate">{character.name}</span>
											{character.isPublic && (
												<Tooltip content="This character is public.">
													<Icon icon="lucide:globe" className="opacity-50" />
												</Tooltip>
											)}
										</Ariakit.Tab>
									</li>
								))}
							</ul>
						</Ariakit.TabList>
					)}

					<div
						className="isolate h-full max-w-[640px] flex-1 overflow-y-auto panel p-3 will-change-scroll [scrollbar-gutter:stable]"
						hidden={!activeCharacterId}
					>
						{isMediumViewport && (
							<Ariakit.TabList className="sticky -top-3 z-10 -mx-3 -mt-3 flex items-center gap-2 bg-gray-900 p-3">
								<Ariakit.PopoverProvider
									open={tabsPopoverOpen}
									setOpen={setTabsPopoverOpen}
								>
									<SmallIconButton
										render={<Ariakit.PopoverDisclosure />}
										icon="mingcute:menu-fill"
										label="Characters"
									/>

									<Ariakit.Popover className="menu-panel">
										{characters?.map((character) => (
											<Ariakit.Tab
												id={character._id}
												key={character._id}
												className="menu-item aria-selected:bg-white/5 aria-selected:text-primary-300"
												onClick={() => {
													setActiveCharacterId(character._id)
													setTabsPopoverOpen(false)
												}}
											>
												<span className="truncate">{character.name}</span>
												{character.isPublic && (
													<Tooltip content="This character is public.">
														<Icon icon="lucide:globe" className="opacity-50" />
													</Tooltip>
												)}
											</Ariakit.Tab>
										))}
									</Ariakit.Popover>
								</Ariakit.PopoverProvider>

								<div className="min-w-0 flex-1">{header}</div>
							</Ariakit.TabList>
						)}

						{characters?.map((character) => (
							<Ariakit.TabPanel
								id={character._id}
								key={character._id}
								unmountOnHide
							>
								<CharacterEditor character={character} />
							</Ariakit.TabPanel>
						))}
					</div>
				</section>
			</Ariakit.HeadingLevel>
		</Ariakit.TabProvider>
	)
}
