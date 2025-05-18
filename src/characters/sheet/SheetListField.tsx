import * as Ariakit from "@ariakit/react"
import type { ReactNode } from "react"
import { Button } from "../../components/ui/Button.tsx"
import { Field } from "../../components/ui/Field.tsx"
import { Icon } from "../../components/ui/Icon.tsx"
import { toTitleCase } from "../../lib/utils.ts"
import { createFieldContext, type FieldContext } from "./fields.tsx"

export function SheetListField({
	context,
	id,
	displayName,
	description,
	children,
}: {
	context: FieldContext
	id: string
	displayName?: string
	description?: string
	children: (itemContext: FieldContext) => ReactNode
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
		<ListFieldLayout
			heading={displayName ?? toTitleCase(id)}
			onAdd={() => {
				context.updateValue(id, [...items, {}])
			}}
		>
			<p className="text-sm whitespace-pre-line text-gray-300 empty:hidden">
				{description}
			</p>
			{items.map((item, index) => {
				const itemContext = createFieldContext(item, (key, value) => {
					return context.updateValue(
						id,
						items.with(index, { ...item, [key]: value }),
					)
				})

				return (
					<ListFieldItemLayout
						key={index}
						onRemove={() => {
							context.updateValue(id, items.toSpliced(index, 1))
						}}
						onDuplicate={() => {
							context.updateValue(id, items.toSpliced(index + 1, 0, item))
						}}
					>
						{children(itemContext)}
					</ListFieldItemLayout>
				)
			})}
		</ListFieldLayout>
	)
}

function ListFieldLayout({
	heading,
	children,
	onAdd,
}: {
	heading: ReactNode
	children: ReactNode
	onAdd: () => void
}) {
	return (
		<Ariakit.HeadingLevel>
			<Field
				label={
					<Ariakit.Heading className="mb-1 heading-xl">
						{heading}
					</Ariakit.Heading>
				}
			>
				<div className="grid gap-3">
					{children}
					<div>
						<Button icon={<Icon icon="mingcute:plus-fill" />} onClick={onAdd}>
							Add New
						</Button>
					</div>
				</div>
			</Field>
		</Ariakit.HeadingLevel>
	)
}

function ListFieldItemLayout({
	children,
	onRemove,
	onDuplicate,
}: {
	children: React.ReactNode
	onRemove: () => void
	onDuplicate: () => void
}) {
	return (
		<div className="grid gap-2">
			{children}
			<div className="flex gap-2">
				<Button icon={<Icon icon="mingcute:close-fill" />} onClick={onRemove}>
					Remove
				</Button>
				<Button
					icon={<Icon icon="mingcute:copy-2-fill" />}
					onClick={onDuplicate}
				>
					Duplicate
				</Button>
			</div>
			<div className="my-1.5 border-b border-gray-800" />
		</div>
	)
}
