import type { ResolvedSelectChoice } from "./sheet/fields.ts"

export { default as EXPENSE_TIERS } from "../data/list-of-expense-tiers.json"

export type AttributeName = (typeof ATTRIBUTE_NAMES)[number] | (string & {})
export const ATTRIBUTE_NAMES = [
	"Strength",
	"Sense",
	"Dexterity",
	"Intellect",
	"Presence",
] as const

export type AspectName = (typeof ASPECT_NAMES)[number] | (string & {})
export const ASPECT_NAMES = [
	"Fire",
	"Water",
	"Wind",
	"Light",
	"Darkness",
] as const

export const ASPECT_ATTRIBUTES: Record<AspectName, AttributeName> = {
	Fire: "Strength",
	Water: "Sense",
	Wind: "Dexterity",
	Light: "Intellect",
	Darkness: "Presence",
}

export const ATTRIBUTE_ASPECTS = Object.fromEntries(
	Object.entries(ASPECT_ATTRIBUTES).map((it) => [it[1], it[0] as AspectName]),
) as Record<AttributeName, AspectName>

export const ITEM_TYPES = [
	{
		value: "consumable",
		label: "Consumable",
		description: "Goes away when there are no more uses",
	},
	{
		value: "reusable",
		label: "Reusable",
		description: "Can be used and reused",
	},
	// {
	// 	value: "tool",
	// 	label: "Tool",
	// 	description: "Can be used and reused while held",
	// },
	// {
	// 	value: "wearable",
	// 	label: "Wearable",
	// 	description: "Can be worn for a persistent effect",
	// },
]

export const ASPECT_AURAS = [
	{
		value: "Fire",
		label: "Fire",
		hint: "Indicates an adversarial, heated, conflict-heavy relationship.",
	},
	{
		value: "Water",
		label: "Water",
		hint: "Comes from notions of comfort, peace, and protection.",
	},
	{
		value: "Wind",
		label: "Wind",
		hint: "Exhibits in turbulent relationships full of excitement and change.",
	},
	{
		value: "Light",
		label: "Light",
		hint: "Represents diplomatic relationships built on fairness and respect.",
	},
	{
		value: "Darkness",
		label: "Darkness",
		hint: "Manifests from tension, mistrust, and uncertainty.",
	},
] as const

export const ASPECT_ART_TYPES: ResolvedSelectChoice[] = [
	{
		value: "Projectile",
		hint: `a transient manifestation that moves in a direction or towards a *visible or known target* of your choosing, then disappears on contact`,
	},
	{
		value: "Enchantment",
		hint: `a direct, non-physical application of an effect on a *visible or known target*`,
	},
	{
		value: "Construct",
		hint: `physical manifestations which can be seen and interacted with`,
	},
	{
		value: "Item",
		hint: `wielding the product of your art as a utility`,
	},
	{
		value: "Environmental",
		hint: `modifies the area of the scene and affects present characters, including yourself`,
	},
]

export const ASPECT_ART_PROPERTIES = [
	{
		name: "Damage",
		description: `deal 1 damage per impact point to yourself or a target`,
	},
	{
		name: "Healing",
		description: `heal 1 damage or negative condition per impact point to yourself or a target`,
	},
	{
		name: "Shield",
		description: `as a reaction, prevent 1 damage per impact point against a target`,
	},
	{
		name: "Enhance",
		description: `add 1 die per impact point to a character’s next roll with a chosen skill`,
	},
	{
		name: "Weaken",
		description: `subtract 1 die per impact point from a character’s next roll with a chosen skill (to no less than 1)`,
	},
	{
		name: "Exhaust",
		description: `deal 1 fatigue per impact point`,
	},
	{
		name: "Shift",
		description: `move a target’s position`,
	},
	{
		name: "Blast",
		description: `apply this art to other nearby targets`,
	},
]

export type AspectInfo = {
	description: string
}

export const ASPECTS: Record<string, AspectInfo> = {
	Fire: {
		description: "physical force and aggression",
	},
	Water: {
		description: "perception and constitution",
	},
	Wind: {
		description: "acrobatics and dexterity",
	},
	Light: {
		description: "information collection and examination",
	},
	Darkness: {
		description: "manipulation and trickery",
	},
}

export type SkillInfo = {
	description: string
	reaction?: boolean
}

export const SKILLS = {
	Physical: {
		Endure: {
			description: `withstand physical or mental challenges through resilience`,
		},
		Exert: {
			description: `apply physical strength to overcome obstacles or perform feats of power`,
		},
		Maneuver: {
			description: `perform agile movements to navigate or evade obstacles and threats`,
		},
		Sneak: {
			description: `move silently and unseen to avoid detection`,
		},
	},

	Mental: {
		Intuit: {
			description: `analyze written or visual information to extract meaning or insights`,
		},
		Notice: {
			description: `observe details in your surroundings to gain awareness or insight`,
		},
		Aim: {
			description: `throw or shoot at a target`,
		},
		Focus: {
			description: `carry out a meticulous task while avoiding external infuluence`,
		},
	},

	Social: {
		Sway: {
			description: `influence others through charisma, charm, or persuasive appeal`,
		},
		Trick: {
			description: `mislead others through lies or misdirection`,
		},
		Intimidate: {
			description: `use forceful presence to influence or frighten others`,
		},
		// Persuade: {
		// 	description: `sway others with logic and reason`,
		// },
		Read: {
			description: `sense intentions through emotions without direct evidence`,
		},
	},
}
