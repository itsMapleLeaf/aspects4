import * as Ariakit from "@ariakit/react"
import { type ReactNode } from "react"
import { useLocalStorageState } from "~/hooks/storage.ts"
import { toTitleCase } from "~/lib/utils.ts"
import { EditableTextField } from "../components/EditableTextField.tsx"
import { Tooltip } from "../components/ui/Tooltip.tsx"
import EXPENSE_TIERS from "../data/list-of-expense-tiers.json"
import LINEAGES from "../data/list-of-lineages.json"
import CORE_SKILLS from "../data/list-of-skills.json"
import type { Character } from "./character.ts"
import { auraOptions, itemTypeOptions } from "./data.ts"
import {
	SheetNumberField,
	SheetSelectField,
	SheetStatField,
	SheetTextField,
} from "./sheet/components.tsx"
import {
	createFieldContext,
	resolveNumberField,
	resolveSelectField,
	resolveTextField,
	type FieldContext,
	type ResolvedNumberField,
} from "./sheet/fields.ts"
import { SheetListField } from "./sheet/SheetListField.tsx"
import { SheetListFieldMinimal } from "./sheet/SheetListFieldMinimal.tsx"

export function CharacterEditor({
	character,
	onNameChanged,
	onValueChanged,
}: {
	character: Character
	onNameChanged: (name: string) => void
	onValueChanged: (key: string, value: unknown) => void
}) {
	const sheet = createFieldContext(character.values, onValueChanged)

	const attributeFields = {
		strength: resolveNumberField(sheet, { id: "strength", min: 1 }),
		sense: resolveNumberField(sheet, { id: "sense", min: 1 }),
		dexterity: resolveNumberField(sheet, { id: "dexterity", min: 1 }),
		intellect: resolveNumberField(sheet, { id: "intellect", min: 1 }),
		presence: resolveNumberField(sheet, { id: "presence", min: 1 }),
	}

	const aspectFields = {
		fire: resolveNumberField(sheet, { id: "fire" }),
		water: resolveNumberField(sheet, { id: "water" }),
		wind: resolveNumberField(sheet, { id: "wind" }),
		light: resolveNumberField(sheet, { id: "light" }),
		darkness: resolveNumberField(sheet, { id: "darkness" }),
	}

	const coreSkills = CORE_SKILLS.sort((a, b) =>
		a.skill.localeCompare(b.skill),
	).map((info) => ({
		info,
		resolved: resolveNumberField(sheet, { id: `coreSkills:${info.skill}` }),
	}))

	const damageLimit =
		attributeFields.strength.value + attributeFields.dexterity.value

	const fatigueLimit =
		attributeFields.sense.value +
		attributeFields.intellect.value +
		attributeFields.presence.value

	const usedSkillPoints = coreSkills.reduce(
		(sum, { resolved }) => sum + resolved.value,
		0,
	)

	const characterTab = {
		name: "Character",
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

				<SheetTextField
					resolved={resolveTextField(sheet, { id: "details" })}
					multiline
				/>
			</div>
		),
	}

	const statsTab = {
		name: "Stats",
		content: (
			<div className="grid grid-cols-2 gap-x-4">
				<div className="grid gap-3">
					{Object.values(attributeFields).map((field) => (
						<SheetStatField key={field.id} resolved={field} />
					))}
				</div>
				<div className="grid gap-3">
					{Object.values(aspectFields).map((field) => (
						<SheetStatField key={field.id} resolved={field} />
					))}
				</div>
			</div>
		),
	}

	const skillsTab = {
		name: "Skills",
		content: (
			<div className="@container grid gap-3">
				<strong className="font-semibold">
					{usedSkillPoints}/5 skill points used
				</strong>
				<div className="grid gap-x-6 gap-y-2 @sm:grid-cols-2">
					{coreSkills.map((props) => (
						<CoreSkillField key={props.resolved.id} {...props} />
					))}
				</div>
				<SheetTextField
					resolved={resolveTextField(sheet, { id: "aspectSkills" })}
					multiline
				/>
			</div>
		),
	}

	const itemsTab = {
		name: "Items",
		content: (
			<SheetListField context={sheet} id="items">
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
								options: itemTypeOptions,
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
			<SheetListField context={sheet} id="bonds">
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
								options: auraOptions,
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
					<EditableTextField
						label="Name"
						value={character.name}
						onChange={onNameChanged}
						className="flex-1"
					/>
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
						options: EXPENSE_TIERS.sort((a, b) =>
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
			</div>

			<div className="mt-4 grid gap-3">
				<CharacterEditorTabs
					persistenceKey="mainTabs"
					tabs={[characterTab, statsTab, skillsTab, itemsTab, bondsTab]}
				/>
			</div>
		</>
	)
}

type CoreSkillInfo = (typeof CORE_SKILLS)[number]

function CoreSkillField({
	info,
	resolved,
}: {
	info: CoreSkillInfo
	resolved: ResolvedNumberField
}) {
	return (
		<div
			key={info.skill}
			data-active={resolved.value > 0 || undefined}
			className="opacity-60 transition data-active:opacity-100"
		>
			<SheetStatField
				resolved={resolved}
				label={<CoreSkillFieldLabel info={info} />}
			/>
		</div>
	)
}

function CoreSkillFieldLabel({ info }: { info: CoreSkillInfo }) {
	return (
		<Tooltip content={info.flavor} placement="bottom-start">
			<button
				type="button"
				className="cursor-default leading-tight transition hover:text-primary-300"
			>
				{info.skill}
				<br />
				<span className="text-sm font-normal opacity-60">{info.attribute}</span>
			</button>
		</Tooltip>
	)
}

function LineageFieldGroup({ sheet }: { sheet: FieldContext }) {
	const lineage = resolveSelectField(sheet, {
		id: "lineage",
		options: LINEAGES.sort((a, b) => a.lineage.localeCompare(b.lineage)).map(
			(item) => ({
				label: item.lineage,
				value: item.lineage,
				hint: item.memberCreatures,
			}),
		),
	})

	const [abilityName, abilityDescription] =
		LINEAGES.find((it) => it.lineage === lineage.value)?.ability?.split(
			" - ",
			2,
		) ?? []

	return (
		<div>
			<div className="flex gap-2">
				<SheetSelectField className="flex-1" resolved={lineage} />
				{lineage.value === "Furbearer" && (
					<SheetNumberField
						className="w-32"
						resolved={resolveNumberField(sheet, { id: "adaptationPoints" })}
					/>
				)}
				{lineage.value === "Scalebearer" && (
					<SheetNumberField
						className="w-32"
						resolved={resolveNumberField(sheet, { id: "reflectionPoints" })}
					/>
				)}
			</div>
			{abilityName && abilityDescription && (
				<p className="mt-1 text-sm">
					<strong>{abilityName}</strong> - <em>{abilityDescription}</em>
				</p>
			)}
		</div>
	)
}

function CharacterEditorTabs({
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
			<Ariakit.TabList className="grid auto-cols-fr grid-flow-col gap-1 rounded-md bg-gray-950/25 p-1">
				{tabs.map((tab) => (
					<Ariakit.Tab
						key={tab.name}
						id={tab.name}
						className="rounded px-3 py-1.5 text-center text-gray-400 transition hover:text-gray-100 aria-selected:bg-white/10 aria-selected:text-white"
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
