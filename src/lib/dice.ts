import { randomInt, range, sum } from "es-toolkit"

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

	const numericRollResult = rollNumericDice(diceCount, sides)

	let rollMessage = `Rolled ${diceCount}d${sides}: ${numericRollResult.values.join(", ")}`
	if (numericRollResult.values.length > 1) {
		rollMessage += ` = ${numericRollResult.sum}`
	}

	return { success: true, message: rollMessage }
}

export function rollNumericDice(count: number, sides: number) {
	const values = []
	for (let i = 0; i < count; i++) {
		values.push(Math.floor(Math.random() * sides) + 1)
	}
	return { values, sum: sum(values) }
}

export type AspectsDiceImpact = "low" | "medium" | "high" | "critical"

export const aspectsDiceImpactDescriptions: Record<AspectsDiceImpact, string> =
	{
		low: "Low impact.",
		medium: "Medium impact.",
		high: "High impact.",
		critical: "Critical impact!",
	}

export type AspectsDiceSuccessResult = {
	success: true
	message: string
	values: readonly number[]
	impact: AspectsDiceImpact
}

export type AspectsDiceResult =
	| AspectsDiceSuccessResult
	| { success: false; message: string }

export function rollAspectsDice(
	count: number,
	label?: string,
): AspectsDiceResult {
	if (count < 0 || count > 100) {
		return {
			success: false,
			message: "Error: Invalid dice count. Must be from 1 to 100.",
		}
	}

	const values = range(count === 0 ? 2 : count)
		.map(() => randomInt(6) + 1)
		.sort((a, b) => b - a)

	const resolved = count === 0 ? Math.min(...values) : Math.max(...values)

	const impact: AspectsDiceImpact =
		values.filter((v) => v === 6).length >= 2 && count > 0 ? "critical"
		: resolved === 6 ? "high"
		: resolved >= 4 ? "medium"
		: "low"

	const prefix =
		label ? `Rolled ${label} (${count} potential)` : `Rolled ${count} dice`

	const impactDescription = aspectsDiceImpactDescriptions[impact]

	const rollMessage = `${prefix}: ${values.join(", ")}\n${impactDescription}`

	return {
		success: true,
		message: rollMessage,
		values,
		impact,
	}
}
