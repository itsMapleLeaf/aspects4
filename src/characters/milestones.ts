import {
	FieldContext,
	createResolvedListItemContext,
	resolveListField,
	resolveSelectField,
	resolveTextField,
	type ResolvedSelectChoice,
} from "../characters/sheet/fields.ts"
import { resolveCharacterScores } from "./scores.ts"

const MILESTONE_BONUS_TYPES: ResolvedSelectChoice[] = [
	{
		label: "+3 skill points",
		value: "skillPoints",
	},
	{
		label: "+5 damage limit",
		value: "damageLimitIncrease",
	},
	{
		label: "+5 fatigue limit",
		value: "fatigueLimitIncrease",
	},
]

export type ResolvedMilestoneFields = ReturnType<typeof resolveMilestoneFields>

export function resolveMilestoneFields(context: FieldContext) {
	return {
		bonusType: resolveSelectField(context, {
			id: "bonusType",
			defaultValue: "skillPoints",
			choices: MILESTONE_BONUS_TYPES,
		}),
		notes: resolveTextField(context, {
			id: "notes",
			defaultValue: "",
		}),
	}
}

export function resolveMilestoneListFieldItems(sheet: FieldContext) {
	const resolvedList = resolveListField(sheet, "milestones")
	return resolvedList.items.map((item, index) => {
		return resolveMilestoneFields(
			createResolvedListItemContext(item, resolvedList, index),
		)
	})
}

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

export function getTotalSkillPoints(sheet: FieldContext) {
	const basePoints = 5
	const milestones = resolveMilestoneListFieldItems(sheet)
	const bonusPoints =
		milestones.filter(
			(milestone) => milestone.bonusType.value === "skillPoints",
		).length * 3

	return basePoints + bonusPoints
}
