import LINEAGES from "../../data/list-of-lineages.json"
import {
	SheetNumberField,
	SheetSelectField,
} from "../characters/sheet/components.tsx"
import {
	resolveNumberField,
	resolveSelectField,
} from "../characters/sheet/fields.ts"
import { useEditorCharacterSheet } from "./context.tsx"

export function LineageFieldGroup() {
	const sheet = useEditorCharacterSheet()

	const lineage = resolveSelectField(sheet, {
		id: "lineage",
		choices: LINEAGES.sort((a, b) => a.lineage.localeCompare(b.lineage)).map(
			(item) => ({
				label: item.lineage,
				value: item.lineage,
				hint: item.memberCreatures,
			}),
		),
	})

	const [abilityName, abilityDescription] =
		LINEAGES.find((it) => it.lineage === lineage.value)?.ability?.split(
			" - ",
			2,
		) ?? []

	return (
		<div>
			<div className="flex gap-2">
				<SheetSelectField className="flex-1" resolved={lineage} />
				{lineage.value === "Furbearer" && (
					<SheetNumberField
						className="w-32"
						resolved={resolveNumberField(sheet, { id: "adaptationPoints" })}
					/>
				)}
				{lineage.value === "Scalebearer" && (
					<SheetNumberField
						className="w-32"
						resolved={resolveNumberField(sheet, { id: "reflectionPoints" })}
					/>
				)}
			</div>
			{abilityName && abilityDescription && (
				<p className="mt-1 text-sm">
					<strong>{abilityName}</strong> - <em>{abilityDescription}</em>
				</p>
			)}
		</div>
	)
}
