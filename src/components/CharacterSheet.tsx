import { clamp, sum } from "es-toolkit"
import {
	ComponentProps,
	ReactNode,
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
	onNameChange,
	onDataChange,
}: {
	character: Character
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
							.map((item) => (
								<StatField
									key={item.attribute}
									label={item.attribute}
									min={1}
									max={5}
									{...bindNumber(`attribute:${item.attribute}`, 1)}
								/>
							))}
					</div>
				</Section>

				<Section heading={`Aspects (${aspectPointsAssigned}/10)`}>
					<div className={"flex flex-col gap-2"}>
						{aspectList
							.toSorted(
								(a, b) =>
									aspectOrder.indexOf(a.name) - aspectOrder.indexOf(b.name),
							)
							.map((item) => (
								<StatField
									key={item.name}
									label={item.name}
									min={0}
									max={5}
									{...bindNumber(`aspect:${item.name}`, 0)}
								/>
							))}
					</div>
				</Section>

				<div className="col-span-full">
					{skillPointsAssigned}/3 skill points used
				</div>

				<Section heading="Core Skills">
					{skillList
						.toSorted((a, b) => a.skill.localeCompare(b.skill))
						.map((skill) => (
							<StatField
								key={skill.skill}
								label={`${skill.skill} (${skill.attribute})`}
								max={3}
								{...bindNumber(`skill:${skill.skill}`)}
							/>
						))}
				</Section>

				<Section heading="Aspect Skills">
					{aspectSkillList
						.toSorted((a, b) => a.modifier.localeCompare(b.modifier))
						.map((skill) => (
							<StatField
								key={skill.modifier}
								label={`${skill.modifier} (${skill.aspect})`}
								max={3}
								{...bindNumber(`skill:${skill.modifier}`)}
							/>
						))}
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
	...props
}: ComponentProps<typeof NumberInput> & { label: ReactNode }) {
	const id = useId()
	return (
		<div className={twMerge("flex items-center gap-3", className)}>
			<label htmlFor={id} className="flex-1 font-semibold">
				{label}
			</label>
			<NumberInput className="w-10 text-center" {...props} />
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
