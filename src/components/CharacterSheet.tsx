import * as Ariakit from "@ariakit/react"
import { useMutation, useQuery } from "convex/react"
import { clamp, sum } from "es-toolkit"
import {
	ComponentProps,
	ReactNode,
	RefObject,
	useId,
	useState,
	useTransition,
	type ChangeEvent,
} from "react"
import { twMerge } from "tailwind-merge"
import type { Character, CharacterBond } from "~/lib/character.ts"
import { safeParseNumber } from "~/lib/utils.ts"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import aspectSkillList from "../data/list-of-aspect-skills.json"
import aspectList from "../data/list-of-aspects.json"
import attributeList from "../data/list-of-attributes.json"
import lineageList from "../data/list-of-lineages.json"
import personaList from "../data/list-of-personas.json"
import skillList from "../data/list-of-skills.json"
import { ChatInputRef } from "./Chat.tsx"
import { Tooltip } from "./ui/Tooltip.tsx"

const attributeOrder = [
	"Strength",
	"Sense",
	"Dexterity",
	"Intellect",
	"Presence",
]

const aspectOrder = ["Fire", "Water", "Wind", "Light", "Darkness"]

export function CharacterSheet({
	character,
	chatInputRef,
	roomId,
	onChange,
	className,
}: {
	character: Character
	chatInputRef: RefObject<ChatInputRef | null>
	roomId: Id<"rooms">
	onChange: (name: Character) => void
	className?: string
}) {
	const attributeScores = {
		Strength: safeParseNumber(character.data[`attribute:Strength`]) ?? 1,
		Sense: safeParseNumber(character.data[`attribute:Sense`]) ?? 1,
		Dexterity: safeParseNumber(character.data[`attribute:Dexterity`]) ?? 1,
		Intellect: safeParseNumber(character.data[`attribute:Intellect`]) ?? 1,
		Presence: safeParseNumber(character.data[`attribute:Presence`]) ?? 1,
	}

	const aspectScores = {
		Fire: safeParseNumber(character.data[`aspect:Fire`]) ?? 0,
		Water: safeParseNumber(character.data[`aspect:Water`]) ?? 0,
		Wind: safeParseNumber(character.data[`aspect:Wind`]) ?? 0,
		Light: safeParseNumber(character.data[`aspect:Light`]) ?? 0,
		Darkness: safeParseNumber(character.data[`aspect:Darkness`]) ?? 0,
	}

	const selectedPersona = character.data["persona"] || ""
	const selectedLineage = character.data["lineage"] || ""

	const modifiedAttributeScores = new Map<string, number>(
		Object.entries(attributeScores),
	)
	const modifiedAspectScores = new Map<string, number>(
		Object.entries(aspectScores),
	)

	const bondStrengthSum = sum(
		character.bonds?.map((bond) => bond.strength) ?? [],
	)

	const bondAspectBonus = getBondAspectBonus(bondStrengthSum)
	if (bondAspectBonus) {
		const current = modifiedAspectScores.get(bondAspectBonus) ?? 0
		modifiedAspectScores.set(bondAspectBonus, current + 1)
	}

	let hitsMod = safeParseNumber(character.data.hitsMax) ?? 0
	let fatigueMod = safeParseNumber(character.data.fatigueMax) ?? 0

	switch (selectedPersona) {
		case "Manipulator": {
			const current = modifiedAttributeScores.get("Presence") ?? 0
			modifiedAttributeScores.set("Presence", current + 1)
			break
		}
		case "Commander":
			fatigueMod += 3
			break
		case "Vitalist": {
			const current = modifiedAspectScores.get("Light") ?? 0
			modifiedAspectScores.set("Light", current + 1)
			break
		}
		case "Protector": {
			const current = modifiedAttributeScores.get("Strength") ?? 0
			modifiedAttributeScores.set("Strength", current + 1)
			break
		}
		case "Strategist": {
			const current = modifiedAttributeScores.get("Intellect") ?? 0
			modifiedAttributeScores.set("Intellect", current + 1)
			break
		}
		case "Fighter": {
			const current = modifiedAspectScores.get("Fire") ?? 0
			modifiedAspectScores.set("Fire", current + 1)
			break
		}
	}

	switch (selectedLineage) {
		case "Umbral": {
			const current = modifiedAspectScores.get("Darkness") ?? 0
			modifiedAspectScores.set("Darkness", current + 1)
			break
		}
		case "Arthropod": {
			const current = modifiedAttributeScores.get("Sense") ?? 0
			modifiedAttributeScores.set("Sense", current + 1)
			break
		}
		case "Avian": {
			const current = modifiedAspectScores.get("Wind") ?? 0
			modifiedAspectScores.set("Wind", current + 1)
			break
		}
		case "Aquatic": {
			const current = modifiedAspectScores.get("Water") ?? 0
			modifiedAspectScores.set("Water", current + 1)
			break
		}
		case "Scalebearer":
			hitsMod += 3
			break
		case "Furbearer": {
			const current = modifiedAttributeScores.get("Dexterity") ?? 0
			modifiedAttributeScores.set("Dexterity", current + 1)
			break
		}
	}

	const attributePointsAssigned = sum(Object.values(attributeScores))
	const aspectPointsAssigned = sum(Object.values(aspectScores))

	const skillPointsAssigned = sum(
		Object.entries(character.data)
			.filter((entry) => entry[0].startsWith("skill"))
			.map((entry) => safeParseNumber(entry[1]) ?? 0),
	)

	const maxHits =
		(modifiedAttributeScores.get("Strength") ?? 0) +
		(modifiedAttributeScores.get("Dexterity") ?? 0) +
		3 +
		hitsMod

	const maxFatigue =
		(modifiedAttributeScores.get("Sense") ?? 0) +
		(modifiedAttributeScores.get("Intellect") ?? 0) +
		(modifiedAttributeScores.get("Presence") ?? 0) +
		fatigueMod

	const shared = useQuery(api.characters.get, { key: character.key, roomId })
	const updateShared = useMutation(api.characters.update)

	function handleChange(patch: Partial<Character>) {
		const newCharacter = { ...character, ...patch }
		onChange(newCharacter)
		if (shared) {
			updateShared({ characterId: shared._id, data: newCharacter })
		}
	}

	function handleDataChange(newData: Character["data"]) {
		handleChange({ data: { ...character.data, ...newData } })
	}

	const bindString = (key: keyof Character["data"]) => ({
		value: String(character.data[key] || ""),
		onChange: (event: ChangeEvent<{ value: string }>) =>
			handleDataChange({ [key]: event.target.value }),
	})

	const bindNumber = (key: keyof Character["data"], fallback = 0) => {
		return {
			value: safeParseNumber(character.data[key]) ?? fallback,
			onChange: (value: number) => handleDataChange({ [key]: value }),
		}
	}

	const prefillAspectsRoll = (count: number) => {
		chatInputRef.current?.prefill(`/roll aspects ${count}`)
	}

	const handleAttributeSkillClick = (
		skillName: string,
		attributeName: string,
	) => {
		// Use the modified attribute score that includes persona/lineage bonuses
		const attributeValue = modifiedAttributeScores.get(attributeName) ?? 0
		const skillValue =
			safeParseNumber(character.data[`skill:${skillName}`]) ?? 0
		const total = attributeValue + skillValue
		chatInputRef.current?.prefill(`/roll aspects ${total}`)
	}

	const handleAspectSkillClick = (skillName: string, aspectName: string) => {
		// Use the modified aspect score that includes persona/lineage bonuses
		const aspectValue = modifiedAspectScores.get(aspectName) ?? 0
		const skillValue =
			safeParseNumber(character.data[`skill:${skillName}`]) ?? 0
		const total = aspectValue + skillValue

		if (total > 0) {
			chatInputRef.current?.prefill(`/roll aspects ${total}`)
		}
	}

	const attributeErrors: string[] = []
	if (attributePointsAssigned < 15) {
		attributeErrors.push("You must assign exactly 15 attribute points.")
	} else if (attributePointsAssigned > 15) {
		attributeErrors.push("You have assigned more than 15 attribute points.")
	}
	const attributeValues = Object.values(attributeScores)
	if (!attributeValues.includes(5)) {
		attributeErrors.push("At least one attribute must have 5 points.")
	}
	if (!attributeValues.some((v) => v <= 2)) {
		attributeErrors.push("At least one attribute must have 2 or fewer points.")
	}

	const aspectErrors: string[] = []
	if (aspectPointsAssigned < 10) {
		aspectErrors.push("You must assign exactly 10 aspect points.")
	} else if (aspectPointsAssigned > 10) {
		aspectErrors.push("You have assigned more than 10 aspect points.")
	}
	const aspectValues = Object.values(aspectScores)
	if (!aspectValues.some((v) => v >= 4)) {
		aspectErrors.push("At least one aspect must have 4 or more points.")
	}
	if (!aspectValues.some((v) => v <= 1)) {
		aspectErrors.push("At least one aspect must have 1 or fewer points.")
	}

	const tabs = [
		{
			name: "Profile",
			content: (
				<div className="flex flex-col gap-6">
					<div>
						<TextAreaField label="Items" {...bindString("items")} />
						<p className="text-sm">
							Carrying capacity:{" "}
							{(() => {
								const strengthScore =
									modifiedAttributeScores.get("Strength") ?? 0
								const endurePoints =
									safeParseNumber(character.data["skill:Endure"]) ?? 0
								const total = strengthScore + endurePoints + 4
								return (
									<>
										<strong className="font-medium">{total}</strong>{" "}
										<aside className="inline text-gray-300 italic">{`(Strength ${strengthScore} + Endure ${endurePoints} + 4)`}</aside>
									</>
								)
							})()}
						</p>
					</div>

					<SelectField
						label="Persona"
						options={personaList.map((p) => ({
							value: p.persona,
							label: p.persona,
							description: (
								<>
									<em>{p.description}</em>
									<p>Ability: {p.ability}</p>
								</>
							),
						}))}
						{...bindString("persona")}
					/>

					<SelectField
						label="Lineage"
						options={lineageList.map((l) => ({
							value: l.lineage,
							label: l.lineage,
							description: (
								<>
									<em>Examples: {l.memberCreatures}</em>
									<p>Ability: {l.ability}</p>
								</>
							),
						}))}
						{...bindString("lineage")}
					/>

					<TextAreaField label="Details" {...bindString("details")} />
				</div>
			),
		},
		{
			name: "Scores",
			content: (
				<div className="grid gap-6 sm:grid-cols-2">
					<Section heading={`Attributes (${attributePointsAssigned}/15)`}>
						<div className={"flex flex-col gap-2"}>
							{attributeList
								.toSorted(
									(a, b) =>
										attributeOrder.indexOf(a.attribute) -
										attributeOrder.indexOf(b.attribute),
								)
								.map((item) => {
									const baseValue =
										safeParseNumber(
											character.data[`attribute:${item.attribute}`],
										) ?? 1

									const modifiedValue =
										modifiedAttributeScores.get(item.attribute) ?? baseValue
									const bonusText =
										modifiedValue > baseValue ?
											` (+${modifiedValue - baseValue})`
										:	""

									return (
										<StatField
											key={item.attribute}
											label={`${item.attribute}${bonusText}`}
											min={1}
											max={5}
											onLabelClick={() => prefillAspectsRoll(modifiedValue)}
											{...bindNumber(`attribute:${item.attribute}`, 1)}
										/>
									)
								})}
						</div>

						{attributeErrors.length > 0 && (
							<ErrorList errors={attributeErrors} />
						)}
					</Section>

					<Section heading={`Aspects (${aspectPointsAssigned}/10)`}>
						<div className={"flex flex-col gap-2"}>
							{aspectList
								.toSorted(
									(a, b) =>
										aspectOrder.indexOf(a.name) - aspectOrder.indexOf(b.name),
								)
								.map((item) => {
									const baseValue =
										safeParseNumber(character.data[`aspect:${item.name}`]) ?? 0

									const modifiedValue =
										modifiedAspectScores.get(item.name) ?? baseValue
									const bonusText =
										modifiedValue > baseValue ?
											` (+${modifiedValue - baseValue})`
										:	""

									return (
										<StatField
											key={item.name}
											label={`${item.name}${bonusText}`}
											min={0}
											max={5}
											fadedLabel={modifiedValue === 0}
											onLabelClick={
												modifiedValue > 0 ?
													() => prefillAspectsRoll(modifiedValue)
												:	undefined
											}
											{...bindNumber(`aspect:${item.name}`, 0)}
										/>
									)
								})}
						</div>

						{aspectErrors.length > 0 && <ErrorList errors={aspectErrors} />}
					</Section>
				</div>
			),
		},
		{
			name: "Skills",
			content: (
				<div className="grid gap-6 sm:grid-cols-2">
					<div className="col-span-full">
						{skillPointsAssigned}/3 skill points used
					</div>

					<Section heading="Skills">
						{skillList
							.toSorted((a, b) => a.skill.localeCompare(b.skill))
							.map((skill) => {
								const attributeValue =
									modifiedAttributeScores.get(skill.attribute) ?? 0
								const skillValue =
									safeParseNumber(character.data[`skill:${skill.skill}`]) ?? 0
								const total = attributeValue + skillValue

								// Create tooltip content
								let tooltip = null
								if (skill.effect || skill.flavor) {
									tooltip = (
										<div className="space-y-2">
											{skill.effect && <div>{skill.effect}</div>}
											{skill.flavor && (
												<div className="italic">{skill.flavor}</div>
											)}
										</div>
									)
								}

								return (
									<StatField
										key={skill.skill}
										label={`${skill.skill} (${skill.attribute} - ${total})`}
										tooltip={tooltip}
										max={3}
										onLabelClick={() =>
											handleAttributeSkillClick(skill.skill, skill.attribute)
										}
										{...bindNumber(`skill:${skill.skill}`)}
									/>
								)
							})}
					</Section>

					<Section heading="Aspect Skills">
						{aspectSkillList
							.toSorted((a, b) => a.modifier.localeCompare(b.modifier))
							.map((skill) => {
								const aspectValue = modifiedAspectScores.get(skill.aspect) ?? 0
								const skillValue =
									safeParseNumber(character.data[`skill:${skill.modifier}`]) ??
									0
								const total = aspectValue + skillValue

								// Create tooltip content
								const tooltip =
									skill.description ? <div>{skill.description}</div> : null

								return (
									<StatField
										key={skill.modifier}
										label={`${skill.modifier} (${skill.aspect} - ${total})`}
										tooltip={tooltip}
										max={3}
										fadedLabel={total === 0}
										onLabelClick={
											total > 0 ?
												() =>
													handleAspectSkillClick(skill.modifier, skill.aspect)
											:	undefined
										}
										{...bindNumber(`skill:${skill.modifier}`)}
									/>
								)
							})}
					</Section>
				</div>
			),
		},
		{
			name: "Bonds",
			content: (
				<BondSection
					bonds={character.bonds ?? []}
					onChange={(bonds) => handleChange({ bonds })}
				/>
			),
		},
	]

	return (
		<div
			className={twMerge(
				"flex h-full min-h-0 flex-col overflow-y-auto [scrollbar-gutter:stable]",
				className,
			)}
		>
			<Ariakit.TabProvider>
				<div className={"sticky top-0 flex flex-col bg-gray-900"}>
					<div className="grid gap-3">
						<InputField
							label="Name"
							value={character.name}
							onChange={(event) => handleChange({ name: event.target.value })}
						/>

						<div className="grid auto-cols-fr grid-flow-col gap-3">
							{/* <div className="flex aspect-square h-32 items-center justify-center rounded-lg bg-gray-950/50">
					<Icon icon="mingcute:pic-line" className="size-24 text-gray-700" />
				</div> */}

							<Field
								label={`Hits / ${maxHits}${hitsMod > 0 ? ` (+${hitsMod})` : ""}`}
								htmlFor="hits"
							>
								<NumberInput id="hits" {...bindNumber("hits")} />
							</Field>
							<Field label="Hits Bonus" htmlFor="hitsBonus">
								<NumberInput id="hitsBonus" {...bindNumber("hitsMax")} />
							</Field>

							<Field
								label={`Fatigue / ${maxFatigue}${fatigueMod > 0 ? ` (+${fatigueMod})` : ""}`}
								htmlFor="fatigue"
							>
								<NumberInput id="fatigue" {...bindNumber("fatigue")} />
							</Field>
							<Field label="Fatigue Bonus" htmlFor="fatigueBonus">
								<NumberInput id="fatigueBonus" {...bindNumber("fatigueMax")} />
							</Field>
						</div>

						<ShareCheckbox character={character} roomId={roomId} />
					</div>

					<Ariakit.TabList className="my-4 grid auto-cols-fr grid-flow-col gap-1 rounded-md bg-gray-950/25 p-1">
						{tabs.map((tab) => (
							<Ariakit.Tab
								key={tab.name}
								id={tab.name}
								className="rounded px-3 py-1.5 text-gray-400 transition hover:text-gray-100 aria-selected:bg-white/10 aria-selected:text-white"
							>
								{tab.name}
							</Ariakit.Tab>
						))}
					</Ariakit.TabList>
				</div>

				{tabs.map((tab) => (
					<Ariakit.TabPanel key={tab.name} id={tab.name}>
						{tab.content}
					</Ariakit.TabPanel>
				))}
			</Ariakit.TabProvider>
		</div>
	)
}

