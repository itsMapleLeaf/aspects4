import {
	type CharacterSheetLayout,
	column,
	number,
	row,
	select,
	tab,
	tabs,
	text,
} from "./character.schema.ts"

export const aspectsPlayerCharacterSchema: CharacterSheetLayout = {
	id: "aspectsPlayerCharacter",
	systemName: "Aspects of Nature",
	name: "Player Character",
	blocks: [
		row(number("damageLimit"), number("fatigueLimit"), number("skillPoints")),

		select(
			"budget",
			[
				select.choice("dirt", {
					displayName: "1. Dirt",
					hint: "Water and other freely-available resources",
				}),
				select.choice("cheap", {
					displayName: "2. Cheap",
					hint: "Common meals, simple clothing",
				}),
				select.choice("inexpensive", {
					displayName: "3. Inexpensive",
					hint: "Five-star meals, basic tools and weapons, reasonable lodging",
				}),
				select.choice("steep", {
					displayName: "4. Steep",
					hint: "Premium tools and weapons, extravagant clothing, comfortable lodging",
				}),
				select.choice("expensive", {
					displayName: "5. Expensive",
					hint: "A house, luxurious lodging",
				}),
				select.choice("valuable", {
					displayName: "6. Valuable",
					hint: "A mansion",
				}),
				select.choice("priceless", {
					displayName: "7. Priceless",
					hint: "An extremely rare, precious, powerful artifact",
				}),
			],
			{
				hint: "What's the most expensive thing you can afford? You can freely buy things two tiers down.",
			},
		),

		text("conditions", { multiline: true }),

		tabs(
			tab("character", [
				text("lineage", { multiline: true }),
				text("details", { multiline: true }),
			]),
			tab("stats", [
				row(
					column(
						number("strength", { labelPlacement: "left" }),
						number("sense", { labelPlacement: "left" }),
						number("dexterity", { labelPlacement: "left" }),
						number("intellect", { labelPlacement: "left" }),
						number("presence", { labelPlacement: "left" }),
					),
					column(
						number("fire", { labelPlacement: "left" }),
						number("water", { labelPlacement: "left" }),
						number("wind", { labelPlacement: "left" }),
						number("light", { labelPlacement: "left" }),
						number("darkness", { labelPlacement: "left" }),
					),
				),
			]),
			tab("skills", [
				number("aspectExperience", { displayName: "Aspect EXP" }),
				row(
					text("coreSkills", { multiline: true }),
					text("aspectSkills", { multiline: true }),
				),
			]),
			tab("items", [text("items", { multiline: true })]),
			tab("bonds", [text("bonds", { multiline: true })]),
		),
	],
}
