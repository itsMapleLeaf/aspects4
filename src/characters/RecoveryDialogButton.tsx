import * as Ariakit from "@ariakit/react"
import { invariant } from "es-toolkit"
import { use, useState } from "react"
import { ChatInputContext } from "../components/ChatInputContext.tsx"
import { Button } from "../components/ui/Button.tsx"
import { Dialog, DialogButton, DialogPanel } from "../components/ui/Dialog.tsx"
import { SelectField } from "../components/ui/SelectField.tsx"
import {
	aspectsDiceImpactDescriptions,
	AspectsDiceSuccessResult,
	rollAspectsDice,
	rollNumericDice,
} from "../lib/dice.ts"
import { raise } from "../lib/utils.ts"
import { resolveAspectFields } from "./aspects.ts"
import { useEditorCharacterSheet } from "./context.tsx"
import { AspectName } from "./data.ts"

export function RecoveryDialogButton() {
	const sheet = useEditorCharacterSheet()
	const aspectFields = resolveAspectFields(sheet)
	const chatInputRef = use(ChatInputContext)
	const [aspect, setAspect] = useState<AspectName>("Fire")

	type RecoveryTarget = {
		label: string
		handleRoll: (rollResult: AspectsDiceSuccessResult) => void
	}

	const targets: Record<string, RecoveryTarget> = {
		stress: {
			label: "Heal from a chosen stress pool",
			handleRoll: (rollResult) => {
				let recoveryLevel = {
					low: 0,
					medium: 1,
					high: 2,
					critical: 3,
				}[rollResult.impact]

				if (aspect === "Light") {
					recoveryLevel += 1
				}

				if (recoveryLevel === 0) {
					chatInputRef.current?.sendMessage(
						`${rollResult.message}\nHeal 1 stress from a chosen pool.`,
					)
				} else if (recoveryLevel === 4) {
					chatInputRef.current?.sendMessage(
						`${rollResult.message}\nHeal all stress from a chosen pool.`,
					)
				} else {
					const recoveredAmount = rollNumericDice(recoveryLevel, 6)
					const recoveryAmountDiceValueList = recoveredAmount.values.join(" + ")
					const recoverySummary = `Heal ${recoveredAmount.sum} stress from a chosen pool.`
					chatInputRef.current?.sendMessage(
						`${rollResult.message}\n${recoverySummary} (${recoveryLevel}d6 -> ${recoveryAmountDiceValueList})\n`,
					)
				}
			},
		},

		experiences: {
			label: "Restore experiences",
			handleRoll: (rollResult) => {
				let experienceCount = {
					low: 0,
					medium: 1,
					high: 2,
					critical: 3,
				}[rollResult.impact]

				if (aspect === "Darkness") {
					experienceCount += 1
				}

				chatInputRef.current?.sendMessage(
					`${rollResult.message}\nRecover ${experienceCount} experience(s).`,
				)
			},
		},
	}

	const [target, setTarget] = useState(
		() => Object.keys(targets)[0] ?? raise("no targets defined"),
	)

	return (
		<Dialog>
			<Button render={<DialogButton />} icon="mingcute:heartbeat-2-fill">
				Recovery
			</Button>

			<DialogPanel title="Recovery">
				<div className="flex gap-2">
					<SelectField
						className="flex-1"
						label="Effect"
						choices={Object.entries(targets).map(([value, info]) => ({
							value,
							label: info.label,
						}))}
						value={target ?? "damage"}
						onChangeValue={setTarget}
					/>
					<SelectField
						className="w-48"
						label="Aspect"
						choices={Object.entries(aspectFields).map(([name, field]) => ({
							value: name,
							label: `${name} (${field.computedScore})`,
							description:
								name === "Light" ? "+1 die for damage"
								: name === "Darkness" ? "+1 die for experiences"
								: undefined,
						}))}
						value={aspect}
						onChangeValue={setAspect}
					/>
				</div>

				<Button
					icon="mingcute:heartbeat-2-fill"
					render={<Ariakit.DialogDismiss />}
					onClick={() => {
						const potential = aspectFields[aspect]?.computedScore
						invariant(potential != null, `invalid aspect "${aspect}"`)

						const rollResult = rollAspectsDice(
							potential,
							`recovery (${target}, ${aspect})`,
						)
						invariant(rollResult.success, "Roll failed for some reason")

						invariant(targets[target], "Unknown effect")
						targets[target].handleRoll({
							...rollResult,
							message: `Recovering ${target} with ${aspect}.\n${aspectsDiceImpactDescriptions[rollResult.impact]} (${rollResult.values.join(
								", ",
							)})`,
						})
					}}
				>
					Roll {aspect} to recover {target}
				</Button>

				<p className="muted-sm">You can also heal allies!</p>
			</DialogPanel>
		</Dialog>
	)
}
