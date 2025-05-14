export type CharacterSheetLayout = {
	id: string
	systemName: string
	name: string
	blocks: CharacterSheetBlockSchema[]
}

export type CharacterSheetBlockSchema =
	| {
			id: string
			type: "row" | "column"
			children: CharacterSheetBlockSchema[]
	  }
	| {
			id: string
			displayName?: string
			hint?: string
			type: "text"
			multiline?: boolean
			/** @default 50_000 */
			maxLength?: number
	  }
	| {
			id: string
			displayName?: string
			hint?: string
			type: "number"
			/** @default 0 */
			min?: number
			/** @default Number.POSITIVE_INFINITY */
			max?: number
			optional?: boolean
	  }
	| {
			id: string
			displayName?: string
			hint?: string
			type: "select"
			choices: CharacterSchemaSelectChoice[]
			optional?: boolean
	  }
	| {
			id: string
			displayName?: string
			hint?: string
			type: "list"
			itemFields: CharacterSheetBlockSchema[]
	  }

export type CharacterSchemaSelectChoice = {
	id: string
	displayName?: string
	/** Short description displayed under the label of each choice */
	hint?: string
	/** A longer description displayed while this choice is selected */
	description?: string
}

let nextId = 0
const uniqueId = () => String(nextId++)

export const aspectsPlayerCharacterSchema: CharacterSheetLayout = {
	id: "aspectsPlayerCharacter",
	systemName: "Aspects of Nature",
	name: "Player Character",
	blocks: [
		{
			id: uniqueId(),
			type: "row",
			children: [
				{ id: "damageLimit", type: "number" },
				{ id: "fatigueLimit", type: "number" },
				{ id: "aspectExperience", displayName: "Aspect EXP", type: "number" },
				{ id: "skillPoints", type: "number" },
			],
		},

		{ id: "conditions", type: "text", multiline: true },

		{
			id: uniqueId(),
			type: "row",
			children: [
				{ id: "strength", type: "number" },
				{ id: "sense", type: "number" },
				{ id: "dexterity", type: "number" },
				{ id: "intellect", type: "number" },
				{ id: "presence", type: "number" },
			],
		},
		{
			id: uniqueId(),
			type: "row",
			children: [
				{ id: "fire", type: "number" },
				{ id: "water", type: "number" },
				{ id: "wind", type: "number" },
				{ id: "light", type: "number" },
				{ id: "darkness", type: "number" },
			],
		},

		// {
		// 	id: uniqueId(),
		// 	type: "row",
		// 	children: [
		// 		{
		// 			id: uniqueId(),
		// 			type: "column",
		// 			children: [
		// 				{ id: "strength", type: "number" },
		// 				{ id: "sense", type: "number" },
		// 				{ id: "dexterity", type: "number" },
		// 				{ id: "intellect", type: "number" },
		// 				{ id: "presence", type: "number" },
		// 			],
		// 		},
		// 		{
		// 			id: uniqueId(),
		// 			type: "column",
		// 			children: [
		// 				{ id: "fire", type: "number" },
		// 				{ id: "water", type: "number" },
		// 				{ id: "wind", type: "number" },
		// 				{ id: "light", type: "number" },
		// 				{ id: "darkness", type: "number" },
		// 			],
		// 		},
		// 	],
		// },

		{ id: "skillPointAssignments", type: "text", multiline: true },
		{ id: "aspectSkills", type: "text", multiline: true },

		{ id: "lineage", type: "text", multiline: true },
		{ id: "bonds", type: "text", multiline: true },

		{ id: "items", type: "text", multiline: true },
		{
			id: "expenseTier",
			type: "select",
			hint: "What's the most expensive thing you can afford? You can freely buy things two tiers down.",
			choices: [
				{
					id: "dirt",
					displayName: "1. Dirt",
					hint: "Water and other freely-available resources",
				},
				{
					id: "cheap",
					displayName: "2. Cheap",
					hint: "Common meals, simple clothing",
				},
				{
					id: "inexpensive",
					displayName: "3. Inexpensive",
					hint: "Five-star meals, basic tools and weapons, reasonable lodging",
				},
				{
					id: "steep",
					displayName: "4. Steep",
					hint: "Premium tools and weapons, extravagant clothing, comfortable lodging",
				},
				{
					id: "expensive",
					displayName: "5. Expensive",
					hint: "A house, luxurious lodging",
				},
				{ id: "valuable", displayName: "6. Valuable", hint: "A mansion" },
				{
					id: "priceless",
					displayName: "7. Priceless",
					hint: "An extremely rare, precious, powerful artifact",
				},
			],
		},

		{ id: "details", type: "text", multiline: true },
	],
}
