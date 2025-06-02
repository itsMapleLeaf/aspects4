import {
	FieldContext,
	createResolvedListItemContext,
	resolveListField,
	resolveSelectField,
	resolveTextField,
	type ResolvedSelectChoice,
} from "../characters/sheet/fields.ts"
import { ATTRIBUTE_NAMES } from "./data.ts"

const MILESTONE_BONUS_TYPES = [
	// {
	// 	label: "+3 skill points",
	// 	value: "skillPoints",
	// },
	// {
	// 	label: "+5 damage limit",
	// 	value: "damageLimitIncrease",
	// },
	// {
	// 	label: "+5 fatigue limit",
	// 	value: "fatigueLimitIncrease",
	// },
	{
		label: "+1 attribute point (once per attribute)",
		value: "attributePoint",
	},
	{
		label: "+2 to any skill",
		value: "singleSkillBonus",
	},
	{
		label: "+1 to any two skills",
		value: "doubleSkillBonus",
	},
] as const satisfies ResolvedSelectChoice[]

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
		attributeMilestoneChoice: resolveSelectField(context, {
			id: "attributeMilestoneChoice",
			choices: ATTRIBUTE_NAMES.map((name) => ({
				value: name,
			})),
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
