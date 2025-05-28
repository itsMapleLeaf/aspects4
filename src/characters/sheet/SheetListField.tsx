import type { ReactNode } from "react"
import { Button } from "../../components/ui/Button.tsx"
import { Icon } from "../../components/ui/Icon.tsx"
import {
	createResolvedListItemContext,
	type FieldContext,
	type ResolvedListField,
} from "./fields.ts"

export function SheetListField({
	resolved,
	description,
	children,
	extraActions,
}: {
	resolved: ResolvedListField
	description?: string
	children: (item: FieldContext) => ReactNode
	extraActions?: ReactNode
}) {
	return (
		<div className="grid gap-3">
			<div className="flex flex-wrap justify-between gap-2">
				<Button
					icon={<Icon icon="mingcute:plus-fill" />}
					onClick={() => {
						resolved.setItems([{}, ...resolved.items])
					}}
				>
					Add New
				</Button>
				<div className="flex flex-wrap gap-2">{extraActions}</div>
			</div>

			<div className="my-1.5 border-b border-gray-800" />

			<p className="text-sm whitespace-pre-line text-gray-300 empty:hidden">
				{description}
			</p>

			{resolved.items.map((item, index) => {
				return (
					<ListFieldItemLayout
						key={index}
						onRemove={() => {
							resolved.setItems(resolved.items.toSpliced(index, 1))
						}}
						onDuplicate={() => {
							resolved.setItems(resolved.items.toSpliced(index + 1, 0, item))
						}}
					>
						{children(createResolvedListItemContext(item, resolved, index))}
					</ListFieldItemLayout>
				)
			})}

			<div className="flex flex-wrap justify-between gap-2">
				<Button
					icon={<Icon icon="mingcute:plus-fill" />}
					onClick={() => {
						resolved.setItems([...resolved.items, {}])
					}}
				>
					Add New
				</Button>
				<div className="flex flex-wrap gap-2">{extraActions}</div>
			</div>
		</div>
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
