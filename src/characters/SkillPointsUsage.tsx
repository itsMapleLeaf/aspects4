import { useEditorCharacterSheet } from "./context.tsx"
import { getTotalSkillPoints } from "./milestones.ts"
import { getUsedSkillPoints } from "./skills.ts"

export function SkillPointsUsage() {
	const sheet = useEditorCharacterSheet()
	const usedPoints = getUsedSkillPoints(sheet)
	const totalPoints = getTotalSkillPoints(sheet)

	return (
		<div className="font-semibold">
			{usedPoints}/{totalPoints} skill points used
		</div>
	)
}
