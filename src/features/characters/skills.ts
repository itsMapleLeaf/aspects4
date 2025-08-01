import CORE_SKILLS from "../../data/list-of-skills.json"
import {
	FieldContext,
	resolveNumberField,
	type ResolvedNumberField,
} from "../characters/sheet/fields.ts"
import { resolveAspectSkillListFieldItems } from "./aspect-skills.ts"

export type CoreSkillInfo = (typeof CORE_SKILLS)[number]

export interface ResolvedCoreSkillField extends ResolvedNumberField {
	info: CoreSkillInfo
}

export function resolveCoreSkillFields(
	sheet: FieldContext,
): ResolvedCoreSkillField[] {
	return CORE_SKILLS.sort((a, b) => a.skill.localeCompare(b.skill)).map(
		(info) => ({
			...resolveNumberField(sheet, { id: `coreSkills:${info.skill}`, min: 1 }),
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

export function getTotalSkillPoints(_sheet: FieldContext) {
	const basePoints = 5
	const bonusPoints = 0

	return basePoints + bonusPoints
}
