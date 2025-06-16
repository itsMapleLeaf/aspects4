import { Heading, HeadingLevel } from "@ariakit/react"
import { resolveMilestoneListFieldItems } from "~/characters/milestones.ts"
import { useEditorCharacterSheet } from "./context.tsx"
import { SKILLS } from "./data.ts"
import { resolveNumberField } from "./sheet/fields.ts"
import { SheetStatField } from "./sheet/SheetStatField.tsx"

export function CoreSkillsList() {
	const sheet = useEditorCharacterSheet()

	const milestones = resolveMilestoneListFieldItems(sheet)

	return (
		<div className="@container grid gap-4">
			{Object.entries(SKILLS).map(([category, skills]) => (
				<HeadingLevel key={category}>
					<section>
						<Heading className="mb-1 heading-xl">{category}</Heading>
						<ul className="grid grid-cols-2 gap-2">
							{Object.entries(skills)
								.sort(([a], [b]) =>
									a.toLowerCase().localeCompare(b.toLowerCase()),
								)
								.map(([skillName, skill]) => {
									const field = resolveNumberField(sheet, {
										id: `coreSkills:${skillName}`,
										min: 1,
									})
									const milestoneBonusCount = milestones.filter(
										(it) => it.skillBonus.value === skillName,
									).length
									return (
										<li key={skillName}>
											<SheetStatField
												label={skillName}
												tooltip={skill.description}
												resolved={field}
												score={field.value + milestoneBonusCount}
											/>
										</li>
									)
								})}
						</ul>
					</section>
				</HeadingLevel>
			))}
			{/* <div className="grid gap-3 @sm:grid-cols-2">
				{fields.map((field) => (
					<SheetStatField
						key={field.id}
						resolved={field}
						label={field.info.skill}
						description={field.info.attribute}
						score={field.value}
						tooltip={field.info.flavor}
					/>
				))}
			</div> */}
		</div>
	)
}
