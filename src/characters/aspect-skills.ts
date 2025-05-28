import { ASPECT_ART_TYPES } from "../characters/data.ts"
import {
	FieldContext,
	createResolvedListItemContext,
	resolveListField,
	resolveNumberField,
	resolveSelectField,
	resolveTextField,
} from "../characters/sheet/fields.ts"
import ASPECTS from "../data/list-of-aspects.json"

export type ResolvedAspectSkillFields = ReturnType<
	typeof resolveAspectSkillFields
>
export function resolveAspectSkillFields(context: FieldContext) {
	return {
		name: resolveTextField(context, {
			id: "name",
			defaultValue: "New Aspect Skill",
		}),
		aspect: resolveSelectField(context, {
			id: "aspect",
			choices: ASPECTS.map((item) => ({
				value: item.name,
				hint: item.material,
			})),
		}),
		points: resolveNumberField(context, {
			id: "points",
			min: 0,
		}),
		type: resolveSelectField(context, {
			id: "type",
			choices: ASPECT_ART_TYPES,
		}),
		modifiers: resolveTextField(context, {
			id: "modifiers",
		}),
		description: resolveTextField(context, {
			id: "description",
		}),
	}
}

export function resolveAspectSkillListFieldItems(sheet: FieldContext) {
	const resolvedList = resolveListField(sheet, "aspectSkills")
	return resolvedList.items.map((item, index) => {
		return resolveAspectSkillFields(
			createResolvedListItemContext(item, resolvedList, index),
		)
	})
}
