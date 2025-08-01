import * as Ariakit from "@ariakit/react"
import { sumBy } from "es-toolkit"
import { type ComponentProps, type ReactNode } from "react"
import { twMerge } from "tailwind-merge"

import type { NormalizedCharacter } from "../../../convex/characters.ts"
import { toTitleCase } from "../../lib/utils.ts"
import { useLocalStorageState } from "../dom/storage.ts"
import { Checkbox } from "../ui/Checkbox.tsx"
import { EditableTextField } from "../ui/EditableTextField.tsx"
import { Icon } from "../ui/Icon.tsx"
import { SelectField } from "../ui/SelectField.tsx"
import { SummaryCard } from "../ui/SummaryCard.tsx"
import { Tooltip } from "../ui/Tooltip.tsx"
import { resolveAspectFields } from "./aspects.ts"
import {
	EditorCharacterContext,
	useEditorCharacter,
	useEditorCharacterSheet,
	useUpdateEditorCharacter,
} from "./context.tsx"
import { CoreSkillsList } from "./CoreSkillsList.tsx"
import { ASPECT_AURAS, EXPENSE_TIERS } from "./data.ts"
import { LineageFieldGroup } from "./LineageFieldGroup.tsx"
import { resolveMilestoneFields } from "./milestones.ts"
import { RecoveryDialogButton } from "./RecoveryDialogButton.tsx"
import {
	SheetNumberField,
	SheetSelectField,
	SheetTextField,
} from "./sheet/components.tsx"
import {
	FieldContext,
	resolveBooleanField,
	resolveListField,
	resolveSelectField,
	resolveTextField,
} from "./sheet/fields.ts"
import { SheetListField } from "./sheet/SheetListField.tsx"
import { SheetStatField } from "./sheet/SheetStatField.tsx"
import { resolveStress } from "./stress.ts"

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

				<StressSection />

				<AspectsSection />

				<LineageFieldGroup />
			</div>

			<Tabs
				persistenceKey="mainTabs"
				tabs={[
					tab("Skills", () => <CoreSkillsList />),

					tab("Inventory", () => (
						<>
							<BudgetField />
							<ItemListField />
						</>
					)),

					tab("Experiences", () => <ExperienceListField />),

					tab("Milestones", () => (
						<SheetListField resolved={resolveListField(sheet, "milestones")}>
							{(itemContext) => {
								const fields = resolveMilestoneFields(itemContext)
								return (
									<div className="grid gap-2">
										<div className="flex gap-2 *:flex-1">
											<SheetSelectField
												placeholder="Choose an aspect bonus"
												resolved={fields.aspectBonus}
											/>
											<SheetSelectField
												placeholder="Choose a skill bonus"
												resolved={fields.skillBonus}
											/>
										</div>
										<SheetTextField
											label="Notes"
											multiline
											description="Add context for this milestone"
											resolved={fields.notes}
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

function AspectsSection() {
	const sheet = useEditorCharacterSheet()
	const aspects = resolveAspectFields(sheet)

	const usedPoints = sumBy(
		Object.entries(aspects),
		([_name, aspect]) => aspect.resolved.value,
	)
	const availablePoints = 8
	const remainingPoints = availablePoints - usedPoints

	return (
		<div>
			<div className="grid grid-cols-2 gap-2">
				{Object.entries(aspects).map(([name, aspect]) => {
					const className = {
						Fire: twMerge(`border-red-800/50 bg-red-950/25 text-red-200`),
						Water: twMerge(`border-blue-800/50 bg-blue-950/25 text-blue-200`),
						Wind: twMerge(`border-green-800/50 bg-green-950/25 text-green-200`),
						Light: twMerge(
							`border-yellow-800/50 bg-yellow-950/25 text-yellow-200`,
						),
						Darkness: twMerge(
							`border-purple-800/50 bg-purple-950/25 text-purple-200`,
						),
					}[name]

					return (
						<SheetStatField
							className={twMerge("flex-1", className)}
							key={name}
							label={`${name} (${aspect.computedScore})`}
							description={
								aspect.milestoneBonus > 0 &&
								`+${aspect.milestoneBonus} from milestones`
							}
							resolved={aspect.resolved}
							score={null}
						/>
					)
				})}
			</div>
			{remainingPoints > 0 && (
				<p className="mt-1 muted-sm">{remainingPoints} point(s) remaining</p>
			)}
		</div>
	)
}

function StressSection() {
	const sheet = useEditorCharacterSheet()
	const stress = resolveStress(sheet)
	const unconsciousField = resolveBooleanField(sheet, { id: "isUnconscious" })

	return (
		<div className="grid gap-2">
			<div className="flex items-end gap-2">
				{stress.pools.map((pool) => (
					<SheetNumberField
						key={pool.field.id}
						label={pool.label}
						resolved={pool.field}
						className="flex-1"
					/>
				))}
				<RecoveryDialogButton />
			</div>

			<Checkbox
				label={
					!unconsciousField.value && stress.perilSum >= 5 ?
						<span className="flex items-center gap-1 text-red-300">
							Unconscious
							<Icon icon="mingcute:warning-fill" />
						</span>
					: unconsciousField.value && stress.perilSum <= 3 ?
						<span className="flex items-center gap-1 text-blue-300">
							Unconscious
							<Icon icon="mingcute:star-fill" />
						</span>
					:	"Unconscious"
				}
				checked={unconsciousField.value}
				onChange={() => {
					unconsciousField.set(!unconsciousField.value)
				}}
			/>

			<p className="-my-1 muted-sm">
				You become unconscious at <strong>5 total</strong> peril, then you
				regain consciousness once you're healed to <strong>3 or fewer</strong>{" "}
				peril.
			</p>
		</div>
	)
}

function ItemListField() {
	const sheet = useEditorCharacterSheet()
	return (
		<Ariakit.HeadingLevel>
			<div>
				<Ariakit.Heading className="heading-xl">Items</Ariakit.Heading>
				<p className="mb-2 text-sm font-medium text-gray-300">
					Applicable items give +1 dice on skill checks
				</p>
				<SheetListField
					resolved={resolveListField(sheet, "items")}
					renderViewModeItem={(itemContext) => {
						const fields = resolveItemFields(itemContext)

						return (
							<SummaryCard
								heading={fields.name.value}
								className="rounded-lg border border-gray-800 bg-gray-950/20 px-3 py-3"
							>
								<div className="grid justify-items-start gap-1">
									{fields.description.value && (
										<p>{fields.description.value}</p>
									)}
									<Tooltip
										className="flex items-center gap-1"
										content={fields.price.currentOption?.hint}
									>
										<Icon icon="mingcute:coin-2-fill" />
										<p className="text-sm font-medium text-gray-300">
											{fields.price.value}
										</p>
									</Tooltip>
								</div>
							</SummaryCard>
						)
					}}
					renderEditModeItem={(itemContext) => {
						const fields = resolveItemFields(itemContext)

						return (
							<div className="grid gap-2">
								<div className="flex gap-2">
									<SheetTextField className="flex-1" resolved={fields.name} />
									<SheetSelectField className="w-36" resolved={fields.price} />
								</div>

								<SheetTextField resolved={fields.description} multiline />
							</div>
						)
					}}
				/>
			</div>
		</Ariakit.HeadingLevel>
	)
}

function ExperienceListField() {
	const sheet = useEditorCharacterSheet()

	return (
		<SheetListField
			resolved={resolveListField(sheet, "bonds")}
			renderViewModeItem={(bondContext) => {
				const fields = resolveExperienceFields(bondContext)

				const auraProps = {
					"Fire": {
						className: twMerge(`bg-red-950/30 border-red-800`),
						icon: <Icon icon="mingcute:fire-fill" />,
					},
					"Water": {
						className: twMerge(`bg-blue-950/30 border-blue-800`),
						icon: <Icon icon="mingcute:drop-fill" />,
					},
					"Wind": {
						className: twMerge(`bg-green-950/30 border-green-800`),
						icon: <Icon icon="mingcute:wind-fill" />,
					},
					"Light": {
						className: twMerge(`bg-yellow-950/30 border-yellow-800`),
						icon: <Icon icon="mingcute:sun-fill" />,
					},
					"Darkness": {
						className: twMerge(`bg-purple-950/30 border-purple-800`),
						icon: <Icon icon="mingcute:moon-fill" />,
					},

					// blame typescript, prettier, and my weird decision
					// to have empty string be the default value, I guess?
					"": undefined,
				}[fields.aura.value]

				return (
					<SummaryCard
						heading={
							<div className="flex items-center gap-1.5">
								{fields.name.value}
								<Tooltip
									content={`${fields.aura.value} - ${fields.aura.currentOption?.hint}`}
									className="translate-y-px opacity-60 transition *:size-4.5 hover:opacity-100"
								>
									{auraProps?.icon}
								</Tooltip>
							</div>
						}
						className={twMerge(
							"rounded-lg border border-gray-800 bg-gray-950/20 px-3 py-3 transition",
							auraProps?.className,
							fields.activated.value && "opacity-70",
						)}
					>
						<p>{fields.description.value}</p>
						<Checkbox
							className="mt-1.5"
							label="Activated"
							checked={fields.activated.value}
							onChange={(event) => {
								fields.activated.set(event.currentTarget.checked)
							}}
						/>
					</SummaryCard>
				)
			}}
			renderEditModeItem={(bondContext) => {
				const fields = resolveExperienceFields(bondContext)

				return (
					<div className="grid gap-4">
						<div>
							<div className="flex gap-2">
								<SheetTextField className="flex-1" resolved={fields.name} />
								<SheetSelectField
									className="w-48"
									placeholder="Choose an aura"
									resolved={fields.aura}
								/>
							</div>
							<p className="mt-1 text-sm font-medium text-gray-300 empty:hidden">
								{fields.aura.currentOption?.value} -{" "}
								{fields.aura.currentOption?.hint}
							</p>
						</div>
						<SheetTextField
							multiline
							resolved={fields.description}
							label={
								<div className="mb-1 flex justify-between">
									<div>Description</div>
									<Checkbox
										label="Activated"
										checked={fields.activated.value}
										onChange={(event) => {
											fields.activated.set(event.currentTarget.checked)
										}}
									/>
								</div>
							}
						/>
					</div>
				)
			}}
		/>
	)
}

function resolveExperienceFields(itemContext: FieldContext) {
	return {
		name: resolveTextField(itemContext, {
			id: "name",
			defaultValue: "New Experience",
		}),
		aura: resolveSelectField(itemContext, {
			id: "aura",
			choices: ASPECT_AURAS,
		}),
		description: resolveTextField(itemContext, {
			id: "description",
		}),
		activated: resolveBooleanField(itemContext, {
			id: "activated",
		}),
	}
}

function resolveItemFields(itemContext: FieldContext) {
	return {
		name: resolveTextField(itemContext, {
			id: "name",
			defaultValue: "New Item",
		}),
		price: resolveSelectField(itemContext, {
			id: "price",
			defaultValue: "4. Steep",
			choices: EXPENSE_TIERS.sort((a, b) => a.name.localeCompare(b.name)).map(
				(tier) => ({
					label: tier.name,
					value: tier.name,
					hint: tier.examples,
				}),
			),
		}),
		description: resolveTextField(itemContext, {
			id: "description",
		}),
	}
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
