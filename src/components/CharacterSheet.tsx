import { clamp, sum } from "es-toolkit"
import {
	ComponentProps,
	ReactNode,
	RefObject,
	useId,
	useState,
	type ChangeEvent,
} from "react"
import { twMerge } from "tailwind-merge"
import type { Character } from "~/lib/character.ts"
import { safeParseNumber } from "~/lib/utils.ts"
import aspectSkillList from "../data/list-of-aspect-skills.json"
import aspectList from "../data/list-of-aspects.json"
import attributeList from "../data/list-of-attributes.json"
import skillList from "../data/list-of-skills.json"
import { ChatInputRef } from "./Chat.tsx"
import { Tooltip } from "./ui/Tooltip.tsx"
import { Icon } from "./ui/Icon.tsx"

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
	onNameChange,
	onDataChange,
}: {
	character: Character
	chatInputRef: RefObject<ChatInputRef | null>
	onNameChange: (name: Character["name"]) => void
	onDataChange: (data: Character["data"]) => void
}) {
	const attributeScores = {
		strength: safeParseNumber(character.data[`attribute:Strength`]) ?? 1,
		sense: safeParseNumber(character.data[`attribute:Sense`]) ?? 1,
		dexterity: safeParseNumber(character.data[`attribute:Dexterity`]) ?? 1,
		intellect: safeParseNumber(character.data[`attribute:Intellect`]) ?? 1,
		presence: safeParseNumber(character.data[`attribute:Presence`]) ?? 1,
	}

	const aspectScores = {
		fire: safeParseNumber(character.data[`aspect:Fire`]) ?? 0,
		water: safeParseNumber(character.data[`aspect:Water`]) ?? 0,
		wind: safeParseNumber(character.data[`aspect:Wind`]) ?? 0,
		light: safeParseNumber(character.data[`aspect:Light`]) ?? 0,
		darkness: safeParseNumber(character.data[`aspect:Darkness`]) ?? 0,
	}

	const attributePointsAssigned = sum(Object.values(attributeScores))
	const aspectPointsAssigned = sum(Object.values(aspectScores))

	const skillPointsAssigned = sum(
		Object.entries(character.data)
			.filter((entry) => entry[0].startsWith("skill"))
			.map((entry) => safeParseNumber(entry[1]) ?? 0),
	)

	const maxHits = attributeScores.strength + attributeScores.dexterity + 3

	const maxFatigue =
		attributeScores.sense + attributeScores.intellect + attributeScores.presence

	const bindString = (key: keyof Character["data"]) => ({
		value: String(character.data[key] || ""),
		onChange: (event: ChangeEvent<{ value: string }>) =>
			onDataChange({ [key]: event.target.value }),
	})

	const bindNumber = (key: keyof Character["data"], fallback = 0) => {
		return {
			value: safeParseNumber(character.data[key]) ?? fallback,
			onChange: (value: number) => onDataChange({ [key]: value }),
		}
	}

	const prefillAspectsRoll = (count: number) => {
		chatInputRef.current?.prefill(`/roll aspects ${count}`)
	}

	const handleAttributeSkillClick = (skillName: string, attributeName: string) => {
		const attributeValue = safeParseNumber(character.data[`attribute:${attributeName}`]) ?? 1
		const skillValue = safeParseNumber(character.data[`skill:${skillName}`]) ?? 0
		const total = attributeValue + skillValue
		chatInputRef.current?.prefill(`/roll aspects ${total}`)
	}

	const handleAspectSkillClick = (skillName: string, aspectName: string) => {
		const aspectValue = safeParseNumber(character.data[`aspect:${aspectName}`]) ?? 0
		const skillValue = safeParseNumber(character.data[`skill:${skillName}`]) ?? 0
		const total = aspectValue + skillValue
		
		if (total > 0) {
			chatInputRef.current?.prefill(`/roll aspects ${total}`)
		}
	}

	return (
		<div className={"flex flex-col gap-3"}>
			<div className="flex items-start gap-3">
				<div className="flex aspect-square h-32 items-center justify-center rounded-lg bg-gray-950/50">
					<Icon icon="mingcute:pic-line" className="size-24 text-gray-700" />
				</div>

				<InputField
					label="Name"
					className="flex-1"
					value={character.name}
					onChange={(event) => onNameChange(event.target.value)}
				/>

				<Field label={`Hits / ${maxHits}`} htmlFor="hits">
					<NumberInput id="hits" className="w-21" {...bindNumber("hits")} />
				</Field>

				<Field label={`Fatigue / ${maxFatigue}`} htmlFor="fatigue">
					<NumberInput
						id="fatigue"
						className="w-21"
						{...bindNumber("fatigue")}
					/>
				</Field>
			</div>

			<div className="grid gap-8 sm:grid-cols-2">
				<Section heading={`Attributes (${attributePointsAssigned}/15)`}>
					<div className={"flex flex-col gap-2"}>
						{attributeList
							.toSorted(
								(a, b) =>
									attributeOrder.indexOf(a.attribute) -
									attributeOrder.indexOf(b.attribute),
							)
							.map((item) => {
								const value =
									safeParseNumber(
										character.data[`attribute:${item.attribute}`],
									) ?? 1
								return (
									<StatField
										key={item.attribute}
										label={item.attribute}
										min={1}
										max={5}
										onLabelClick={() => prefillAspectsRoll(value)}
										{...bindNumber(`attribute:${item.attribute}`, 1)}
									/>
								)
							})}
					</div>
				</Section>

				<Section heading={`Aspects (${aspectPointsAssigned}/10)`}>
					<div className={"flex flex-col gap-2"}>
						{aspectList
							.toSorted(
								(a, b) =>
									aspectOrder.indexOf(a.name) - aspectOrder.indexOf(b.name),
							)
							.map((item) => {
								const value =
									safeParseNumber(character.data[`aspect:${item.name}`]) ?? 0
								return (
									<StatField
										key={item.name}
										label={item.name}
										min={0}
										max={5}
										fadedLabel={value === 0}
										onLabelClick={
											value > 0 ? () => prefillAspectsRoll(value) : undefined
										}
										{...bindNumber(`aspect:${item.name}`, 0)}
									/>
								)
							})}
					</div>
				</Section>

				<div className="col-span-full">
					{skillPointsAssigned}/3 skill points used
				</div>

				<Section heading="Skills">
					{skillList
						.toSorted((a, b) => a.skill.localeCompare(b.skill))
						.map((skill) => {
							const attributeValue = safeParseNumber(character.data[`attribute:${skill.attribute}`]) ?? 1
							
							// Create tooltip content
							let tooltip = null
							if (skill.effect || skill.flavor) {
								tooltip = (
									<div className="space-y-2">
										{skill.effect && <div>{skill.effect}</div>}
										{skill.flavor && <div className="italic">{skill.flavor}</div>}
									</div>
								)
							}
							
							return (
								<StatField
									key={skill.skill}
									label={`${skill.skill} (${skill.attribute}) (${attributeValue})`}
									tooltip={tooltip}
									max={3}
									onLabelClick={() => handleAttributeSkillClick(skill.skill, skill.attribute)}
									{...bindNumber(`skill:${skill.skill}`)}
								/>
							)
						})}
				</Section>

				<Section heading="Aspect Skills">
					{aspectSkillList
						.toSorted((a, b) => a.modifier.localeCompare(b.modifier))
						.map((skill) => {
							const aspectValue = safeParseNumber(character.data[`aspect:${skill.aspect}`]) ?? 0
							const skillValue = safeParseNumber(character.data[`skill:${skill.modifier}`]) ?? 0
							const total = aspectValue + skillValue
							
							// Create tooltip content
							const tooltip = skill.description ? (
								<div>{skill.description}</div>
							) : null
							
							return (
								<StatField
									key={skill.modifier}
									label={`${skill.modifier} (${skill.aspect}) (${aspectValue})`}
									tooltip={tooltip}
									max={3}
									fadedLabel={total === 0}
									onLabelClick={total > 0 ? () => handleAspectSkillClick(skill.modifier, skill.aspect) : undefined}
									{...bindNumber(`skill:${skill.modifier}`)}
								/>
							)
						})}
				</Section>
			</div>

			<div className="grid gap-2">
				<TextAreaField label="Items" {...bindString("items")} />
				<TextAreaField label="Bonds" {...bindString("bonds")} />
				<TextAreaField label="Persona" {...bindString("persona")} />
				<TextAreaField label="Lineage" {...bindString("lineage")} />
				<TextAreaField label="Details" {...bindString("details")} />
			</div>
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
		<section {...props} className={twMerge("flex flex-col gap-3", className)}>
			<h2 className="text-xl font-light">{heading}</h2>
			{children}
		</section>
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
				onLabelClick && "hover:text-primary-300",
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
			{tooltip ? (
				<Tooltip content={tooltip}>
					{labelContent}
				</Tooltip>
			) : (
				labelContent
			)}
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

function Field({
	className,
	label,
	children,
	...props
}: ComponentProps<"label"> & { label: ReactNode }) {
	return (
		<div className={className}>
			<label {...props} className="block text-sm font-semibold">
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
