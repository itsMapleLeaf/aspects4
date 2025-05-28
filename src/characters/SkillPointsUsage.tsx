import { use } from "react"
import { CharacterSheetContext } from "./context.ts"
import { getTotalSkillPoints, getUsedSkillPoints } from "./skills.ts"

export function SkillPointsUsage() {
	const sheet = use(CharacterSheetContext)
	return (
		<div className="font-semibold">
			{getUsedSkillPoints(sheet)}/{getTotalSkillPoints()} skill points used
		</div>
	)
}
