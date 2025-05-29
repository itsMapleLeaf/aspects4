import {
	resolveNumberField,
	type FieldContext,
	type ResolvedNumberField,
} from "../characters/sheet/fields.ts"
import LIST_OF_ASPECTS from "../data/list-of-aspects.json"
import LIST_OF_ATTRIBUTES from "../data/list-of-attributes.json"
import type { AttributeName } from "./data.ts"

export interface ResolvedCharacterScoreField extends ResolvedNumberField {
	name: string
	description: string
}

export function resolveCharacterScores(sheet: FieldContext) {
	const fields = new Map<string, ResolvedCharacterScoreField>()

	for (const item of LIST_OF_ATTRIBUTES) {
		fields.set(item.attribute, {
			...resolveNumberField(sheet, {
				id: `attribute:${item.attribute}`,
				min: 1,
			}),
			name: item.attribute,
			description: item.description,
		})
	}

	for (const item of LIST_OF_ASPECTS) {
		fields.set(item.name, {
			...resolveNumberField(sheet, {
				id: `aspect:${item.name}`,
			}),
			name: item.name,
			description: item.material,
		})
	}

	return {
		fields,
		scoreOf: (attributeName: AttributeName) =>
			fields.get(attributeName)?.value ?? 0,
	}
}
