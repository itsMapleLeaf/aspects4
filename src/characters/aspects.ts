import {
	type CharacterSheet,
	column,
	list,
	numberField,
	row,
	select,
	tab,
	tabs,
	text,
} from "./sheet.ts"

export const aspectsCharacterSheet: CharacterSheet = {
	id: "aspectsPlayerCharacter",
	systemName: "Aspects of Nature",
	name: "Player Character",
	render: (character) => {
		const attributeScoreFields = {
			strength: numberField("strength", { labelPlacement: "left", min: 1 }),
			sense: numberField("sense", { labelPlacement: "left", min: 1 }),
			dexterity: numberField("dexterity", { labelPlacement: "left", min: 1 }),
			intellect: numberField("intellect", { labelPlacement: "left", min: 1 }),
			presence: numberField("presence", { labelPlacement: "left", min: 1 }),
		}

		const aspectScoreFields = {
			fire: numberField("fire", { labelPlacement: "left" }),
			water: numberField("water", { labelPlacement: "left" }),
			wind: numberField("wind", { labelPlacement: "left" }),
			light: numberField("light", { labelPlacement: "left" }),
			darkness: numberField("darkness", { labelPlacement: "left" }),
		}

		const damageLimit =
			attributeScoreFields.strength.get(character.values) +
			attributeScoreFields.dexterity.get(character.values)

		const fatigueLimit =
			attributeScoreFields.sense.get(character.values) +
			attributeScoreFields.intellect.get(character.values) +
			attributeScoreFields.presence.get(character.values)

		return [
			row("skillPointsContainer", numberField("skillPoints")),

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

			text("conditions", {
				multiline: true,
				hint: `Damage limit: ${damageLimit}\nFatigue limit: ${fatigueLimit}`,
			}),

			tabs(
				"tabs",
				tab("character", [
					text("lineage", { multiline: true }),
					text("details", { multiline: true }),
				]),
				tab("stats", [
					row(
						"statsRows",
						column(
							"attributeScoresColumn",
							...Object.values(attributeScoreFields),
						),
						column("aspectScoresColumn", ...Object.values(aspectScoreFields)),
					),
				]),
				tab("skills", [
					numberField("aspectExperience", { displayName: "Aspect EXP" }),
					row(
						"skillsLists",
						text("coreSkills", { multiline: true }),
						text("aspectSkills", { multiline: true }),
					),
				]),
				tab("items", [
					list("items", [
						row(
							"itemsContainer1",
							text("name", { defaultValue: "New Item" }),
							row(
								"itemsContainer2",
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
								row(
									"itemStats",
									numberField("size", { min: 1 }),
									numberField("uses", {}),
								),
							),
						),
						text("description", { multiline: true }),
					]),
				]),
				tab("bonds", [
					list("bonds", [
						row(
							"bondsContainer1",
							text("name", { defaultValue: "New Bond" }),
							row("bondStrengthContainer", numberField("strength", { min: 1 })),
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
					]),
				]),
			),
		]
	},
}