function getBondAspectBonus(bondStrengthSum: number) {
	const bonuses = [
		{ min: Number.NEGATIVE_INFINITY, max: -5, aspect: "Darkness" },
		{ min: -4, max: -2, aspect: "Fire" },
		{ min: -1, max: 1, aspect: "Wind" },
		{ min: 2, max: 4, aspect: "Water" },
		{ min: 5, max: Number.POSITIVE_INFINITY, aspect: "Light" },
	]

	const bonus = bonuses.find(
		(b) => bondStrengthSum >= b.min && bondStrengthSum < b.max,
	)

	return bonus?.aspect
}

// Shared characters exist in the cloud, are visible to others in the room,
// and can only be updated by the owner.
// A character is un-shared if they don't exist in the cloud.
function ShareCheckbox({
	character,
	roomId,
}: {
	character: Character
	roomId: Id<"rooms">
}) {
	const existing = useQuery(api.characters.get, { key: character.key, roomId })
	const create = useMutation(api.characters.create)
	const remove = useMutation(api.characters.remove)
	const [pending, startTransition] = useTransition()
	const id = useId()

	function handleChange(event: ChangeEvent<HTMLInputElement>) {
		// assign checked now so we don't try to access a stale event asynchronously
		const { checked } = event.target

		startTransition(async () => {
			try {
				if (checked && !existing) {
					await create({ ...character, roomId })
				}
				if (!checked && existing) {
					await remove({ characterId: existing._id })
				}
			} catch (error) {
				console.error("Error updating character:", error)
			}
		})
	}

	return (
		<div className="flex items-center gap-2">
			<input
				id={id}
				type="checkbox"
				className="size-5 accent-primary-300"
				disabled={pending}
				checked={existing != null}
				onChange={handleChange}
			/>
			<label htmlFor={id} className="font-medium">
				Share with others
			</label>
		</div>
	)
}

