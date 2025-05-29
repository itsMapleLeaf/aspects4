import { use } from "react"
import { CharacterSheetContext } from "./context.ts"
import { getTotalSkillPoints } from "./milestones.ts"
import { getUsedSkillPoints } from "./skills.ts"

export function SkillPointsUsage() {
	const sheet = use(CharacterSheetContext)
	const usedPoints = getUsedSkillPoints(sheet)
	const totalPoints = getTotalSkillPoints(sheet)

	return (
		<div className="font-semibold">
			{usedPoints}/{totalPoints} skill points used
		</div>
	)
}
