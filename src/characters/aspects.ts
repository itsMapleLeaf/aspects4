import {
	type CharacterSheet,
	column,
	list,
	number,
	row,
	select,
	tab,
	tabs,
	text,
} from "./character.schema.ts"

export const aspectsCharacterSheet: CharacterSheet = {
	id: "aspectsPlayerCharacter",
	systemName: "Aspects of Nature",
	name: "Player Character",
	blocks: [
		row(number("damageLimit"), number("fatigueLimit"), number("skillPoints")),

		select("budget", {
			hint: "What's the most expensive thing you can afford? You can freely buy things two tiers down.",
			choices: [
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
		}),

		text("conditions", { multiline: true }),

		tabs(
			tab("character", [
				text("lineage", { multiline: true }),
				text("details", { multiline: true }),
			]),
			tab("stats", [
				row(
					column(
						number("strength", { labelPlacement: "left", min: 1 }),
						number("sense", { labelPlacement: "left", min: 1 }),
						number("dexterity", { labelPlacement: "left", min: 1 }),
						number("intellect", { labelPlacement: "left", min: 1 }),
						number("presence", { labelPlacement: "left", min: 1 }),
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
			tab("items", [
				list("items", [
					row(
						text("name", { defaultValue: "New Item" }),
						row(
							select("type", {
								defaultValue: "tool",
								choices: [
									select.choice("consumable", {
										hint: "Goes away when there are no more uses",
									}),
									select.choice("tool", {
										hint: "Can be used and reused while held",
									}),
									select.choice("wearable", {
										hint: "Can be worn for a persistent effect",
									}),
								],
							}),
							row(number("size", { min: 1 }), number("uses", {})),
						),
					),
					text("description", { multiline: true }),
				]),
			]),
			tab("bonds", [
				{
					id: "bonds",
					type: "list",
					itemFields: [
						row(
							text("name", { defaultValue: "New Bond" }),
							row(number("strength", { min: 1 })),
						),
						select("aura", {
							choices: [
								{
									id: "Fire",
									description: `indicates an adversarial, heated, conflict-heavy relationship.`,
									hint: `indicates an adversarial, heated, conflict-heavy relationship.`,
								},
								{
									id: "Water",
									description: `comes from notions of comfort, peace, and protection.`,
									hint: `comes from notions of comfort, peace, and protection.`,
								},
								{
									id: "Wind",
									description: `exhibits in turbulent relationships full of excitement and change.`,
									hint: `exhibits in turbulent relationships full of excitement and change.`,
								},
								{
									id: "Light",
									description: `represents diplomatic relationships built on fairness and respect.`,
									hint: `represents diplomatic relationships built on fairness and respect.`,
								},
								{
									id: "Darkness",
									description: `manifests from tension, mistrust, and uncertainty.`,
									hint: `manifests from tension, mistrust, and uncertainty.`,
								},
							],
						}),
						text("description", { multiline: true }),
					],
				},
			]),
		),
	],
}
