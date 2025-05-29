import * as Ariakit from "@ariakit/react"
import { use, type ReactNode } from "react"
import { CharacterSheetContext } from "~/characters/context.ts"
import { useLocalStorageState } from "~/hooks/storage.ts"
import { toTitleCase } from "~/lib/utils.ts"
import { EditableTextField } from "../components/EditableTextField.tsx"
import { SelectField } from "../components/ui/SelectField.tsx"
import EXPENSE_TIERS from "../data/list-of-expense-tiers.json"
import { AspectSkillsList } from "./AspectSkillsList.tsx"
import type { Character } from "./character.ts"
import { CharacterContext } from "./context.ts"
import { CoreSkillsList } from "./CoreSkillsList.tsx"
import {
	ASPECT_AURAS,
	ASPECT_NAMES,
	ATTRIBUTE_NAMES,
	ITEM_TYPES,
} from "./data.ts"
import { LineageFieldGroup } from "./LineageFieldGroup.tsx"
import {
	SheetNumberField,
	SheetSelectField,
	SheetTextField,
} from "./sheet/components.tsx"
import {
	createFieldContext,
	resolveListField,
	resolveNumberField,
	resolveSelectField,
	resolveTextField,
} from "./sheet/fields.ts"
import { SheetListField } from "./sheet/SheetListField.tsx"
import { SheetListFieldMinimal } from "./sheet/SheetListFieldMinimal.tsx"
import { SheetStatField } from "./sheet/SheetStatField.tsx"
import { resolveCharacterScores } from "./utils.ts"

export function CharacterEditor({
	character,
	onUpdate,
}: {
	character: Character
	onUpdate: (patch: Partial<Character>) => void
}) {
	const sheet = createFieldContext(character.data, (name, value) => {
		onUpdate({
			data: { [name]: value },
		})
	})

	return (
		<CharacterContext value={{ character, updateCharacter: onUpdate }}>
			<CharacterSheetContext value={sheet}>
				<CharacterEditorInner />
			</CharacterSheetContext>
		</CharacterContext>
	)
}

function CharacterEditorInner() {
	const sheet = use(CharacterSheetContext)

	const scores = resolveCharacterScores(sheet)

	const damageLimit = scores.scoreOf("Strength") + scores.scoreOf("Dexterity")

	const fatigueLimit =
		scores.scoreOf("Sense") +
		scores.scoreOf("Intellect") +
		scores.scoreOf("Presence")

	const characterTab = {
		name: "Conditions",
		content: (
			<div className="grid gap-3">
				<SheetListFieldMinimal
					context={sheet}
					id="conditions"
					description={`Damage limit: ${damageLimit}\nFatigue limit: ${fatigueLimit}`}
				>
					{(itemContext, index) => (
						<div className="flex gap-2" key={index}>
							<SheetTextField
								resolved={resolveTextField(itemContext, {
									id: "name",
								})}
								className="flex-1"
								label={
									index > 0 ?
										<span className="sr-only">Condition</span>
									:	"Condition"
								}
							/>
							<SheetNumberField
								resolved={resolveNumberField(itemContext, {
									id: "intensity",
								})}
								className="w-20"
								label={
									index > 0 ?
										<span className="sr-only">Intensity</span>
									:	undefined
								}
							/>
						</div>
					)}
				</SheetListFieldMinimal>
			</div>
		),
	}

	const statsTab = {
		name: "Stats",
		content: (
			<div className="grid grid-cols-2 gap-3">
				<div className="grid gap-3">
					{ATTRIBUTE_NAMES.flatMap((name) => scores.fields.get(name) ?? []).map(
						(field) => (
							<SheetStatField
								key={field.id}
								label={field.name}
								tooltip={field.description}
								score={scores.scoreOf(field.name)}
								resolved={field}
							/>
						),
					)}
				</div>
				<div className="grid gap-3">
					{ASPECT_NAMES.flatMap((name) => scores.fields.get(name) ?? []).map(
						(field) => (
							<SheetStatField
								key={field.id}
								label={field.name}
								tooltip={field.description}
								score={scores.scoreOf(field.name)}
								resolved={field}
							/>
						),
					)}
				</div>
			</div>
		),
	}

	const skillsTab = {
		name: "Skills",
		content: <CoreSkillsList />,
	}

	const aspectSkillsTab = {
		name: "Aspect Skills",
		content: <AspectSkillsList />,
	}

	const itemsTab = {
		name: "Items",
		content: (
			<SheetListField resolved={resolveListField(sheet, "items")}>
				{(itemContext) => (
					<div className="grid gap-2">
						<div className="flex gap-2">
							<SheetTextField
								resolved={resolveTextField(itemContext, {
									id: "name",
									defaultValue: "New Item",
								})}
								className="flex-1"
							/>
							<SheetNumberField
								resolved={resolveNumberField(itemContext, {
									id: "size",
									min: 1,
								})}
								className="w-16"
							/>
							<SheetNumberField
								resolved={resolveNumberField(itemContext, {
									id: "uses",
								})}
								className="w-16"
							/>
						</div>

						<SheetSelectField
							resolved={resolveSelectField(itemContext, {
								id: "type",
								defaultValue: "tool",
								choices: ITEM_TYPES,
							})}
						/>

						<SheetTextField
							resolved={resolveTextField(itemContext, {
								id: "description",
							})}
							multiline
						/>
					</div>
				)}
			</SheetListField>
		),
	}

	const bondsTab = {
		name: "Bonds",
		content: (
			<SheetListField resolved={resolveListField(sheet, "bonds")}>
				{(bondContext) => (
					<div className="grid gap-2">
						<div className="flex gap-2">
							<SheetTextField
								resolved={resolveTextField(bondContext, {
									id: "name",
									defaultValue: "New Bond",
								})}
								className="flex-1"
							/>
							<SheetNumberField
								resolved={resolveNumberField(bondContext, {
									id: "strength",
									min: 1,
								})}
								className="w-24"
							/>
						</div>
						<SheetSelectField
							resolved={resolveSelectField(bondContext, {
								id: "aura",
								choices: ASPECT_AURAS,
							})}
						/>
						<SheetTextField
							resolved={resolveTextField(bondContext, {
								id: "description",
							})}
							multiline
						/>
					</div>
				)}
			</SheetListField>
		),
	}

	return (
		<>
			<div className="grid gap-6">
				<div className="flex gap-2">
					<NameField />
					<SheetNumberField
						resolved={resolveNumberField(sheet, { id: "bondActivations" })}
						className="w-32"
					/>
					<SheetNumberField
						label="Aspect EXP"
						resolved={resolveNumberField(sheet, { id: "aspectExperience" })}
						className="w-24"
					/>
				</div>

				<LineageFieldGroup sheet={sheet} />

				<SheetSelectField
					resolved={resolveSelectField(sheet, {
						id: "budget",
						choices: EXPENSE_TIERS.sort((a, b) =>
							a.name.localeCompare(b.name),
						).map((tier) => ({
							label: tier.name,
							value: tier.name,
							description: tier.examples,
						})),
						defaultValue: "dirt",
					})}
					description="What's the most expensive thing you can afford? You can freely buy things two tiers down."
				/>

				<SheetTextField
					description="Add any other important details, and/or use this to track other important information."
					multiline
					resolved={resolveTextField(sheet, { id: "details" })}
				/>

				<VisibilityField />
			</div>

			<div className="mt-6">
				<Tabs
					persistenceKey="mainTabs"
					tabs={[
						characterTab,
						statsTab,
						skillsTab,
						aspectSkillsTab,
						itemsTab,
						bondsTab,
					]}
				/>
			</div>
		</>
	)
}

