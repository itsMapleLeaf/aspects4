import * as Ariakit from "@ariakit/react"
import { type ReactNode } from "react"
import type { NonEmptyTuple } from "type-fest"
import { useLocalStorageState } from "~/hooks/storage.ts"
import { toTitleCase } from "~/lib/utils.ts"
import { EditableTextField } from "../components/EditableTextField.tsx"
import listOfLineages from "../data/list-of-lineages.json"
import type { Character } from "./character.ts"
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
} from "./sheet/fields.tsx"
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

	const damageLimit =
		attributeFields.strength.value + attributeFields.dexterity.value

	const fatigueLimit =
		attributeFields.sense.value +
		attributeFields.intellect.value +
		attributeFields.presence.value

	const budgetOptions = [
		{
			value: "dirt",
			label: "1. Dirt",
			description: "Water and other freely-available resources",
		},
		{
			value: "cheap",
			label: "2. Cheap",
			description: "Common meals, simple clothing",
		},
		{
			value: "inexpensive",
			label: "3. Inexpensive",
			description:
				"Five-star meals, basic tools and weapons, reasonable lodging",
		},
		{
			value: "steep",
			label: "4. Steep",
			description:
				"Premium tools and weapons, extravagant clothing, comfortable lodging",
		},
		{
			value: "expensive",
			label: "5. Expensive",
			description: "A house, luxurious lodging",
		},
		{ value: "valuable", label: "6. Valuable", description: "A mansion" },
		{
			value: "priceless",
			label: "7. Priceless",
			description: "An extremely rare, precious, powerful artifact",
		},
	]

	const itemTypeOptions = [
		{
			value: "consumable",
			label: "Consumable",
			description: "Goes away when there are no more uses",
		},
		{
			value: "tool",
			label: "Tool",
			description: "Can be used and reused while held",
		},
		{
			value: "wearable",
			label: "Wearable",
			description: "Can be worn for a persistent effect",
		},
	]

	const auraOptions = [
		{
			value: "Fire",
			label: "Fire",
			description:
				"Indicates an adversarial, heated, conflict-heavy relationship.",
		},
		{
			value: "Water",
			label: "Water",
			description: "Comes from notions of comfort, peace, and protection.",
		},
		{
			value: "Wind",
			label: "Wind",
			description:
				"Exhibits in turbulent relationships full of excitement and change.",
		},
		{
			value: "Light",
			label: "Light",
			description:
				"Represents diplomatic relationships built on fairness and respect.",
		},
		{
			value: "Darkness",
			label: "Darkness",
			description: "Manifests from tension, mistrust, and uncertainty.",
		},
	]

	return (
		<div className="grid gap-8">
			<div className="grid gap-3">
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
				</div>
				<div className="grid grid-cols-2 gap-2">
					<SheetNumberField
						resolved={resolveNumberField(sheet, { id: "skillPoints" })}
					/>
					<SheetNumberField
						resolved={resolveNumberField(sheet, { id: "aspectExperience" })}
					/>
				</div>
				<SheetSelectField
					resolved={resolveSelectField(sheet, {
						id: "budget",
						options: budgetOptions,
						defaultValue: "dirt",
					})}
					description="What's the most expensive thing you can afford? You can freely buy things two tiers down."
				/>
			</div>

			<div className="grid gap-3">
				<CharacterEditorTabs persistenceKey="mainTabs">
					{[
						{
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
									<SheetSelectField
										resolved={resolveSelectField(sheet, {
											id: "lineage",
											options: listOfLineages
												.sort((a, b) => a.lineage.localeCompare(b.lineage))
												.map((item) => ({
													label: item.lineage,
													value: item.lineage,
													hint: item.memberCreatures,
													description: item.ability,
												})),
										})}
									/>
									<SheetTextField
										resolved={resolveTextField(sheet, { id: "details" })}
										multiline
									/>
								</div>
							),
						},
						{
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
						},
						{
							name: "Skills",
							content: (
								<div className="grid gap-3">
									<div className="grid grid-cols-2 gap-4">
										<SheetTextField
											resolved={resolveTextField(sheet, { id: "coreSkills" })}
											multiline
										/>
										<SheetTextField
											resolved={resolveTextField(sheet, { id: "aspectSkills" })}
											multiline
										/>
									</div>
								</div>
							),
						},
						{
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
						},
						{
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
						},
					]}
				</CharacterEditorTabs>
			</div>
		</div>
	)
}

function CharacterEditorTabs({
	children,
	defaultTabName = children[0].name,
	persistenceKey,
}: {
	children: NonEmptyTuple<{ name: string; content: ReactNode }>
	defaultTabName?: string
	persistenceKey: string
}) {
	const [selectedId, setSelectedId] = useLocalStorageState(
		`CharacterSheetTabProvider:${persistenceKey}:selectedId`,
		defaultTabName,
		(input) => (typeof input === "string" ? input : defaultTabName),
	)

	return (
		<Ariakit.TabProvider
			selectedId={selectedId}
			setSelectedId={(id) => id != null && setSelectedId(id)}
		>
			<Ariakit.TabList className="grid auto-cols-fr grid-flow-col gap-1 rounded-md bg-gray-950/25 p-1">
				{children.map((tab) => (
					<Ariakit.Tab
						key={tab.name}
						id={tab.name}
						className="rounded px-3 py-1.5 text-gray-400 transition hover:text-gray-100 aria-selected:bg-white/10 aria-selected:text-white"
					>
						{tab.name || toTitleCase(tab.name)}
					</Ariakit.Tab>
				))}
			</Ariakit.TabList>

			{children.map((tab) => (
				<Ariakit.TabPanel key={tab.name} id={tab.name} className="grid gap-3">
					{tab.content}
				</Ariakit.TabPanel>
			))}
		</Ariakit.TabProvider>
	)
}
