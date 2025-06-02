import * as Ariakit from "@ariakit/react"
import { type ComponentProps, type ReactNode } from "react"
import { twMerge } from "tailwind-merge"
import type { NormalizedCharacter } from "../../convex/characters.ts"
import { EditableTextField } from "../components/EditableTextField.tsx"
import { SelectField } from "../components/ui/SelectField.tsx"
import EXPENSE_TIERS from "../data/list-of-expense-tiers.json"
import { useLocalStorageState } from "../hooks/storage.ts"
import { toTitleCase } from "../lib/utils.ts"
import { AspectSkillsList } from "./AspectSkillsList.tsx"
import {
	EditorCharacterContext,
	useEditorCharacter,
	useEditorCharacterSheet,
	useUpdateEditorCharacter,
} from "./context.tsx"
import { CoreSkillsList } from "./CoreSkillsList.tsx"
import { ASPECT_AURAS, ATTRIBUTE_ASPECTS, ATTRIBUTE_NAMES } from "./data.ts"
import { LineageFieldGroup } from "./LineageFieldGroup.tsx"
import { resolveMilestoneFields } from "./milestones.ts"
import { resolveCharacterScores } from "./scores.ts"
import {
	SheetNumberField,
	SheetSelectField,
	SheetTextField,
} from "./sheet/components.tsx"
import {
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
	const scores = resolveCharacterScores(sheet)
	// const damageLimit = getDamageLimit(sheet)
	// const fatigueLimit = getFatigueLimit(sheet)
	// const usedPoints = getUsedSkillPoints(sheet)
	// const totalPoints = getTotalSkillPoints(sheet)

	const characterTab = {
		name: "Character",
		content: (
			<Ariakit.HeadingLevel>
				<div className="grid gap-3">
					<div className="grid gap-6">
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

						{/* <div>
							<Ariakit.Heading className="mb-2 heading-2xl">
								Conditions
							</Ariakit.Heading>
							<SheetListFieldMinimal context={sheet} id="conditions">
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
						</div> */}
					</div>
				</div>
			</Ariakit.HeadingLevel>
		),
	}

	const skillsTab = {
		name: "Skills",
		content: (
			<CoreSkillsList />
			// <Ariakit.HeadingLevel>
			// 	<section>
			// 		<Ariakit.Heading className="mt-6 mb-2 heading-2xl">
			// 			Core Skills
			// 		</Ariakit.Heading>
			// 		<CoreSkillsList />
			// 	</section>
			// </Ariakit.HeadingLevel>
		),
	}

	const aspectsTab = {
		name: "Aspects",
		content: (
			<AspectSkillsList />
			// <Ariakit.HeadingLevel>
			// 	<section>
			// 		<div className="grid auto-cols-fr grid-flow-col gap-3">
			// 			{ASPECT_NAMES.flatMap((name) => scores.fields.get(name) ?? []).map(
			// 				(field) => (
			// 					<SheetNumberField
			// 						key={field.id}
			// 						label={field.name}
			// 						// tooltip={field.description}
			// 						// score={scores.scoreOf(field.name)}
			// 						resolved={field}
			// 					/>
			// 				),
			// 			)}
			// 		</div>

			// 		<Ariakit.Heading className="mt-6 mb-2 heading-2xl">
			// 			Aspect Skills
			// 		</Ariakit.Heading>
			// 		<AspectSkillsList />
			// 	</section>
			// </Ariakit.HeadingLevel>
		),
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
							{/* <SheetNumberField
								resolved={resolveNumberField(itemContext, {
									id: "size",
									min: 1,
								})}
								className="w-16"
							/> */}
							{/* <SheetNumberField
								resolved={resolveNumberField(itemContext, {
									id: "uses",
								})}
								className="w-16"
							/> */}
						</div>

						{/* <SheetSelectField
							resolved={resolveSelectField(itemContext, {
								id: "type",
								defaultValue: "tool",
								choices: ITEM_TYPES,
							})}
						/> */}

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

	const milestonesTab = {
		name: "Milestones",
		content: (
			<SheetListField resolved={resolveListField(sheet, "milestones")}>
				{(itemContext) => {
					const fields = resolveMilestoneFields(itemContext)
					return (
						<div className="grid gap-2">
							<SheetSelectField
								placeholder="Choose a bonus type"
								resolved={fields.bonusType}
							/>
							{fields.bonusType.value === "attributePoint" && (
								<SheetSelectField
									label="Attribute"
									placeholder="Choose an attribute"
									resolved={fields.attributeMilestoneChoice}
								/>
							)}
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
		),
	}

	return (
		<>
			<NameField />

			<div className="h-3"></div>

			<div className="flex gap-3">
				<SheetNumberField
					label={`Stress / 10`}
					resolved={resolveNumberField(sheet, { id: "stress" })}
					className="flex-1"
				/>
				<SheetNumberField
					label={`Critical Injuries / 3`}
					resolved={resolveNumberField(sheet, { id: "criticalInjuries" })}
					className="flex-1"
				/>
				<SheetNumberField
					resolved={resolveNumberField(sheet, { id: "bondActivations" })}
					className="flex-1"
				/>
				{/* <InfoField label="Skill points used" className="flex-1">
					{usedPoints}/{totalPoints}
				</InfoField> */}
			</div>

			<div className="h-4"></div>

			<div className="grid grid-cols-2 gap-3">
				{ATTRIBUTE_NAMES.flatMap((name) => scores.fields.get(name) ?? []).map(
					(field) => (
						<SheetStatField
							key={field.id}
							label={field.name}
							description={ATTRIBUTE_ASPECTS[field.name]}
							tooltip={field.description}
							score={scores.scoreOf(field.name)}
							resolved={field}
						/>
					),
				)}
			</div>

			<div className="h-4"></div>

			<SheetTextField
				description="Track any special statuses on your character."
				multiline
				resolved={resolveTextField(sheet, { id: "condition" })}
			/>

			<div className="h-6"></div>

			<Tabs
				persistenceKey="mainTabs"
				tabs={[
					characterTab,
					skillsTab,
					aspectsTab,
					itemsTab,
					bondsTab,
					milestonesTab,
				]}
			/>
		</>
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
			<div className="isolate">
				<div className="sticky -top-3 z-10 -mx-3 -mt-3 bg-gray-900 p-3">
					<Ariakit.TabList className="flex flex-wrap gap-1 rounded-md bg-gray-950/25 p-1">
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
				</div>
				{tabs.map((tab) => (
					<Ariakit.TabPanel
						key={tab.name}
						id={tab.name}
						className="grid gap-3"
						unmountOnHide
					>
						{tab.content}
					</Ariakit.TabPanel>
				))}
			</div>
		</Ariakit.TabProvider>
	)
}
