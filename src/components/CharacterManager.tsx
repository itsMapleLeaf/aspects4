import * as Ariakit from "@ariakit/react"
import { useMutation, useQuery } from "convex/react"
import { CharacterEditor } from "~/characters/CharacterEditor.tsx"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { useLocalStorageState } from "../hooks/storage.ts"
import { panel } from "../styles/panel.ts"
import { Icon } from "./ui/Icon.tsx"
import { SmallIconButton } from "./ui/SmallIconButton.tsx"
import { Tooltip } from "./ui/Tooltip.tsx"

export function CharacterManager({ roomId }: { roomId: Id<"rooms"> }) {
	const characters = useQuery(api.characters.listByRoom, { roomId })
	const createCharacter = useMutation(api.characters.create)
	const updateCharacter = useMutation(api.characters.update)
	const removeCharacter = useMutation(api.characters.remove)

	const [activeCharacterId, setActiveCharacterId] = useLocalStorageState<
		string | undefined | null
	>("CharacterManager:activeCharacterId", null, (input) =>
		input == null ? null : String(input),
	)

	async function addNewCharacter() {
		const character = await createCharacter({ roomId })
		setActiveCharacterId(character._id)
	}

	return (
		<Ariakit.TabProvider selectedId={activeCharacterId} orientation="vertical">
			<Ariakit.HeadingLevel level={2}>
				<section className="flex h-full w-full gap-2">
					<Ariakit.TabList
						className={panel("flex w-48 flex-col gap-2 px-3 pt-2 pb-1")}
					>
						<header className="flex items-center justify-between">
							<h2 className="heading-xl leading-none">Characters</h2>
							<SmallIconButton
								className="-mr-2"
								icon="mingcute:user-add-2-fill"
								label="New Character"
								onClick={addNewCharacter}
							/>
						</header>

						<ul className="flex flex-col gap-1">
							{characters?.map((character, index) => (
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

									{character.isOwner && (
										<button
											type="button"
											className="flex aspect-square h-full items-center justify-center rounded transition-colors hover:bg-white/5"
											onClick={() => {
												removeCharacter({ characterId: character._id })

												if (character._id === activeCharacterId) {
													const nextIndex = Math.min(
														index + 1,
														characters.length - 2, // -1 for the removed character
													)
													const nextKey = characters[nextIndex]?._id ?? null
													setActiveCharacterId(nextKey)
												}
											}}
										>
											<Icon icon="mingcute:close-fill" />
											<span className="sr-only">Delete Character</span>
										</button>
									)}
								</li>
							))}
						</ul>
					</Ariakit.TabList>

					{characters?.map((character) => (
						<Ariakit.TabPanel
							id={character._id}
							key={character._id}
							className={panel(
								"h-full w-148 flex-1 overflow-y-auto p-3 will-change-scroll [scrollbar-gutter:stable]",
							)}
							unmountOnHide
						>
							<CharacterEditor
								character={character}
								onUpdate={(data) => {
									updateCharacter({
										characterId: character._id,
										data,
									})
								}}
							/>
						</Ariakit.TabPanel>
					))}
				</section>
			</Ariakit.HeadingLevel>
		</Ariakit.TabProvider>
	)
}
