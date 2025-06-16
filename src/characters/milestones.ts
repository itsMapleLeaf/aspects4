import {
	FieldContext,
	createResolvedListItemContext,
	resolveListField,
	resolveSelectField,
	resolveTextField,
} from "../characters/sheet/fields.ts"
import { ASPECTS, SKILLS } from "./data.ts"

export type ResolvedMilestoneFields = ReturnType<typeof resolveMilestoneFields>

export function resolveMilestoneFields(context: FieldContext) {
	return {
		aspectBonus: resolveSelectField(context, {
			id: "aspectBonus",
			choices: Object.entries(ASPECTS).map(([name, info]) => ({
				value: name,
				hint: info.description,
			})),
		}),
		skillBonus: resolveSelectField(context, {
			id: "skillBonus",
			choices: Object.entries(SKILLS).flatMap(([category, skills]) =>
				Object.entries(skills)
					.sort(([a], [b]) => a.localeCompare(b))
					.map(([name, info]) => ({
						value: name,
						hint: `${category} - ${info.description}`,
					})),
			),
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
