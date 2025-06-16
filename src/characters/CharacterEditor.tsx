import * as Ariakit from "@ariakit/react"
import { type ComponentProps, type ReactNode } from "react"
import { twMerge } from "tailwind-merge"
import type { NormalizedCharacter } from "../../convex/characters.ts"
import { EditableTextField } from "../components/EditableTextField.tsx"
import { Checkbox } from "../components/ui/Checkbox.tsx"
import { Field } from "../components/ui/Field.tsx"
import { SelectField } from "../components/ui/SelectField.tsx"
import { useLocalStorageState } from "../hooks/storage.ts"
import { toTitleCase } from "../lib/utils.ts"
import {
	EditorCharacterContext,
	useEditorCharacter,
	useEditorCharacterSheet,
	useUpdateEditorCharacter,
} from "./context.tsx"
import { CoreSkillsList } from "./CoreSkillsList.tsx"
import { ASPECT_AURAS, ASPECTS, EXPENSE_TIERS } from "./data.ts"
import { LineageFieldGroup } from "./LineageFieldGroup.tsx"
import { resolveMilestoneFields } from "./milestones.ts"
import {
	SheetNumberField,
	SheetSelectField,
	SheetTextField,
} from "./sheet/components.tsx"
import {
	resolveBooleanField,
	resolveListField,
	resolveNumberField,
	resolveSelectField,
	resolveTextField,
} from "./sheet/fields.ts"
import { SheetListField } from "./sheet/SheetListField.tsx"
import { SheetStatField } from "./sheet/SheetStatField.tsx"

export function CharacterEditor({
	character,
}: {
	character: NormalizedCharacter
}) {
	return (
		<EditorCharacterContext value={character}>
			<CharacterEditorInner />
		</EditorCharacterContext>
	)
}

function CharacterEditorInner() {
	const sheet = useEditorCharacterSheet()

	return (
		<div className="grid gap-6">
			<div className="grid gap-4">
				<div className="flex gap-2">
					<div className="flex-1">
						<NameField />
					</div>
					<div className="w-32">
						<VisibilityField />
					</div>
				</div>

				<div className="flex gap-2">
					<SheetNumberField
						label={`Damage / 10`}
						resolved={resolveNumberField(sheet, { id: "damage" })}
						className="flex-1"
					/>
					<SheetNumberField
						label={`Critical Injuries / 3`}
						resolved={resolveNumberField(sheet, { id: "criticalInjuries" })}
						className="flex-1"
					/>
				</div>

				<Field label="Aspects">
					<div className="grid grid-cols-2 gap-2">
						{Object.entries(ASPECTS).map(([name, aspect]) => (
							<SheetStatField
								key={name}
								label={name}
								tooltip={aspect.description}
								resolved={resolveNumberField(sheet, {
									id: `aspect:${name}`,
									min: 1,
								})}
							/>
						))}
					</div>
				</Field>

				<LineageFieldGroup />
			</div>

			<Tabs
				persistenceKey="mainTabs"
				tabs={[
					tab("Skills", () => <CoreSkillsList />),

					tab("Inventory", () => (
						<>
							<BudgetField />
							<Ariakit.HeadingLevel>
								<Ariakit.Heading className="heading-xl">Items</Ariakit.Heading>
								<SheetListField resolved={resolveListField(sheet, "items")}>
									{(itemContext) => (
										<div className="grid gap-2">
											<div className="flex gap-2">
												<SheetTextField
													className="flex-1"
													resolved={resolveTextField(itemContext, {
														id: "name",
														defaultValue: "New Item",
													})}
												/>
												<SheetSelectField
													className="w-36"
													resolved={resolveSelectField(itemContext, {
														id: "price",
														defaultValue: "4. Steep",
														choices: EXPENSE_TIERS.sort((a, b) =>
															a.name.localeCompare(b.name),
														).map((tier) => ({
															label: tier.name,
															value: tier.name,
															hint: tier.examples,
														})),
													})}
												/>
											</div>

											<SheetTextField
												resolved={resolveTextField(itemContext, {
													id: "description",
												})}
												multiline
											/>
										</div>
									)}
								</SheetListField>
							</Ariakit.HeadingLevel>
						</>
					)),

					tab("Bonds", () => (
						<SheetListField resolved={resolveListField(sheet, "bonds")}>
							{(bondContext) => {
								const auraField = resolveSelectField(bondContext, {
									id: "aura",
									choices: ASPECT_AURAS,
								})

								const activatedField = resolveBooleanField(bondContext, {
									id: "activated",
								})

								return (
									<div className="grid gap-4">
										<div>
											<div className="flex gap-2">
												<SheetTextField
													className="flex-1"
													resolved={resolveTextField(bondContext, {
														id: "name",
														defaultValue: "New Bond",
													})}
												/>
												<SheetSelectField
													className="w-48"
													placeholder="Choose an aura"
													resolved={auraField}
												/>
											</div>
											<p className="mt-1 text-sm font-medium text-gray-300 empty:hidden">
												{auraField.currentOption?.hint}
											</p>
										</div>

										<Checkbox
											label="Activated"
											checked={activatedField.value}
											onChange={(event) => {
												activatedField.context.updateValue(
													activatedField.id,
													event.currentTarget.checked,
												)
											}}
										/>

										<SheetTextField
											multiline
											resolved={resolveTextField(bondContext, {
												id: "description",
											})}
										/>
									</div>
								)
							}}
						</SheetListField>
					)),

					tab("Milestones", () => (
						<SheetListField resolved={resolveListField(sheet, "milestones")}>
							{(itemContext) => {
								const fields = resolveMilestoneFields(itemContext)
								return (
									<div className="grid gap-2">
										<SheetTextField
											resolved={fields.notes}
											label="Notes"
											multiline
											description="Add context for this milestone"
										/>
									</div>
								)
							}}
						</SheetListField>
					)),

					tab("Notes", () => (
						<>
							<SheetTextField
								description="Add any other important details, and/or use this to track other important information."
								multiline
								resolved={resolveTextField(sheet, { id: "details" })}
							/>
						</>
					)),
				]}
			/>
		</div>
	)
}

