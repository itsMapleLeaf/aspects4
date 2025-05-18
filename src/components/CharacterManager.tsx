import * as Ariakit from "@ariakit/react"
import { useMutation, useQuery } from "convex/react"
import { RefObject, type ComponentProps } from "react"
import { twMerge } from "tailwind-merge"
import { CharacterEditor } from "~/characters/CharacterEditor.tsx"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { useLocalStorageState } from "../hooks/storage.ts"
import { panel } from "../styles/panel.ts"
import { ChatInputRef } from "./Chat.tsx"
import { Icon } from "./ui/Icon.tsx"
import { SmallIconButton } from "./ui/SmallIconButton.tsx"

export function CharacterManager({
	chatInputRef,
	roomId,
}: {
	chatInputRef: RefObject<ChatInputRef | null>
	roomId: Id<"rooms">
}) {
	const ownedCharacters = useQuery(api.characters.listOwned)
	const ownedCharacterIds = new Set(ownedCharacters?.map((it) => it._id))

	const roomCharacters = useQuery(api.characters.listByRoom, { roomId })
	const roomCharacterIds = new Set(roomCharacters?.map((it) => it._id))

	const roomCharactersWithoutOwned = roomCharacters?.filter(
		(it) => !ownedCharacterIds.has(it._id),
	)

	const createCharacter = useMutation(api.characters.create)
	const updateCharacter = useMutation(api.characters.update)
	const removeCharacter = useMutation(api.characters.remove)
	const addToRoom = useMutation(api.characters.addToRoom)
	const removeFromRoom = useMutation(api.characters.removeFromRoom)

	const [activeCharacterId, setActiveCharacterId] = useLocalStorageState<
		string | undefined | null
	>("CharacterManager:activeCharacterId", null, (input) =>
		input == null ? null : String(input),
	)

	async function addNewCharacter() {
		const character = await createCharacter({})
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
							{ownedCharacters?.map((character, index) => (
								<li key={character._id} className="-mx-2 flex gap-1">
									<SidebarTab
										id={character._id}
										onClick={() => {
											if (activeCharacterId === character._id) {
												setActiveCharacterId(null)
											} else {
												setActiveCharacterId(character._id)
											}
										}}
									>
										<span className="truncate">{character.name}</span>
									</SidebarTab>

									<button
										type="button"
										className="flex aspect-square h-full items-center justify-center rounded transition-colors hover:bg-white/5"
										onClick={() => {
											removeCharacter({ characterId: character._id })

											if (character._id === activeCharacterId) {
												const nextIndex = Math.min(
													index + 1,
													ownedCharacters.length - 2, // -1 for the removed character
												)
												const nextKey = ownedCharacters[nextIndex]?._id ?? null
												setActiveCharacterId(nextKey)
											}
										}}
									>
										<Icon icon="mingcute:close-fill" />
										<span className="sr-only">Delete Character</span>
									</button>
								</li>
							))}

							{roomCharactersWithoutOwned?.map((character) => (
								<li key={character._id} className="-mx-2 flex gap-1">
									<SidebarTab
										id={character._id}
										onClick={() => {
											if (activeCharacterId === character._id) {
												setActiveCharacterId(null)
											} else {
												setActiveCharacterId(character._id)
											}
										}}
									>
										<span className="truncate">{character.name}</span>
									</SidebarTab>
								</li>
							))}
						</ul>
					</Ariakit.TabList>

					{ownedCharacters?.map((character) => (
						<Ariakit.TabPanel
							id={character._id}
							key={character._id}
							className={panel("h-full w-148 flex-1 overflow-y-auto p-3")}
							unmountOnHide
						>
							<CharacterEditor
								character={{ name: character.name, values: character.data }}
								onNameChanged={(name) => {
									updateCharacter({
										characterId: character._id,
										data: { name },
									})
								}}
								onValueChanged={(key, value) => {
									updateCharacter({
										characterId: character._id,
										data: { data: { ...character.data, [key]: value } },
									})
								}}
								// chatInputRef={chatInputRef}
								// onChange={(patch) => {
								// 	updateCharacter({
								// 		characterId: character._id,
								// 		data: patch,
								// 	})
								// }}
								// sharing={{
								// 	isShared: roomCharacterIds.has(character._id),
								// 	onChange: async (shouldShare) => {
								// 		if (shouldShare) {
								// 			await addToRoom({
								// 				characterId: character._id,
								// 				roomId,
								// 			})
								// 		} else {
								// 			await removeFromRoom({
								// 				characterId: character._id,
								// 				roomId,
								// 			})
								// 		}
								// 	},
								// }}
							/>
						</Ariakit.TabPanel>
					))}

					{roomCharactersWithoutOwned?.map((character) => (
						<Ariakit.TabPanel
							id={character._id}
							key={character._id}
							className={panel("h-full w-148 flex-1 p-0")}
						>
							<CharacterEditor
								character={{ name: character.name, values: character.data }}
								// chatInputRef={chatInputRef}
								onNameChanged={() => {}}
								onValueChanged={() => {}}
							/>
						</Ariakit.TabPanel>
					))}
				</section>
			</Ariakit.HeadingLevel>
		</Ariakit.TabProvider>
	)
}

function SidebarTab({
	children,
	...props
}: ComponentProps<typeof Ariakit.Tab>) {
	return (
		<Ariakit.Tab
			type="button"
			{...props}
			className={twMerge(
				"flex h-9 min-w-0 flex-1 cursor-default items-center rounded px-2 transition-colors hover:bg-white/5 aria-selected:bg-white/5 aria-selected:text-primary-300",
				props.className,
			)}
		>
			<span className="truncate">{children}</span>
		</Ariakit.Tab>
	)
}
