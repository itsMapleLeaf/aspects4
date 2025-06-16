import { randomInt, range } from "es-toolkit"

type DiceRollResult = { success: boolean; message: string }

export function rollDice(args: string[]): DiceRollResult {
	const rollArg = args.join(" ")

	// Check for Aspects of Nature format: "aspects X" or "aX"
	const aspectsPattern = /^aspects\s+(\d+)(?:\s*\[([^\]]+)\])?$/i
	const aspectsMatch = rollArg.match(aspectsPattern)

	if (aspectsMatch && aspectsMatch[1]) {
		const diceCount = parseInt(aspectsMatch[1], 10)
		const label = aspectsMatch[2]
		return rollAspectsDice(diceCount, label)
	}

	const aspectsShortPattern = /^a(\d+)(?:\s*\[([^\]]+)\])?$/i
	const aspectsShortMatch = rollArg.match(aspectsShortPattern)

	if (aspectsShortMatch && aspectsShortMatch[1]) {
		const diceCount = parseInt(aspectsShortMatch[1], 10)
		const label = aspectsShortMatch[2]
		return rollAspectsDice(diceCount, label)
	}

	// Standard dice rolling format: XdY
	const rollPattern = /^(\d+)d(\d+)$/
	const rollMatch = rollArg.match(rollPattern)

	if (!rollMatch || !rollMatch[1] || !rollMatch[2]) {
		return {
			success: false,
			message: `Error: Invalid roll format.`,
		}
	}

	const diceCount = parseInt(rollMatch[1], 10)
	const sides = parseInt(rollMatch[2], 10)

	if (diceCount <= 0 || diceCount > 100 || sides <= 0) {
		return {
			success: false,
			message: `Error: Invalid dice parameters.`,
		}
	}

	const rolls = []
	for (let i = 0; i < diceCount; i++) {
		rolls.push(Math.floor(Math.random() * sides) + 1)
	}

	const rollMessage = `Rolled ${diceCount}d${sides}: ${rolls.join(", ")}`
	return { success: true, message: rollMessage }
}

export function rollAspectsDice(count: number, label?: string): DiceRollResult {
	if (count <= 0 || count > 100) {
		return {
			success: false,
			message: "Error: Invalid dice count. Must be from 1 to 100.",
		}
	}

	const values = range(count)
		.map(() => randomInt(6) + 1)
		.sort((a, b) => b - a)
	const max = Math.max(...values)

	const result =
		values.filter((v) => v === 6).length >= 2 ? "Critical impact!"
		: max === 6 ? "High impact."
		: max >= 4 ? "Medium impact."
		: "Low impact."

	const prefix =
		label ? `Rolled ${label} (${count} dice)` : `Rolled ${count} dice`

	const rollMessage = `${prefix}: ${values.join(", ")}\n${result}`
	return { success: true, message: rollMessage }
}
