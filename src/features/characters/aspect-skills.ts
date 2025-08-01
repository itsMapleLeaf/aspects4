import ASPECTS from "../../data/list-of-aspects.json"
import { ASPECT_ART_TYPES, ASPECT_ATTRIBUTES } from "../characters/data.ts"
import {
	FieldContext,
	createResolvedListItemContext,
	resolveListField,
	resolveNumberField,
	resolveSelectField,
	resolveTextField,
} from "./sheet/fields.ts"

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
			choices: ASPECTS.map((aspect) => ({
				value: `${aspect.name}`,
				label: `${aspect.name} (${ASPECT_ATTRIBUTES[aspect.name]})`,
				hint: aspect.material,
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