function BondSection({
	bonds,
	onChange,
}: {
	bonds: CharacterBond[]
	onChange: (bonds: CharacterBond[]) => void
}) {
	const strengthTotal = sum(bonds.map((bond) => bond.strength))
	const aspectBonus = getBondAspectBonus(strengthTotal)
	return (
		<section aria-label="Bonds">
			<header className="mb-0.5 flex items-center justify-between">
				<h3 className="text-sm font-semibold">Bonds</h3>
				<p className="text-sm">
					Total: {strengthTotal} (+1 {aspectBonus})
				</p>
			</header>

			<div className="flex flex-col gap-3">
				{bonds.map((bond, index) => (
					<BondSectionItem
						key={index}
						bond={bond}
						onChange={(bond) => {
							onChange(bonds.with(index, bond))
						}}
						onRemove={() => {
							onChange(bonds.filter((_, i) => i !== index))
						}}
					/>
				))}

				<button
					type="button"
					className="w-full rounded border border-gray-800 bg-gray-950/25 px-3 py-2 hover:bg-gray-800/25"
					onClick={() => {
						onChange([...bonds, { name: "", description: "", strength: 0 }])
					}}
				>
					Add Bond
				</button>
			</div>
		</section>
	)
}

function BondSectionItem({
	bond,
	onChange,
	onRemove,
}: {
	bond: CharacterBond
	onChange: (bond: CharacterBond) => void
	onRemove: () => void
}) {
	const strengthId = useId()
	return (
		<div className="rounded border border-gray-800 bg-gray-950/25 p-3">
			<div className="mb-2 flex items-center justify-between">
				<InputField
					label="Name"
					className="flex-1"
					autoFocus
					value={bond.name}
					onChange={(event) => {
						onChange({ ...bond, name: event.target.value })
					}}
				/>

				<div className="ml-3 flex items-end gap-2">
					<Field label="Strength" htmlFor={strengthId} className="w-20">
						<NumberInput
							id={strengthId}
							min={-3}
							max={3}
							value={bond.strength || 0}
							onChange={(value) => {
								onChange({ ...bond, strength: value })
							}}
						/>
					</Field>

					<button
						type="button"
						className="ml-2 h-9 rounded border border-gray-800 bg-gray-950/25 px-3 text-sm hover:bg-gray-800/25"
						onClick={() => onRemove()}
					>
						Remove
					</button>
				</div>
			</div>

			<TextAreaField
				label="Description"
				value={bond.description}
				onChange={(event) => {
					onChange({ ...bond, description: event.target.value })
				}}
			/>
		</div>
	)
}

