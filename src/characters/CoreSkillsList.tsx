import { useEditorCharacterSheet } from "./context.tsx"
import { SheetStatField } from "./sheet/SheetStatField.tsx"
import { resolveCoreSkillFields } from "./skills.ts"

export function CoreSkillsList() {
	const sheet = useEditorCharacterSheet()
	const fields = resolveCoreSkillFields(sheet)

	return (
		<div className="@container grid gap-3">
			<div className="grid gap-3 @sm:grid-cols-2">
				{fields.map((field) => (
					<SheetStatField
						key={field.id}
						resolved={field}
						label={field.info.skill}
						description={field.info.attribute}
						score={field.value}
						tooltip={field.info.flavor}
					/>
				))}
			</div>
		</div>
	)
}
