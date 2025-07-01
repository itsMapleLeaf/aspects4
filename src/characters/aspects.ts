import { mapValues } from "es-toolkit"
import { ASPECTS } from "~/characters/data.ts"
import { resolveMilestoneListFieldItems } from "~/characters/milestones.ts"
import { FieldContext, resolveNumberField } from "~/characters/sheet/fields.ts"

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
		return {
			resolved: resolved,
			computedScore: resolved.value + (aspectMilestoneBonuses[name] ?? 0),
		}
	})
}
