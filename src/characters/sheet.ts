/**
 * @example
 * 	const sheet = CharacterSheet.create()
 *
 * 	const row = sheet.addRow()
 * 	const damageLimitField = row.addNumberField("damageLimit")
 * 	const fatigueLimitField = row.addNumberField("fatigueLimit")
 * 	const skillPointsField = row.addNumberField("skillPoints")
 */
export class CharacterSheet {
	blocks: CharacterSheetBlock[] = []

	static create() {}
}

class CharacterSheetBlock {}
