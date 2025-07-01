import { startCase, sum } from "es-toolkit"
import { resolveNumberField } from "~/characters/sheet/fields.ts"
import type { FieldContext } from "./sheet/fields.ts"

export function resolveStress(sheet: FieldContext) {
	const pools = [
		{ id: "damage", skillCategory: "Physical" },
		{ id: "fatigue", skillCategory: "Mental" },
		{ id: "anxiety", skillCategory: "Social" },
	].map((pool) => {
		const field = resolveNumberField(sheet, { id: pool.id })
		const perilAmount = Math.floor(field.value / 5)
		return {
			field: field,
			label:
				startCase(pool.id) +
				(perilAmount === 0 ? "" : ` - ${perilAmount} peril`),
			peril: perilAmount,
			skillCategory: pool.skillCategory,
		}
	})
	return { pools, perilSum: sum(pools.map((it) => it.peril)) }
}
