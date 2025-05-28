import { use } from "react"
import { CharacterSheetContext } from "./context.ts"
import { SheetStatField } from "./sheet/components.tsx"
import { SkillPointsUsage } from "./SkillPointsUsage.tsx"
import { resolveCoreSkillFields, type CoreSkillInfo } from "./skills.ts"

export function CoreSkillsList() {
	const sheet = use(CharacterSheetContext)
	const fields = resolveCoreSkillFields(sheet)

	return (
		<div className="@container grid gap-3">
			<SkillPointsUsage />
			<div className="grid gap-3 @sm:grid-cols-2">
				{fields.map((field) => (
					<div
						key={field.id}
						data-active={field.value > 0 || undefined}
						className="opacity-60 transition data-active:opacity-100"
					>
						<SheetStatField
							resolved={field}
							label={<CoreSkillFieldLabel info={field.info} />}
							tooltip={field.info.flavor}
						/>
					</div>
				))}
			</div>
		</div>
	)
}

function CoreSkillFieldLabel({ info }: { info: CoreSkillInfo }) {
	return (
		<div>
			<div>{info.skill}</div>
			<div className="text-sm font-normal opacity-60">{info.attribute}</div>
		</div>
	)
}
