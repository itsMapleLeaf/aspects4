import { Heading, HeadingLevel } from "@ariakit/react"
import { sum } from "es-toolkit"
import { resolveMilestoneListFieldItems } from "./milestones.ts"
import { useEditorCharacterSheet } from "./context.tsx"
import { SKILLS } from "./data.ts"
import { resolveNumberField } from "./sheet/fields.ts"
import { SheetStatField } from "./sheet/SheetStatField.tsx"
import { resolveStress } from "./stress.ts"

export function CoreSkillsList() {
	const sheet = useEditorCharacterSheet()
	const stress = resolveStress(sheet)
	const milestones = resolveMilestoneListFieldItems(sheet)

	return (
		<div className="@container grid gap-4">
			{Object.entries(SKILLS).map(([category, skills]) => {
				const categoryPeril = sum(
					stress.pools
						.filter((it) => it.skillCategory === category)
						.map((it) => it.peril),
				)

				return (
					<HeadingLevel key={category}>
						<section>
							<div className="flex items-baseline gap-2">
								<Heading className="mb-1 heading-xl">{category}</Heading>
								{categoryPeril > 0 && (
									<p className="muted">{`(-${categoryPeril} from peril)`}</p>
								)}
							</div>

							<ul className="grid grid-cols-2 gap-2">
								{Object.entries(skills)
									.sort(([a], [b]) =>
										a.toLowerCase().localeCompare(b.toLowerCase()),
									)
									.map(([skillName, skill]) => {
										const field = resolveNumberField(sheet, {
											id: `coreSkills:${skillName}`,
											min: 0,
										})

										const milestoneBonusCount = milestones.filter(
											(it) => it.skillBonus.value === skillName,
										).length

										const score = Math.max(
											0,
											field.value + milestoneBonusCount - categoryPeril,
										)

										return (
											<li key={skillName} className="grid">
												<SheetStatField
													label={skillName}
													description={
														milestoneBonusCount > 0 &&
														`+${milestoneBonusCount} from milestones`
													}
													tooltip={skill.description}
													resolved={field}
													score={score}
												/>
											</li>
										)
									})}
							</ul>
						</section>
					</HeadingLevel>
				)
			})}
		</div>
	)
}
