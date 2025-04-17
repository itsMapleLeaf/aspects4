import * as Ariakit from "@ariakit/react"
import { useMutation, useQuery } from "convex/react"
import { clamp } from "es-toolkit"
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
import {
	createCharacterModel,
	getAspects,
	getAttributes,
	type Character,
	type CharacterBond,
} from "~/lib/character.ts"
import { safeParseNumber } from "~/lib/utils.ts"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import aspectSkillList from "../data/list-of-aspect-skills.json"
import lineageList from "../data/list-of-lineages.json"
import personaList from "../data/list-of-personas.json"
import skillList from "../data/list-of-skills.json"
import { CharacterRestButton } from "./CharacterRestButton.tsx"
import { ChatInputRef } from "./Chat.tsx"
import { Button } from "./ui/Button.tsx"
import { Icon } from "./ui/Icon.tsx"
import { Tooltip } from "./ui/Tooltip.tsx"

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
	const model = createCharacterModel(character)

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

	const bindNumber = (key: keyof Character["data"], fallback = 0) => ({
		value: safeParseNumber(character.data[key]) ?? fallback,
		onChange: (value: number) => handleDataChange({ [key]: value }),
	})

	const prefillAspectsRoll = (count: number) => {
		chatInputRef.current?.prefill(`/roll aspects ${count}`)
	}

	const handleAttributeSkillClick = (skillName: string) => {
		chatInputRef.current?.prefill(
			`/roll aspects ${model.getSkillScore(skillName)}`,
		)
	}

	const handleAspectSkillClick = (skillName: string, aspectName: string) => {
		// Use the modified aspect score that includes persona/lineage bonuses
		const aspectValue = model.getAspectScore(aspectName) ?? 0
		const skillValue =
			safeParseNumber(character.data[`skill:${skillName}`]) ?? 0
		const total = aspectValue + skillValue

		if (total > 0) {
			chatInputRef.current?.prefill(`/roll aspects ${total}`)
		}
	}

	const attributeErrors: string[] = []
	if (model.attributePointsAssigned < 15) {
		attributeErrors.push("You must assign exactly 15 attribute points.")
	} else if (model.attributePointsAssigned > 15) {
		attributeErrors.push("You have assigned more than 15 attribute points.")
	}
	const attributeValues = Object.values(model.attributeScores)
	if (!attributeValues.includes(5)) {
		attributeErrors.push("At least one attribute must have 5 points.")
	}
	if (!attributeValues.some((v) => v <= 2)) {
		attributeErrors.push("At least one attribute must have 2 or fewer points.")
	}

	const aspectErrors: string[] = []
	if (model.aspectPointsAssigned < 10) {
		aspectErrors.push("You must assign exactly 10 aspect points.")
	} else if (model.aspectPointsAssigned > 10) {
		aspectErrors.push("You have assigned more than 10 aspect points.")
	}
	const aspectValues = Object.values(model.aspectScores)
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
								const strengthScore = model.getAttributeScore("Strength")
								const endurePoints = model.getSkillPoints("Endure")
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
						placeholder="Choose a persona..."
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
						placeholder="Choose a lineage..."
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
					<Section heading={`Attributes (${model.attributePointsAssigned}/15)`}>
						<div className={"flex flex-col gap-2"}>
							{getAttributes().map((item) => {
								const baseValue =
									safeParseNumber(
										character.data[`attribute:${item.attribute}`],
									) ?? 1

								const modifiedValue =
									model.modifiedAttributeScores.get(item.attribute) ?? baseValue
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

					<Section heading={`Aspects (${model.aspectPointsAssigned}/10)`}>
						<div className={"flex flex-col gap-2"}>
							{getAspects().map((item) => {
								const baseValue =
									safeParseNumber(character.data[`aspect:${item.name}`]) ?? 0

								const modifiedValue =
									model.modifiedAspectScores.get(item.name) ?? baseValue
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
						{model.skillPointsAssigned}/3 skill points used
					</div>

					<Section heading="Skills">
						{skillList
							.toSorted((a, b) => a.skill.localeCompare(b.skill))
							.map((skill) => {
								const attributeValue =
									model.modifiedAttributeScores.get(skill.attribute) ?? 0
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
										onLabelClick={() => handleAttributeSkillClick(skill.skill)}
										{...bindNumber(`skill:${skill.skill}`)}
									/>
								)
							})}
					</Section>

					<Section heading="Aspect Skills">
						{aspectSkillList
							.toSorted((a, b) => a.modifier.localeCompare(b.modifier))
							.map((skill) => {
								const aspectValue =
									model.modifiedAspectScores.get(skill.aspect) ?? 0
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
						<div className="flex items-end gap-2">
							<InputField
								label="Name"
								className="flex-1"
								value={character.name}
								onChange={(event) => handleChange({ name: event.target.value })}
							/>

							<Field
								label="Bond Activations"
								htmlFor="bondActivations"
								className="w-32"
							>
								<NumberInput
									id="bondActivations"
									min={0}
									{...bindNumber("bondActivations", 3)}
								/>
							</Field>

							<CharacterRestButton
								onSubmit={(hourCount) => {
									let fatigue = safeParseNumber(character.data.fatigue) ?? 0
									if (hourCount >= 8) {
										fatigue = 0
									} else {
										fatigue -= hourCount
									}
									handleDataChange({ fatigue, bondActivations: 3 })
								}}
							/>
						</div>

						<div className="grid auto-cols-fr grid-flow-col gap-3">
							{/* <div className="flex aspect-square h-32 items-center justify-center rounded-lg bg-gray-950/50">
								<Icon icon="mingcute:pic-line" className="size-24 text-gray-700" />
							</div> */}

							{/* IDEA: style this as a dot bar type thing */}
							<Field
								label={`Hits / ${model.hitsMax}${model.hitsBonus > 0 ? ` (+${model.hitsBonus})` : ""}`}
								htmlFor="hits"
							>
								<NumberInput id="hits" {...bindNumber("hits")} />
							</Field>
							<Field label="Hits Bonus" htmlFor="hitsBonus">
								<NumberInput id="hitsBonus" {...bindNumber("hitsMax")} />
							</Field>

							<Field
								label={`Fatigue / ${model.fatigueMax}${model.fatigueBonus > 0 ? ` (+${model.fatigueBonus})` : ""}`}
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
		<Checkbox
			label="Share with others"
			disabled={pending}
			checked={existing != null}
			onChange={handleChange}
		/>
	)
}

function Checkbox({
	label,
	className,
	...props
}: { label: ReactNode } & ComponentProps<"input">) {
	const id = useId()
	return (
		<div className={twMerge("flex items-center gap-2", className)}>
			<input
				id={id}
				{...props}
				type="checkbox"
				className="size-5 accent-primary-300"
			/>
			<label htmlFor={props.id || id} className="font-medium">
				{label}
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
	return (
		<section aria-label="Bonds">
			<Ariakit.HeadingLevel>
				<Ariakit.Heading className="text-sm font-semibold">
					Bonds
				</Ariakit.Heading>

				<ul className="flex flex-col gap-3">
					{bonds.map((bond, index) => (
						<li key={index}>
							<BondSectionItem
								bond={bond}
								onChange={(bond) => {
									onChange(bonds.with(index, bond))
								}}
								onRemove={() => {
									onChange(bonds.filter((_, i) => i !== index))
								}}
							/>
						</li>
					))}

					<Button
						className="self-start"
						icon={<Icon icon="mingcute:heart-fill" />}
						onClick={() => {
							onChange([...bonds, { name: "", description: "", strength: 0 }])
						}}
					>
						Add Bond
					</Button>
				</ul>
			</Ariakit.HeadingLevel>
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
		<div className="grid gap-4 rounded border border-gray-800 bg-gray-950/25 p-3">
			<div className="flex items-end justify-between gap-2">
				<InputField
					label="Name"
					className="flex-1"
					autoFocus
					value={bond.name}
					onChange={(event) => {
						onChange({ ...bond, name: event.target.value })
					}}
				/>

				<Field label="Strength" htmlFor={strengthId} className="w-20">
					<NumberInput
						id={strengthId}
						min={1}
						max={5}
						value={clamp(bond.strength, 1, 5)}
						onChange={(value) => {
							onChange({ ...bond, strength: value })
						}}
					/>
				</Field>

				<Button
					onClick={() => onRemove()}
					icon={<Icon icon="mingcute:close-fill" />}
				>
					Remove
				</Button>
			</div>

			<SelectField
				label="Aura"
				placeholder="Choose an aura..."
				value={bond.aura || ""}
				onChange={(event) => onChange({ ...bond, aura: event.target.value })}
				options={[
					{
						label: "Fire",
						value: "Fire",
						description: `indicates an adversarial, heated, conflict-heavy relationship.`,
					},
					{
						label: "Water",
						value: "Water",
						description: `comes from notions of comfort, peace, and protection.`,
					},
					{
						label: "Wind",
						value: "Wind",
						description: `exhibits in turbulent relationships full of excitement and change.`,
					},
					{
						label: "Light",
						value: "Light",
						description: `represents diplomatic relationships built on fairness and respect.`,
					},
					{
						label: "Darkness",
						value: "Darkness",
						description: `manifests from tension, mistrust, and uncertainty.`,
					},
				]}
			/>

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
}: ComponentProps<typeof Select> & {
	label: ReactNode
}) {
	const id = useId()
	return (
		<Field className={className} label={label} htmlFor={id}>
			<Select id={id} options={options} {...props} />
			<div className="mt-1 text-sm font-medium empty:hidden">
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
	return (
		<input
			className={twMerge(
				"h-9 w-full rounded border border-gray-800 bg-gray-950/25 px-3 transition hover:border-gray-700 focus:border-primary-800 focus:bg-gray-950/25 focus:outline-none",
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
	placeholder,
	value,
	onChange,
	...props
}: ComponentProps<"select"> & {
	placeholder: string
	options: Array<{ value: string; label: string; description?: ReactNode }>
}) {
	return (
		<select
			className={twMerge(
				"h-9 w-full rounded border border-gray-800 bg-gray-950/25 px-3 focus:border-gray-700 focus:bg-gray-950/25 focus:outline-none",
				className,
			)}
			value={value || ""}
			onChange={onChange}
			{...props}
		>
			<option value="">{placeholder}</option>
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

	const wheelHandlerRef = (element: HTMLElement | null) => {
		const controller = new AbortController()

		element?.addEventListener(
			"wheel",
			(event) => {
				const tweak = (delta: number) => {
					event.preventDefault()

					const currentValue =
						event.target instanceof HTMLInputElement ?
							(safeParseNumber(event.target.value) ?? 0)
						:	value

					const newValue = clamp(currentValue + delta, min, max)

					if (event.target instanceof HTMLInputElement) {
						event.target.value = String(newValue)
					}

					onChange(newValue)
					setEditing(true)
				}

				if (event.deltaY < 0) tweak(1)
				if (event.deltaY > 0) tweak(-1)
			},
			{ signal: controller.signal, passive: false },
		)

		return () => controller.abort()
	}

	return (
		<div className={twMerge("text-center", className)}>
			{editing ?
				<Input
					id={id}
					className="text-center"
					inputMode="numeric"
					defaultValue={value}
					autoFocus
					ref={wheelHandlerRef}
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
							const newValue = clamp(
								(Number(event.currentTarget.value) || 0) + 1,
								min,
								max,
							)
							event.currentTarget.value = String(newValue)
							onChange(newValue)
						}
						if (event.key === "ArrowDown") {
							event.preventDefault()
							const newValue = clamp(
								(Number(event.currentTarget.value) || 0) - 1,
								min,
								max,
							)
							event.currentTarget.value = String(newValue)
							onChange(newValue)
						}
					}}
				/>
			:	<button
					id={id}
					type="button"
					className="h-9 w-full rounded border border-gray-800 bg-gray-950/25 px-3 focus:border-gray-700 focus:bg-gray-950/25 focus:outline-none"
					ref={wheelHandlerRef}
					onClick={() => setEditing(true)}
					onFocus={() => setEditing(true)}
				>
					{value}
				</button>
			}
		</div>
	)
}
