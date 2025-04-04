import { ComponentProps, ReactNode, useId } from "react"
import { twMerge } from "tailwind-merge"
import aspectSkillList from "../data/list-of-aspect-skills.json"
import aspectList from "../data/list-of-aspects.json"
import attributeList from "../data/list-of-attributes.json"
import skillList from "../data/list-of-skills.json"
import { Icon } from "./ui/Icon.tsx"

export function CharacterSheet() {
	return (
		<div className={"flex flex-col gap-3"}>
			<div className="flex items-start gap-3">
				<div className="flex aspect-square h-32 items-center justify-center rounded-lg bg-gray-950/50">
					<Icon icon="mingcute:pic-line" className="size-24 text-gray-700" />
				</div>

				<InputField label="Name" className="flex-1" />
				<InputField
					label="Hits"
					type="number"
					defaultValue={0}
					className="w-16"
				/>
				<InputField
					label="Fatigue"
					type="number"
					defaultValue={0}
					className="w-16"
				/>
			</div>

			<div className="grid gap-8 sm:grid-cols-2">
				<div className={"flex flex-col gap-2"}>
					{attributeList.map((item) => (
						<StatField
							key={item.attribute}
							label={item.attribute}
							defaultValue={1}
						/>
					))}
				</div>

				<div className={"flex flex-col gap-2"}>
					{aspectList.map((item) => (
						<StatField key={item.name} label={item.name} defaultValue={1} />
					))}
				</div>

				<Section heading="Skills">
					{skillList
						.toSorted((a, b) => a.skill.localeCompare(b.skill))
						.map((skill) => (
							<StatField
								key={skill.skill}
								label={`${skill.skill} (${skill.attribute})`}
								defaultValue={0}
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
								defaultValue={0}
							/>
						))}
				</Section>
			</div>

			<div className={"grid gap-2"}>
				<TextAreaField label="Items" />
				<TextAreaField label="Persona" />
				<TextAreaField label="Lineage" />
				<TextAreaField label="Bonds" />
				<TextAreaField label="Details" />
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
}: ComponentProps<"input"> & { label: ReactNode }) {
	const id = useId()
	return (
		<div className={twMerge("flex items-center gap-3", className)}>
			<label htmlFor={id} className="flex-1 font-semibold">
				{label}
			</label>
			<Input id={id} className="w-10 text-center" {...props} />
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
