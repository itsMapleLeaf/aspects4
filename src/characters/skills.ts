import {
	FieldContext,
	resolveNumberField,
	type ResolvedNumberField,
} from "../characters/sheet/fields.ts"
import CORE_SKILLS from "../data/list-of-skills.json"
import { resolveAspectSkillListFieldItems } from "./aspect-skills.ts"
import { resolveMilestoneListFieldItems } from "./milestones.ts"

export type CoreSkillInfo = (typeof CORE_SKILLS)[number]

export interface ResolvedCoreSkillField extends ResolvedNumberField {
	info: CoreSkillInfo
}

export function resolveCoreSkillFields(
	sheet: FieldContext,
): ResolvedCoreSkillField[] {
	return CORE_SKILLS.sort((a, b) => a.skill.localeCompare(b.skill)).map(
		(info) => ({
			...resolveNumberField(sheet, { id: `coreSkills:${info.skill}` }),
			info,
		}),
	)
}

export function getUsedSkillPoints(sheet: FieldContext) {
	const coreSkillFields = resolveCoreSkillFields(sheet)
	const aspectSkillItems = resolveAspectSkillListFieldItems(sheet)
	return (
		coreSkillFields.reduce((total, field) => total + field.value, 0) +
		aspectSkillItems.reduce((total, field) => total + field.points.value, 0)
	)
}

export function getTotalSkillPoints(sheet: FieldContext) {
	const basePoints = 5
	const milestones = resolveMilestoneListFieldItems(sheet)
	const bonusPoints =
		milestones.filter(
			(milestone) => milestone.bonusType.value === "skillPoints",
		).length * 3

	return basePoints + bonusPoints
}
