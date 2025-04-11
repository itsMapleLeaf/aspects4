type DiceRollResult =
	| { success: true; message: string }
	| { success: false; error: string }

export function rollDice(args: string[]): DiceRollResult {
	const rollArg = args.join(" ")

	// Check for Aspects of Nature format: "aspects X" or "aX"
	const aspectsPattern = /^aspects\s+(\d+)$/i
	const aspectsMatch = rollArg.match(aspectsPattern)

	if (aspectsMatch && aspectsMatch[1]) {
		const diceCount = parseInt(aspectsMatch[1], 10)
		return rollAspectsDice(diceCount)
	}

	const aspectsShortPattern = /^a(\d+)$/i
	const aspectsShortMatch = rollArg.match(aspectsShortPattern)

	if (aspectsShortMatch && aspectsShortMatch[1]) {
		const diceCount = parseInt(aspectsShortMatch[1], 10)
		return rollAspectsDice(diceCount)
	}

	// Standard dice rolling format: XdY
	const rollPattern = /^(\d+)d(\d+)$/
	const rollMatch = rollArg.match(rollPattern)

	if (!rollMatch || !rollMatch[1] || !rollMatch[2]) {
		return {
			success: false,
			error: `Error: Invalid roll format.`,
		}
	}

	const diceCount = parseInt(rollMatch[1], 10)
	const sides = parseInt(rollMatch[2], 10)

	if (diceCount <= 0 || diceCount > 100 || sides <= 0) {
		return {
			success: false,
			error: `Error: Invalid dice parameters.`,
		}
	}

	const rolls = []
	for (let i = 0; i < diceCount; i++) {
		rolls.push(Math.floor(Math.random() * sides) + 1)
	}

	const rollMessage = `Rolled ${diceCount}d${sides}: ${rolls.join(", ")}`
	return { success: true, message: rollMessage }
}

export function rollAspectsDice(count: number): DiceRollResult {
	if (count <= 0 || count > 100) {
		return {
			success: false,
			error: "Error: Invalid dice count. Must be between 1 and 100.",
		}
	}

	const rolls = []
	let successCount = 0

	for (let i = 0; i < count; i++) {
		const roll = Math.floor(Math.random() * 12) + 1
		rolls.push(roll)

		if (roll >= 9 && roll <= 11) {
			successCount += 1
		} else if (roll === 12) {
			successCount += 2
		}
	}

	const rollMessage = `Rolled ${count} dice: ${successCount} successes (${rolls.join(", ")})`
	return { success: true, message: rollMessage }
}
