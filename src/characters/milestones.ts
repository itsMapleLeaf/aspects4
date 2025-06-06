import {
	FieldContext,
	createResolvedListItemContext,
	resolveListField,
	resolveTextField,
} from "../characters/sheet/fields.ts"

export type ResolvedMilestoneFields = ReturnType<typeof resolveMilestoneFields>

export function resolveMilestoneFields(context: FieldContext) {
	return {
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
