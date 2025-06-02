import { ComponentProps, ReactNode, use, useId } from "react"
import { twMerge } from "tailwind-merge"
import { ResolvedNumberField } from "../../characters/sheet/fields.ts"
import { ChatInputContext } from "../../components/ChatInputContext.tsx"
import { Button } from "../../components/ui/Button.tsx"
import { Icon } from "../../components/ui/Icon.tsx"
import { Tooltip } from "../../components/ui/Tooltip.tsx"
import { useEditableNumber } from "../../components/useEditableNumber.ts"
import { toTitleCase } from "../../lib/utils.ts"

export function SheetStatField({
	resolved: field,
	label,
	description,
	tooltip: tooltipContent,
	score: scoreOverride,
	...props
}: {
	resolved: ResolvedNumberField
	label?: ReactNode
	description?: ReactNode
	tooltip?: ReactNode
	score?: number
} & ComponentProps<"div">) {
	const chatInputRef = use(ChatInputContext)
	const fieldId = useId()

	const editable = useEditableNumber({
		value: field.value,
		min: field.min,
		max: field.max,
		onChange: (value) => field.context.updateValue(field.id, value),
	})

	const score = scoreOverride ?? editable.value

	return (
		<div
			className={twMerge(
				"flex min-h-10 overflow-clip rounded-md border border-gray-800 bg-black/25",
				props.className,
			)}
		>
			<div className="flex flex-1 items-center rounded-l-md rounded-r-none transition">
				<Tooltip
					render={<label htmlFor={fieldId} />}
					content={tooltipContent}
					placement="top-start"
					className="flex flex-1 flex-col px-2.5 py-1.5 leading-tight transition ring-inset"
				>
					<div className="font-semibold">{label ?? toTitleCase(field.id)}</div>
					<div className="text-sm font-medium opacity-60 empty:hidden">
						{description}
					</div>
				</Tooltip>
				{score > 0 && (
					<Button
						type="button"
						appearance="ghost"
						className="flex h-full w-14 rounded-none p-0"
						align="center"
						onClick={() => {
							chatInputRef.current?.prefill(`/roll aspects ${score}`)
						}}
					>
						<DiceScoreIcon score={score} />
					</Button>
				)}
			</div>

			<div
				{...editable.rootProps()}
				className="w-12 rounded-r-md bg-black/25 outline-2 -outline-offset-2 outline-transparent transition *:size-full focus-within:bg-black/50 focus-within:outline-primary-400 hover:bg-black/50"
			>
				{editable.isEditing ?
					<input
						{...editable.inputProps()}
						id={fieldId}
						className="h-full text-center leading-none focus:outline-none"
					/>
				:	<button
						{...editable.buttonProps()}
						id={fieldId}
						className="h-full text-center leading-none focus:outline-none"
					>
						{editable.value}
					</button>
				}
			</div>
		</div>
	)
}

function DiceScoreIcon({ score }: { score: number }) {
	const scoreColorClass = twMerge(
		score <= 1 ? "text-red-400"
		: score <= 2 ? "text-yellow-400"
		: score <= 4 ? "text-emerald-400"
		: "text-purple-400",
	)
	return (
		<div className={twMerge("flex items-center gap-1", scoreColorClass)}>
			<Icon icon="mingcute:box-3-fill" className="size-6 opacity-75" />
			<span className="min-w-2 text-end whitespace-nowrap tabular-nums">
				{score}
			</span>
		</div>
	)
}
