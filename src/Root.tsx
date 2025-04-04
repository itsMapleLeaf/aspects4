import { twMerge, type ClassNameValue } from "tailwind-merge"
import { CharacterSheet } from "./components/CharacterSheet.tsx"
import aspectSkillList from "./data/list-of-aspect-skills.json"
import skillList from "./data/list-of-skills.json"

const skillsByAttribute = Object.groupBy(skillList, (skill) => skill.attribute)

const aspectSkillsByAspect = Object.groupBy(
	aspectSkillList,
	(skill) => skill.aspect,
)

const panel = (...classes: ClassNameValue[]) =>
	twMerge("rounded-md border border-gray-800 bg-gray-900 p-3", ...classes)

export function Root() {
	return (
		<div className="h-dvh p-4">
			<div
				className={panel("h-full max-w-xl overflow-y-auto will-change-scroll")}
			>
				<CharacterSheet />
			</div>
		</div>
	)
}