function Section({
	className,
	heading,
	children,
	...props
}: ComponentProps<"section"> & { heading: ReactNode }) {
	return (
		<Ariakit.HeadingLevel>
			<section {...props} className={twMerge("flex flex-col gap-3", className)}>
				<Ariakit.Heading className="text-xl font-light">
					{heading}
				</Ariakit.Heading>
				{children}
			</section>
		</Ariakit.HeadingLevel>
	)
}

function InputField({
	className,
	label,
	...props
}: ComponentProps<"input"> & { label: ReactNode }) {
	const id = useId()
	return (
		<Field className={className} label={label} htmlFor={id}>
			<Input id={id} {...props} />
		</Field>
	)
}

function StatField({
	className,
	label,
	onLabelClick,
	fadedLabel,
	tooltip,
	...props
}: ComponentProps<typeof NumberInput> & {
	label: ReactNode
	onLabelClick?: () => void
	fadedLabel?: boolean
	tooltip?: ReactNode
}) {
	const id = useId()

	const labelContent = (
		<label
			htmlFor={id}
			className={twMerge(
				"flex-1 font-semibold",
				fadedLabel && "text-gray-400",
				onLabelClick && "transition-colors hover:text-primary-300",
			)}
			onClick={(event) => {
				if (onLabelClick) {
					event.preventDefault()
					onLabelClick()
				}
			}}
		>
			{label}
		</label>
	)

	return (
		<div className={twMerge("flex items-center gap-3", className)}>
			{tooltip ?
				<Tooltip content={tooltip} className="flex-1">
					{labelContent}
				</Tooltip>
			:	labelContent}
			<NumberInput id={id} className="w-10 text-center" {...props} />
		</div>
	)
}

