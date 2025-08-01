import * as Ariakit from "@ariakit/react"
import {} from "es-toolkit"
import { useState } from "react"
import type { Except } from "type-fest"
import { parseNumberSafe } from "../../lib/utils.ts"
import { panel } from "../../styles/panel.ts"
import { Button } from "../ui/Button.tsx"
import { Icon } from "../ui/Icon.tsx"
import { InputField } from "../ui/InputField.tsx"

interface CharacterRestButtonProps
	extends Except<React.ComponentProps<typeof Button>, "onSubmit"> {
	onSubmit: (hourCount: number) => void
}

export function CharacterRestButton({
	onSubmit,
	...props
}: CharacterRestButtonProps) {
	const [open, setOpen] = useState(false)
	const [hourCount, setHourCount] = useState(1)

	return (
		<Ariakit.PopoverProvider open={open} setOpen={setOpen}>
			<Button
				icon={<Icon icon="mingcute:sleep-fill" />}
				render={<Ariakit.PopoverDisclosure />}
				{...props}
			>
				Rest
			</Button>
			<Ariakit.Popover
				backdrop={
					<div className="fixed inset-0 bg-black/25 opacity-0 transition data-enter:opacity-100" />
				}
				className={panel(
					"grid translate-y-2 gap-3 opacity-0 transition data-enter:translate-y-0 data-enter:opacity-100",
				)}
				gutter={8}
			>
				<form
					className="contents"
					action={async () => {
						onSubmit(hourCount)
						setOpen(false)
					}}
				>
					<InputField
						label="Hours"
						type="number"
						min={1}
						value={hourCount}
						onChange={(event) =>
							setHourCount(
								Math.max(parseNumberSafe(event.target.value) ?? 1, 1),
							)
						}
					/>
					<Button type="submit" icon={<Icon icon="mingcute:sleep-fill" />}>
						Rest for {hourCount} {hourCount === 1 ? "hour" : "hours"}
					</Button>
					<p className="text-sm font-medium text-gray-200">
						You will heal {hourCount >= 8 ? "all of your" : hourCount} fatigue.
					</p>
				</form>
			</Ariakit.Popover>
		</Ariakit.PopoverProvider>
	)
}
