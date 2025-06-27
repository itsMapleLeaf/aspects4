import { Fragment, useState, type ReactNode } from "react"
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
	renderViewModeItem,
	renderEditModeItem,
	children,
}: {
	resolved: ResolvedListField
	description?: string
	renderViewModeItem?: (item: FieldContext) => ReactNode
	renderEditModeItem?: (item: FieldContext) => ReactNode
	/** @deprecated */
	children?: (item: FieldContext) => ReactNode
}) {
	const [mode, setMode] = useState<"view" | "edit">(
		resolved.items.length > 0 ? "view" : "edit",
	)

	return (
		<div className="grid gap-3">
			<p className="text-sm whitespace-pre-line text-gray-300 empty:hidden">
				{description}
			</p>

			{resolved.items.map((item, index) => (
				// eslint-disable-next-line react-x/no-array-index-key
				<Fragment key={index}>
					{(renderViewModeItem || renderEditModeItem) && mode === "view" ?
						(renderViewModeItem ?? children)?.(
							createResolvedListItemContext(item, resolved, index),
						)
					:	<ListFieldItemLayout
							onRemove={() => {
								resolved.setItems(resolved.items.toSpliced(index, 1))
							}}
							onDuplicate={() => {
								resolved.setItems(resolved.items.toSpliced(index + 1, 0, item))
							}}
						>
							{(renderEditModeItem ?? children)?.(
								createResolvedListItemContext(item, resolved, index),
							)}
						</ListFieldItemLayout>
					}
				</Fragment>
			))}

			<div className="flex flex-wrap justify-between gap-2">
				<div>
					{(renderViewModeItem || renderEditModeItem) &&
						(mode === "view" ?
							<Button
								icon="mingcute:edit-2-fill"
								onClick={() => setMode("edit")}
							>
								Edit
							</Button>
						:	<Button icon="mingcute:check-fill" onClick={() => setMode("view")}>
								Done
							</Button>)}
				</div>
				<Button
					icon={<Icon icon="mingcute:plus-fill" />}
					onClick={() => {
						resolved.setItems([...resolved.items, {}])
					}}
				>
					Add New
				</Button>
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
