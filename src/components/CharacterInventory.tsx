import type { CharacterItem } from "~/lib/character.ts"
import { InputField, TextAreaField } from "./CharacterSheet.tsx"
import { Button } from "./ui/Button.tsx"
import { Icon } from "./ui/Icon.tsx"

export function CharacterInventory({
	items,
	onChange,
}: {
	items: CharacterItem[]
	onChange: (items: CharacterItem[]) => void
}) {
	return (
		<ul className="flex flex-col gap-3">
			{items.map((item, index) => (
				<li key={index}>
					<CharacterItemForm
						item={item}
						onChange={(item) => {
							onChange(items.with(index, item))
						}}
						onRemove={() => {
							onChange(items.filter((_, i) => i !== index))
						}}
					/>
				</li>
			))}
			<li>
				<Button
					className="self-start"
					icon={<Icon icon="mingcute:package-2-fill" />}
					onClick={() => {
						onChange([...items, { name: "", description: "" }])
					}}
				>
					Add Item
				</Button>
			</li>
		</ul>
	)
}

function CharacterItemForm({
	item,
	onChange,
	onRemove,
}: {
	item: CharacterItem
	onChange: (item: CharacterItem) => void
	onRemove: () => void
}) {
	return (
		<div className="grid gap-4 rounded border border-gray-800 bg-gray-950/25 p-3">
			<div className="flex items-end justify-between gap-2">
				<InputField
					label="Name"
					className="flex-1"
					autoFocus
					value={item.name}
					onChange={(event) => {
						onChange({ ...item, name: event.target.value })
					}}
				/>
				<Button
					onClick={() => onRemove()}
					icon={<Icon icon="mingcute:close-fill" />}
				>
					Remove
				</Button>
			</div>

			<TextAreaField
				label="Description"
				value={item.description}
				onChange={(event) => {
					onChange({ ...item, description: event.target.value })
				}}
			/>
		</div>
	)
}
