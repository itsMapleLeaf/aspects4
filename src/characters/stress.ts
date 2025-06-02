import { resolveMilestoneListFieldItems } from "./milestones.ts"
import { resolveCharacterScores } from "./scores.ts"
import type { FieldContext } from "./sheet/fields.ts"

export function getDamageLimit(sheet: FieldContext) {
	const scores = resolveCharacterScores(sheet)

	const baseLimit = scores.scoreOf("Strength") + scores.scoreOf("Dexterity")

	const milestones = resolveMilestoneListFieldItems(sheet)
	const bonusAmount =
		milestones.filter(
			(milestone) => milestone.bonusType.value === "damageLimitIncrease",
		).length * 5

	return baseLimit + bonusAmount
}

export function getFatigueLimit(sheet: FieldContext) {
	const scores = resolveCharacterScores(sheet)

	const baseLimit =
		scores.scoreOf("Sense") +
		scores.scoreOf("Intellect") +
		scores.scoreOf("Presence")

	const milestones = resolveMilestoneListFieldItems(sheet)
	const bonusAmount =
		milestones.filter(
			(milestone) => milestone.bonusType.value === "fatigueLimitIncrease",
		).length * 5

	return baseLimit + bonusAmount
}
