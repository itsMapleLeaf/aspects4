import type { ResolvedSelectChoice } from "./sheet/fields.ts"

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

export const ITEM_TYPES = [
	{
		value: "consumable",
		label: "Consumable",
		description: "Goes away when there are no more uses",
	},
	{
		value: "tool",
		label: "Tool",
		description: "Can be used and reused while held",
	},
	{
		value: "wearable",
		label: "Wearable",
		description: "Can be worn for a persistent effect",
	},
]

export const ASPECT_AURAS = [
	{
		value: "Fire",
		label: "Fire",
		description:
			"Indicates an adversarial, heated, conflict-heavy relationship.",
	},
	{
		value: "Water",
		label: "Water",
		description: "Comes from notions of comfort, peace, and protection.",
	},
	{
		value: "Wind",
		label: "Wind",
		description:
			"Exhibits in turbulent relationships full of excitement and change.",
	},
	{
		value: "Light",
		label: "Light",
		description:
			"Represents diplomatic relationships built on fairness and respect.",
	},
	{
		value: "Darkness",
		label: "Darkness",
		description: "Manifests from tension, mistrust, and uncertainty.",
	},
]

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
