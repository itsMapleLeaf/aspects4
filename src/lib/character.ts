import { type } from "arktype"
import { sum } from "es-toolkit"
import aspectSkillList from "../data/list-of-aspect-skills.json"
import aspectList from "../data/list-of-aspects.json"
import attributeList from "../data/list-of-attributes.json"
import skillList from "../data/list-of-skills.json"
import { safeParseNumber } from "./utils.ts"

type AttributeName = (typeof attributeNames)[number]
const attributeNames = [
	"Strength",
	"Sense",
	"Dexterity",
	"Intellect",
	"Presence",
] as const

const attributes = attributeNames.flatMap((name) => {
	const attr = attributeList.find((it) => it.attribute === name)
	return attr ?? []
})

export function getAttributes() {
	return attributes
}

type AspectName = (typeof aspectNames)[number]
const aspectNames = ["Fire", "Water", "Wind", "Light", "Darkness"] as const

const aspects = aspectNames.flatMap((name) => {
	const attr = aspectList.find((it) => it.name === name)
	return attr ?? []
})

export function getAspects() {
	return aspects
}

export type CharacterBond = typeof CharacterBond.inferOut
const CharacterBond = type({
	"name": "string",
	"description": "string",
	"strength": "number",
	"aura?": "string | null | undefined",
})

export type CharacterItem = typeof CharacterItem.inferOut
const CharacterItem = type({
	name: "string",
	description: "string",
})

export type Character = typeof Character.inferOut
export const Character = type({
	"key": "string",
	"name": "string",
	"data": `Record<string, string | number>`,
	"bonds?": CharacterBond.array(),
	"items?": CharacterItem.array(),
})

const skillAttributes = new Map(
	skillList.map((skill) => [skill.skill, skill.attribute]),
)
const aspectSkillAspects = new Map(
	aspectSkillList.map((skill) => [skill.modifier, skill.aspect]),
)

export function createCharacterModel(character: Character) {
	const attributeScores = {
		Strength: safeParseNumber(character.data[`attribute:Strength`]) ?? 1,
		Sense: safeParseNumber(character.data[`attribute:Sense`]) ?? 1,
		Dexterity: safeParseNumber(character.data[`attribute:Dexterity`]) ?? 1,
		Intellect: safeParseNumber(character.data[`attribute:Intellect`]) ?? 1,
		Presence: safeParseNumber(character.data[`attribute:Presence`]) ?? 1,
	}

	const aspectScores = {
		Fire: safeParseNumber(character.data[`aspect:Fire`]) ?? 0,
		Water: safeParseNumber(character.data[`aspect:Water`]) ?? 0,
		Wind: safeParseNumber(character.data[`aspect:Wind`]) ?? 0,
		Light: safeParseNumber(character.data[`aspect:Light`]) ?? 0,
		Darkness: safeParseNumber(character.data[`aspect:Darkness`]) ?? 0,
	}

	const modifiedAttributeScores = new Map<string, number>(
		Object.entries(attributeScores),
	)
	const modifiedAspectScores = new Map<string, number>(
		Object.entries(aspectScores),
	)

	const attributePointsAssigned = sum(Object.values(attributeScores))
	const aspectPointsAssigned = sum(Object.values(aspectScores))

	const skillPointsAssigned = sum(
		Object.entries(character.data)
			.filter((entry) => entry[0].startsWith("skill"))
			.map((entry) => safeParseNumber(entry[1]) ?? 0),
	)

	const persona = character.data["persona"] || ""
	const lineage = character.data["lineage"] || ""

	let hitsBonus = safeParseNumber(character.data.hitsMax) ?? 0
	let fatigueBonus = safeParseNumber(character.data.fatigueMax) ?? 0

	switch (persona) {
		case "Manipulator": {
			const current = modifiedAttributeScores.get("Presence") ?? 0
			modifiedAttributeScores.set("Presence", current + 1)
			break
		}
		case "Commander":
			fatigueBonus += 3
			break
		case "Vitalist": {
			const current = modifiedAspectScores.get("Light") ?? 0
			modifiedAspectScores.set("Light", current + 1)
			break
		}
		case "Protector": {
			const current = modifiedAttributeScores.get("Strength") ?? 0
			modifiedAttributeScores.set("Strength", current + 1)
			break
		}
		case "Strategist": {
			const current = modifiedAttributeScores.get("Intellect") ?? 0
			modifiedAttributeScores.set("Intellect", current + 1)
			break
		}
		case "Fighter": {
			const current = modifiedAspectScores.get("Fire") ?? 0
			modifiedAspectScores.set("Fire", current + 1)
			break
		}
	}

	switch (lineage) {
		case "Umbral": {
			const current = modifiedAspectScores.get("Darkness") ?? 0
			modifiedAspectScores.set("Darkness", current + 1)
			break
		}
		case "Arthropod": {
			const current = modifiedAttributeScores.get("Sense") ?? 0
			modifiedAttributeScores.set("Sense", current + 1)
			break
		}
		case "Avian": {
			const current = modifiedAspectScores.get("Wind") ?? 0
			modifiedAspectScores.set("Wind", current + 1)
			break
		}
		case "Aquatic": {
			const current = modifiedAspectScores.get("Water") ?? 0
			modifiedAspectScores.set("Water", current + 1)
			break
		}
		case "Scalebearer":
			hitsBonus += 3
			break
		case "Furbearer": {
			const current = modifiedAttributeScores.get("Dexterity") ?? 0
			modifiedAttributeScores.set("Dexterity", current + 1)
			break
		}
	}

	const hitsMax =
		(modifiedAttributeScores.get("Strength") ?? 0) +
		(modifiedAttributeScores.get("Dexterity") ?? 0) +
		3 +
		hitsBonus

	const fatigueMax =
		(modifiedAttributeScores.get("Sense") ?? 0) +
		(modifiedAttributeScores.get("Intellect") ?? 0) +
		(modifiedAttributeScores.get("Presence") ?? 0) +
		fatigueBonus

	const model = {
		persona,
		lineage,

		hitsMax,
		hitsBonus,

		fatigueMax,
		fatigueBonus,

		attributePointsAssigned,
		aspectPointsAssigned,
		skillPointsAssigned,

		attributeScores,
		aspectScores,

		modifiedAttributeScores,
		modifiedAspectScores,

		getAttributeScore(attribute: AttributeName | (string & {})) {
			return modifiedAttributeScores.get(attribute) ?? 1
		},

		getAspectScore(aspect: AspectName | (string & {})) {
			return modifiedAspectScores.get(aspect) ?? 0
		},

		getSkillPoints(skillName: string) {
			return safeParseNumber(character.data[`skill:${skillName}`]) ?? 0
		},

		getSkillScore(skillName: string) {
			const points = model.getSkillPoints(skillName)
			const attribute = skillAttributes.get(skillName)
			const attributeScore = attribute ? model.getAttributeScore(attribute) : 1
			return points + attributeScore
		},

		getAspectSkillPoints(skillName: string) {
			return safeParseNumber(character.data[`skill:${skillName}`]) ?? 0
		},

		getAspectSkillScore(skillName: string) {
			const points = model.getAspectSkillPoints(skillName)
			const aspect = aspectSkillAspects.get(skillName)
			const aspectScore = aspect ? model.getAspectScore(aspect) : 1
			return points + aspectScore
		},
	}

	return model
}
