import { mapValues } from "es-toolkit"
import { ASPECTS } from "./data.ts"
import { resolveMilestoneListFieldItems } from "./milestones.ts"
import { FieldContext, resolveNumberField } from "./sheet/fields.ts"

export function resolveAspectFields(sheet: FieldContext) {
	const milestones = resolveMilestoneListFieldItems(sheet)

	const aspectMilestoneBonuses: Record<string, number> = {}

	for (const milestone of milestones) {
		aspectMilestoneBonuses[milestone.aspectBonus.value] =
			(aspectMilestoneBonuses[milestone.aspectBonus.value] ?? 0) + 1
	}

	return mapValues(ASPECTS, (_info, name) => {
		const resolved = resolveNumberField(sheet, {
			id: `aspect:${name}`,
			min: 0,
		})
		const milestoneBonus = aspectMilestoneBonuses[name] ?? 0
		return {
			resolved,
			milestoneBonus,
			computedScore: resolved.value + milestoneBonus,
		}
	})
}
