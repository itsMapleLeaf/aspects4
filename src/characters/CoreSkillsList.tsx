import { use } from "react"
import { CharacterSheetContext } from "./context.ts"
import { resolveCharacterScores } from "./scores.ts"
import { SheetStatField } from "./sheet/SheetStatField.tsx"
import { resolveCoreSkillFields } from "./skills.ts"

export function CoreSkillsList() {
	const sheet = use(CharacterSheetContext)
	const fields = resolveCoreSkillFields(sheet)
	const scores = resolveCharacterScores(sheet)

	return (
		<div className="@container grid gap-3">
			<div className="grid gap-3 @sm:grid-cols-2">
				{fields.map((field) => (
					<SheetStatField
						key={field.id}
						resolved={field}
						label={field.info.skill}
						description={field.info.attribute}
						score={scores.scoreOf(field.info.attribute) + field.value}
						tooltip={field.info.flavor}
					/>
				))}
			</div>
		</div>
	)
}
