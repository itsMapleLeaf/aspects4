import * as Ariakit from "@ariakit/react"
import { uniqBy } from "es-toolkit"
import { ReactNode, use, useState } from "react"
import { ResolvedAspectSkillFields } from "~/characters/aspect-skills"
import { ASPECT_ATTRIBUTES } from "~/characters/data.ts"
import { resolveCharacterScores } from "~/characters/scores.ts"
import {
	SheetSelectField,
	SheetTextField,
} from "~/characters/sheet/components.tsx"
import {
	createResolvedListItemContext,
	resolveListField,
} from "~/characters/sheet/fields.ts"
import { SheetListField } from "~/characters/sheet/SheetListField.tsx"
import { Badge, BadgeColor } from "~/components/ui/Badge.tsx"
import { Button } from "~/components/ui/Button.tsx"
import { Icon } from "~/components/ui/Icon.tsx"
import { Tooltip } from "~/components/ui/Tooltip.tsx"
import ASPECTS from "~/data/list-of-aspects.json"
import { ChatInputContext } from "../components/ChatInputContext.tsx"
import { resolveAspectSkillFields } from "./aspect-skills.ts"
import { useEditorCharacterSheet } from "./context.tsx"

export function AspectSkillsList() {
	const sheet = useEditorCharacterSheet()
	const resolvedList = resolveListField(sheet, "aspectSkills")

	const [mode, setMode] = useState<"view" | "edit">(
		resolvedList.items.length === 0 ? "edit" : "view",
	)

	if (mode === "edit") {
		return (
			<section>
				<SheetListField resolved={resolvedList}>
					{(listContext) => (
						<AspectSkillForm fields={resolveAspectSkillFields(listContext)} />
					)}
				</SheetListField>
			</section>
		)
	}

	return (
		<div className="mb-4 grid gap-4">
			<div className="contents">
				{resolvedList.items.map((item, index) => (
					<AspectSkillCard
						key={index}
						fields={resolveAspectSkillFields(
							createResolvedListItemContext(item, resolvedList, index),
						)}
					/>
				))}
			</div>

			<div>
				<Button
					icon={<Icon icon="mingcute:pencil-fill" />}
					onClick={() => setMode("edit")}
				>
					Edit
				</Button>
			</div>
		</div>
	)
}

function AspectSkillForm({ fields }: { fields: ResolvedAspectSkillFields }) {
	return (
		<div className="grid gap-2">
			<div className="flex gap-2">
				<SheetTextField className="flex-1" resolved={fields.name} />
				<SheetSelectField
					className="w-44"
					placeholder="Choose an aspect"
					resolved={fields.aspect}
				/>
				{/* <SheetNumberField className="w-24" resolved={fields.points} /> */}
			</div>
			{/* <div className="flex gap-2">
				<SheetSelectField className="w-40" resolved={fields.type} />
				<SheetTextField className="flex-1" resolved={fields.modifiers} />
			</div> */}
			<SheetTextField multiline resolved={fields.description} />
		</div>
	)
}

function AspectSkillCard({ fields }: { fields: ResolvedAspectSkillFields }) {
	const sheet = useEditorCharacterSheet()
	const scores = resolveCharacterScores(sheet)

	const aspectAttribute = ASPECT_ATTRIBUTES[fields.aspect.value]
	const attributeScore = aspectAttribute ? scores.scoreOf(aspectAttribute) : 1
	const totalScore = attributeScore + fields.points.value

	const chatInputRef = use(ChatInputContext)
	return (
		<Ariakit.HeadingLevel>
			<section aria-label={fields.name.value}>
				{/* <EditableNumber
					className="float-right mt-1 ml-4 w-12"
					aria-label={`Skill Points for ${fields.name.value}`}
					min={0}
					value={fields.points.value}
					onChange={(value) => {
						fields.points.context.updateValue(fields.points.id, value)
					}}
				/> */}
				<Ariakit.Heading>
					<button
						type="button"
						onClick={() => {
							chatInputRef.current?.prefill(
								`/roll aspects ${totalScore} [${fields.name.value}]`,
							)
						}}
						className="text-lg font-semibold transition hover:text-primary-300"
					>
						{fields.name.value} ({totalScore})
					</button>
				</Ariakit.Heading>
				<p>{fields.description.value}</p>
				<AspectSkillTags fields={fields} />
			</section>
		</Ariakit.HeadingLevel>
	)
}

function AspectSkillTags({ fields }: { fields: ResolvedAspectSkillFields }) {
	type Tag = {
		text: string
		color: BadgeColor
		tooltip?: ReactNode
	}

	const tags = [
		fields.aspect.value && {
			text: `${fields.aspect.value} (${ASPECT_ATTRIBUTES[fields.aspect.value]})`,
			color: {
				Fire: "red" as const,
				Water: "blue" as const,
				Wind: "green" as const,
				Light: "yellow" as const,
				Darkness: "purple" as const,
			}[fields.aspect.value],
			tooltip: ASPECTS.find((it) => it.name === fields.aspect.value)?.material,
		},
		// fields.type.value && {
		// 	text: fields.type.value,
		// 	color: "bright",
		// 	tooltip: fields.type.currentOption?.hint,
		// },
		// ...fields.modifiers.value.split(/\s*[,+]\s*/g).map<Tag>((modifier) => ({
		// 	text: modifier,
		// 	color: "default",
		// 	tooltip: ASPECT_ART_PROPERTIES.find(
		// 		(prop) => prop.name.toLowerCase() === modifier.toLowerCase(),
		// 	)?.description,
		// })),
	].filter(Boolean)

	return (
		<ul className="mt-1 flex flex-wrap gap-1.5">
			{uniqBy(tags, (it) => it.text).map((tag) => (
				<li key={tag.text}>
					<Tooltip content={tag.tooltip} placement="bottom-start">
						<Badge color={tag.color}>{tag.text}</Badge>
					</Tooltip>
				</li>
			))}
		</ul>
	)
}
