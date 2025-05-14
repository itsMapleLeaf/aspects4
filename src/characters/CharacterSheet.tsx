import { EditableNumber } from "~/components/EditableNumber.tsx"
import { EditableTextField } from "~/components/EditableTextField.tsx"
import { Field } from "~/components/ui/Field.tsx"
import { SelectField } from "~/components/ui/SelectField.tsx"
import { safeParseNumber } from "~/lib/utils.ts"
import type {
	CharacterSheetBlock,
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
	block: CharacterSheetBlock
	character: Character
	onSaveValue: (key: string, value: string | number) => void
}) {
	return (
		block.type === "row" ?
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
		: block.type === "column" ?
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
		: block.type === "text" ?
			<EditableTextField
				label={block.displayName || getDefaultFieldLabel(block.id)}
				multiline={block.multiline}
				placeholder={block.hint}
				value={String(character.values[block.id] || "")}
				onChange={(value) => onSaveValue(block.id, value)}
			/>
		: block.type === "number" ?
			<Field label={block.displayName || getDefaultFieldLabel(block.id)}>
				<EditableNumber
					min={block.min}
					max={block.max}
					value={safeParseNumber(character.values[block.id]) ?? 0}
					onChange={(value) => onSaveValue(block.id, value)}
				/>
			</Field>
		: block.type === "select" ?
			<SelectField
				label={block.displayName || getDefaultFieldLabel(block.id)}
				description={block.hint}
				placeholder={block.hint ?? "Choose one"}
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
		:	<p>(field type "{block.type}" not supported)</p>
	)
}

function getDefaultFieldLabel(fieldId: string) {
	return [...fieldId.matchAll(/[A-Z]?[a-z]+/g)]
		.map(
			([word]) => word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase(),
		)
		.join(" ")
}
