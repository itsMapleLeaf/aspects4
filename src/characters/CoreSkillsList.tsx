import { Tooltip } from "../components/ui/Tooltip.tsx"
import { SheetStatField } from "./sheet/components.tsx"
import type { FieldContext } from "./sheet/fields.ts"
import { SkillPointsUsage } from "./SkillPointsUsage.tsx"
import { resolveCoreSkillFields, type CoreSkillInfo } from "./skills.ts"

export function CoreSkillsList({ sheet }: { sheet: FieldContext }) {
	const fields = resolveCoreSkillFields(sheet)

	return (
		<div className="@container grid gap-3">
			<SkillPointsUsage sheet={sheet} />
			<div className="grid gap-x-6 gap-y-2 @sm:grid-cols-2">
				{fields.map((field) => (
					<div
						key={field.id}
						data-active={field.value > 0 || undefined}
						className="opacity-60 transition data-active:opacity-100"
					>
						<SheetStatField
							resolved={field}
							label={<CoreSkillFieldLabel info={field.info} />}
						/>
					</div>
				))}
			</div>
		</div>
	)
}

function CoreSkillFieldLabel({ info }: { info: CoreSkillInfo }) {
	return (
		<Tooltip content={info.flavor} placement="bottom-start">
			<button
				type="button"
				className="cursor-default leading-tight transition hover:text-primary-300"
			>
				{info.skill}
				<br />
				<span className="text-sm font-normal opacity-60">{info.attribute}</span>
			</button>
		</Tooltip>
	)
}
