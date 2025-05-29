import { randomInt, sum } from "es-toolkit"

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
			error: "Error: Invalid dice count. Must be from 1 to 100.",
		}
	}

	const values = []
	for (let i = 0; i < count; i++) {
		const faceValues = [1, 1, 1, 2, 2, 3]
		const value = faceValues[randomInt(faceValues.length)] as number
		values.push(value)
	}

	const result = sum(values)
	const rollMessage = `Rolled ${count} dice. Result: ${result} (${values.join(", ")})`
	return { success: true, message: rollMessage }
}
