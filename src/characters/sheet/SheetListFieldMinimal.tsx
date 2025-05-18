import type { ReactNode } from "react"
import { Button } from "../../components/ui/Button.tsx"
import { Icon } from "../../components/ui/Icon.tsx"
import { Tooltip } from "../../components/ui/Tooltip.tsx"
import { createFieldContext, type FieldContext } from "./fields.tsx"

export function SheetListFieldMinimal({
	context,
	id,
	description,
	children,
}: {
	context: FieldContext
	id: string
	description?: string
	children: (itemContext: FieldContext, index: number) => ReactNode
}) {
	const items: Record<string, unknown>[] = []
	if (Array.isArray(context.values[id])) {
		for (const value of context.values[id]) {
			if (typeof value === "object" && value != null) {
				items.push(value as Record<string, unknown>)
			}
		}
	}

	return (
		<div className="grid gap-3">
			<p className="text-sm whitespace-pre-line text-gray-300 empty:hidden">
				{description}
			</p>

			<div className="grid gap-1">
				{items.map((item, index) => {
					const itemContext = createFieldContext(item, (key, value) => {
						return context.updateValue(
							id,
							items.with(index, { ...item, [key]: value }),
						)
					})

					return (
						<div className="flex items-end gap-2" key={index}>
							<div className="min-w-0 flex-1">
								{children(itemContext, index)}
							</div>
							<Tooltip content="Remove">
								<Button
									icon={<Icon icon="mingcute:close-fill" />}
									onClick={() => {
										context.updateValue(id, items.toSpliced(index, 1))
									}}
								></Button>
							</Tooltip>
							<Tooltip content="Duplicate">
								<Button
									icon={<Icon icon="mingcute:copy-2-fill" />}
									onClick={() => {
										context.updateValue(id, items.toSpliced(index + 1, 0, item))
									}}
								></Button>
							</Tooltip>
						</div>
					)
				})}
			</div>

			<div>
				<Button
					icon={<Icon icon="mingcute:plus-fill" />}
					onClick={() => {
						context.updateValue(id, [...items, {}])
					}}
				>
					Add New
				</Button>
			</div>
		</div>
	)
}