function TextAreaField({
	className,
	label,
	...props
}: ComponentProps<"textarea"> & { label: ReactNode }) {
	const id = useId()
	return (
		<Field className={className} label={label} htmlFor={id}>
			<TextArea id={id} {...props} />
		</Field>
	)
}

function SelectField({
	className,
	label,
	options,
	...props
}: ComponentProps<"select"> & {
	label: ReactNode
	options: Array<{ value: string; label: string; description?: ReactNode }>
}) {
	const id = useId()
	return (
		<Field className={className} label={label} htmlFor={id}>
			<Select id={id} options={options} {...props} />
			<div className="mt-1 text-sm font-medium">
				{options.find((opt) => opt.value === props.value)?.description}
			</div>
		</Field>
	)
}

function Field({
	className,
	label,
	children,
	...props
}: ComponentProps<"label"> & { label: ReactNode }) {
	return (
		<div className={className}>
			<label {...props} className="mb-0.5 block text-sm font-semibold">
				{label}
			</label>
			{children}
		</div>
	)
}

function Input({ className, ...props }: ComponentProps<"input">) {
	const id = useId()
	return (
		<input
			id={id}
			className={twMerge(
				"h-9 w-full rounded border border-gray-800 bg-gray-950/25 px-3 focus:border-gray-700 focus:bg-gray-950/25 focus:outline-none",
				className,
			)}
			{...props}
		/>
	)
}