function BudgetField() {
	const sheet = useEditorCharacterSheet()
	return (
		<SheetSelectField
			resolved={resolveSelectField(sheet, {
				id: "budget",
				defaultValue: "4. Steep",
				choices: EXPENSE_TIERS.sort((a, b) => a.name.localeCompare(b.name)).map(
					(tier) => ({
						label: tier.name,
						value: tier.name,
						description: tier.examples,
					}),
				),
			})}
			description="What's the most expensive thing you can afford? You can freely buy things two tiers down."
		/>
	)
}

function InfoField({
	label,
	children,
	className,
	...props
}: ComponentProps<"div"> & {
	label: ReactNode
	children: ReactNode
}) {
	return (
		<div className={twMerge("flex flex-col gap-0.5", className)} {...props}>
			<div className="text-sm font-semibold">{label}</div>
			<div className="flex h-10 w-full items-center justify-center panel bg-black/25 text-center text-lg font-semibold">
				{children}
			</div>
		</div>
	)
}

function NameField() {
	const character = useEditorCharacter()
	const updateCharacter = useUpdateEditorCharacter()
	return (
		<EditableTextField
			label="Name"
			value={character?.name ?? ""}
			onChange={(name) => updateCharacter({ name })}
			className="flex-1"
		/>
	)
}

function VisibilityField() {
	const character = useEditorCharacter()
	const updateCharacter = useUpdateEditorCharacter()
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
			value={character?.isPublic ? "Public" : "Private"}
			onChangeValue={(value) => {
				updateCharacter({
					isPublic: value === "Public",
				})
			}}
		/>
	)
}

type Tab = {
	name: string
	content: () => ReactNode
}

function Tabs({
	tabs,
	defaultTabName = tabs[0]?.name,
	persistenceKey,
}: {
	tabs: ReadonlyArray<Tab>
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
			<div className="isolate">
				<div className="sticky -top-3 z-10 -mx-3 -mt-3 bg-gray-900 p-3">
					<Ariakit.TabList className="flex flex-wrap gap-1 rounded-md bg-gray-950/25 p-1">
						{tabs.map((tab) => (
							<Ariakit.Tab
								key={tab.name}
								id={tab.name}
								className="flex-1 shrink-0 rounded px-3 py-1.5 text-center whitespace-nowrap text-gray-400 transition hover:text-gray-100 aria-selected:bg-white/10 aria-selected:text-white"
							>
								{tab.name || toTitleCase(tab.name)}
							</Ariakit.Tab>
						))}
					</Ariakit.TabList>
				</div>
				{tabs.map((tab) => (
					<Ariakit.TabPanel
						key={tab.name}
						id={tab.name}
						className="grid gap-3"
						unmountOnHide
					>
						{tab.content()}
					</Ariakit.TabPanel>
				))}
			</div>
		</Ariakit.TabProvider>
	)
}

function tab(name: string, content: () => ReactNode) {
	return { name, content }
}