function NameField() {
	const { character, updateCharacter } = use(CharacterContext)
	return (
		<EditableTextField
			label="Name"
			value={character.name}
			onChange={(name) => updateCharacter({ name })}
			className="flex-1"
		/>
	)
}

function VisibilityField() {
	const { character, updateCharacter } = use(CharacterContext)
	return (
		<SelectField
			label="Visibility"
			choices={[
				{
					value: "Public",
					description: "Everyone in the room can see this (but not edit it).",
				},
				{
					value: "Private",
					description: "Only you can see this.",
				},
			]}
			value={character.isPublic ? "Public" : "Private"}
			onChangeValue={(value) => {
				updateCharacter({
					isPublic: value === "Public",
				})
			}}
		/>
	)
}

function Tabs({
	tabs,
	defaultTabName = tabs[0]?.name,
	persistenceKey,
}: {
	tabs: ReadonlyArray<{ name: string; content: ReactNode }>
	defaultTabName?: string
	persistenceKey: string
}) {
	const [selectedId, setSelectedId] = useLocalStorageState(
		`CharacterSheetTabProvider:${persistenceKey}:selectedId`,
		defaultTabName,
		(input) => (typeof input === "string" ? input : defaultTabName),
	)

	if (tabs.length === 0) {
		return null
	}

	return (
		<Ariakit.TabProvider
			selectedId={selectedId}
			setSelectedId={(id) => id != null && setSelectedId(id)}
		>
			<Ariakit.TabList className="mb-3 flex flex-wrap gap-1 rounded-md bg-gray-950/25 p-1">
				{tabs.map((tab) => (
					<Ariakit.Tab
						key={tab.name}
						id={tab.name}
						className="flex-grow rounded px-3 py-1.5 text-center whitespace-nowrap text-gray-400 transition hover:text-gray-100 aria-selected:bg-white/10 aria-selected:text-white"
					>
						{tab.name || toTitleCase(tab.name)}
					</Ariakit.Tab>
				))}
			</Ariakit.TabList>

			{tabs.map((tab) => (
				<Ariakit.TabPanel key={tab.name} id={tab.name} className="grid gap-3">
					{tab.content}
				</Ariakit.TabPanel>
			))}
		</Ariakit.TabProvider>
	)
}
