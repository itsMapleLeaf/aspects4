import type { FieldContext } from "./sheet/fields.ts"
import { getUsedSkillPoints } from "./skills.ts"

export function SkillPointsUsage({ sheet }: { sheet: FieldContext }) {
	const usedSkillPoints = getUsedSkillPoints(sheet)
	return (
		<div className="font-semibold">{usedSkillPoints}/5 skill points used</div>
	)
}
