import * as Ariakit from "@ariakit/react"
import { EditableNumber } from "~/components/EditableNumber.tsx"
import { EditableTextField } from "~/components/EditableTextField.tsx"
import { Field } from "~/components/ui/Field.tsx"
import { SelectField } from "~/components/ui/SelectField.tsx"
import { useLocalStorageState } from "~/hooks/storage.ts"
import { safeParseNumber } from "~/lib/utils.ts"
import type {
	CharacterSheetBlockSchema,
	CharacterSheetLayout,
} from "./character.schema.ts"

type Character = { name: string; values: Record<string, unknown> }

export function CharacterSheet({
	character,
	schema,
	onChangeName,
	onSaveValue,
}: {
	character: Character
	schema: CharacterSheetLayout
	onChangeName: (name: string) => void
	onSaveValue: (key: string, value: string | number) => void
}) {
	return (
		<div className="grid gap-3">
			<EditableTextField
				label="Name"
				value={character.name}
				onChange={onChangeName}
			/>
			{schema.blocks.map((block) => (
				<CharacterSheetBlockElement
					key={block.id}
					block={block}
					character={character}
					onSaveValue={onSaveValue}
				/>
			))}
		</div>
	)
}

function CharacterSheetBlockElement({
	block,
	character,
	onSaveValue,
}: {
	block: CharacterSheetBlockSchema
	character: Character
	onSaveValue: (key: string, value: string | number) => void
}) {
	if (block.type === "row") {
		return (
			<div className="grid auto-cols-fr grid-flow-col gap-3">
				{block.children.map((child) => (
					<CharacterSheetBlockElement
						key={child.id}
						block={child}
						character={character}
						onSaveValue={onSaveValue}
					/>
				))}
			</div>
		)
	}

	if (block.type === "column") {
		return (
			<div className="grid gap-3">
				{block.children.map((child) => (
					<CharacterSheetBlockElement
						key={child.id}
						block={child}
						character={character}
						onSaveValue={onSaveValue}
					/>
				))}
			</div>
		)
	}

	if (block.type === "text") {
		return (
			<EditableTextField
				label={block.displayName || getDefaultBlockName(block.id)}
				multiline={block.multiline}
				placeholder={block.hint}
				value={String(character.values[block.id] || "")}
				onChange={(value) => onSaveValue(block.id, value)}
			/>
		)
	}

	if (block.type === "number") {
		const label = block.displayName || getDefaultBlockName(block.id)
		return block.labelPlacement === "left" ?
				<div className="flex items-center">
					<div className="flex-1 font-semibold">{label}</div>
					<EditableNumber
						className="w-16"
						min={block.min}
						max={block.max}
						value={safeParseNumber(character.values[block.id]) ?? 0}
						onChange={(value) => onSaveValue(block.id, value)}
					/>
				</div>
			:	<Field label={block.displayName || getDefaultBlockName(block.id)}>
					<EditableNumber
						min={block.min}
						max={block.max}
						value={safeParseNumber(character.values[block.id]) ?? 0}
						onChange={(value) => onSaveValue(block.id, value)}
					/>
				</Field>
	}

	if (block.type === "select") {
		return (
			<SelectField
				label={block.displayName || getDefaultBlockName(block.id)}
				description={block.hint}
				placeholder="Choose one"
				value={String(character.values[block.id] || "")}
				onChangeValue={(value) => {
					onSaveValue(block.id, value)
				}}
				options={block.choices.map((choice) => ({
					value: choice.id,
					label: choice.displayName || choice.id,
					description: choice.hint,
				}))}
			/>
		)
	}

	if (block.type === "tabs") {
		return (
			<CharacterSheetTabProvider
				blockId={block.id}
				defaultTabId={block.tabs[0].id}
			>
				<Ariakit.TabList className="grid auto-cols-fr grid-flow-col gap-1 rounded-md bg-gray-950/25 p-1">
					{block.tabs.map((tab) => (
						<Ariakit.Tab
							key={tab.id}
							id={tab.id}
							className="rounded px-3 py-1.5 text-gray-400 transition hover:text-gray-100 aria-selected:bg-white/10 aria-selected:text-white"
						>
							{tab.name || getDefaultBlockName(tab.id)}
						</Ariakit.Tab>
					))}
				</Ariakit.TabList>

				{block.tabs.map((tab) => (
					<Ariakit.TabPanel key={tab.id} id={tab.id}>
						<div className="grid gap-3">
							{tab.children.map((child) => (
								<CharacterSheetBlockElement
									key={child.id}
									block={child}
									character={character}
									onSaveValue={onSaveValue}
								/>
							))}
						</div>
					</Ariakit.TabPanel>
				))}
			</CharacterSheetTabProvider>
		)
	}

	return <p>(field type "{block.type}" not supported)</p>
}

function CharacterSheetTabProvider({
	blockId,
	defaultTabId,
	children,
}: {
	blockId: string
	defaultTabId: string | undefined | null
	children: React.ReactNode
}) {
	const [selectedId, setSelectedId] = useLocalStorageState(
		`CharacterSheetTabProvider:selectedId:${blockId}`,
		defaultTabId,
		(input) => (typeof input === "string" ? input : undefined),
	)
	return (
		<Ariakit.TabProvider
			selectedId={selectedId ?? defaultTabId}
			setSelectedId={setSelectedId}
		>
			{children}
		</Ariakit.TabProvider>
	)
}

function getDefaultBlockName(fieldId: string) {
	return [...fieldId.matchAll(/[A-Z]?[a-z]+/g)]
		.map(
			([word]) => word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase(),
		)
		.join(" ")
}