function TextArea({ className, ...props }: ComponentProps<"textarea">) {
	const id = useId()
	return (
		<textarea
			id={id}
			className={twMerge(
				"field-sizing-content min-h-9 w-full rounded border border-gray-800 bg-gray-950/25 px-3 py-2 focus:border-gray-700 focus:bg-gray-950/25 focus:outline-none",
				className,
			)}
			{...props}
		/>
	)
}

function Select({
	className,
	options,
	value,
	onChange,
	...props
}: ComponentProps<"select"> & {
	options: Array<{ value: string; label: string }>
}) {
	return (
		<select
			className={twMerge(
				"h-9 w-full rounded border border-gray-800 bg-gray-950/25 px-3 focus:border-gray-700 focus:bg-gray-950/25 focus:outline-none",
				className,
			)}
			value={value}
			onChange={onChange}
			{...props}
		>
			<option value="">Select a persona...</option>
			{options.map((option) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
	)
}

function ErrorList(props: {
	errors: string | Iterable<string> | undefined | null
}) {
	const errors = new Set(
		props.errors == null ? []
		: typeof props.errors === "string" ? [props.errors]
		: [...props.errors],
	)

	if (errors.size === 0) return null

	return (
		<Ariakit.HeadingLevel>
			<Ariakit.Heading className="sr-only">Errors</Ariakit.Heading>
			<ul className="mt-2 text-red-400">
				{[...errors].map((error, index) => (
					<li key={index}>{error}</li>
				))}
			</ul>
		</Ariakit.HeadingLevel>
	)
}

function NumberInput({
	id,
	className,
	value,
	min = 0,
	max = Number.POSITIVE_INFINITY,
	onChange,
}: {
	id?: string
	className?: string
	value: number
	min?: number
	max?: number
	onChange: (value: number) => void
}) {
	const [editing, setEditing] = useState(false)
	return (
		<div className={twMerge("text-center", className)}>
			{editing ?
				<input
					id={id}
					inputMode="numeric"
					className="h-9 w-full rounded border border-gray-800 bg-gray-950/25 px-3 text-center focus:border-gray-700 focus:bg-gray-950/25 focus:outline-none"
					defaultValue={value}
					autoFocus
					onFocus={(event) => {
						event.currentTarget.select()
					}}
					onBlur={(event) => {
						onChange(clamp(Number(event.currentTarget.value) || 0, min, max))
						setEditing(false)
					}}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault()
							onChange(clamp(Number(event.currentTarget.value) || 0, min, max))
							setEditing(false)
						}
						if (event.key === "ArrowUp") {
							event.preventDefault()
							event.currentTarget.value = String(
								clamp((Number(event.currentTarget.value) || 0) + 1, min, max),
							)
						}
						if (event.key === "ArrowDown") {
							event.preventDefault()
							event.currentTarget.value = String(
								clamp((Number(event.currentTarget.value) || 0) - 1, min, max),
							)
						}
					}}
				/>
			:	<button
					id={id}
					type="button"
					className="h-9 w-full rounded border border-gray-800 bg-gray-950/25 px-3 focus:border-gray-700 focus:bg-gray-950/25 focus:outline-none"
					onClick={() => setEditing(true)}
					onFocus={() => setEditing(true)}
				>
					{value}
				</button>
			}
		</div>
	)
}
