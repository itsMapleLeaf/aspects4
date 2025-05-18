import * as Ariakit from "@ariakit/react"
import { Fragment } from "react/jsx-runtime"
import { EditableTextField } from "~/components/EditableTextField.tsx"
import { Button } from "~/components/ui/Button.tsx"
import { Field } from "~/components/ui/Field.tsx"
import { Icon } from "~/components/ui/Icon.tsx"
import { SelectField } from "~/components/ui/SelectField.tsx"
import { useLocalStorageState } from "~/hooks/storage.ts"
import { toTitleCase } from "~/lib/utils.ts"
import type { Character } from "./character.ts"
import type { CharacterSheet, CharacterSheetBlock } from "./sheet.tsx"

export function CharacterEditor({
	character,
	schema,
	onChangeName,
	onSaveValue,
}: {
	character: Character
	schema: CharacterSheet
	onChangeName: (name: string) => void
	onSaveValue: (key: string, value: unknown) => void
}) {
	return (
		<div className="grid gap-3">
			<EditableTextField
				label="Name"
				value={character.name}
				onChange={onChangeName}
			/>
			{schema.render(character).map((block) => (
				<CharacterSheetBlockElement
					key={block.id}
					block={block}
					values={character.values}
					onSaveValue={onSaveValue}
				/>
			))}
		</div>
	)
}

function CharacterSheetBlockElement({
	block,
	values,
	onSaveValue,
}: {
	block: CharacterSheetBlock
	values: Record<string, unknown>
	onSaveValue: (key: string, value: unknown) => void
}) {
	if (block.type === "row") {
		return (
			<div className="grid auto-cols-fr grid-flow-col gap-3">
				{block.children.map((child) => (
					<CharacterSheetBlockElement
						key={child.id}
						block={child}
						values={values}
						onSaveValue={onSaveValue}
					/>
				))}
			</div>
		)
	}

	if (block.type === "column") {
		return (
			<div className="grid gap-3">
				{block.children.map((child) => (
					<CharacterSheetBlockElement
						key={child.id}
						block={child}
						values={values}
						onSaveValue={onSaveValue}
					/>
				))}
			</div>
		)
	}

	if (block.type === "text") {
		return (
			<EditableTextField
				label={block.displayName || toTitleCase(block.id)}
				description={block.hint}
				multiline={block.multiline}
				value={String(values[block.id] ?? block.defaultValue ?? "")}
				onChange={(value) => onSaveValue(block.id, value)}
			/>
		)
	}

	if (block.type === "number") {
		return block.render({ onSaveValue })
	}

	if (block.type === "select") {
		const value = String(values[block.id] ?? block.defaultValue ?? "")
		return (
			<div>
				<SelectField
					label={block.displayName || toTitleCase(block.id)}
					description={block.hint}
					placeholder="Choose one"
					value={value}
					onChangeValue={(value) => {
						onSaveValue(block.id, value)
					}}
					options={block.choices.map((choice) => ({
						value: choice.id,
						label: choice.displayName || toTitleCase(choice.id),
						description: choice.hint,
					}))}
				/>
				<p className="mt-1 text-sm text-gray-300 empty:hidden">
					{block.choices.find((choice) => choice.id === value)?.description}
				</p>
			</div>
		)
	}

	if (block.type === "tabs") {
		return (
			<CharacterSheetTabProvider
				blockId={block.id}
				defaultTabId={block.tabs[0].id}
			>
				<Ariakit.TabList className="grid auto-cols-fr grid-flow-col gap-1 rounded-md bg-gray-950/25 p-1">
					{block.tabs.map((tab) => (
						<Ariakit.Tab
							key={tab.id}
							id={tab.id}
							className="rounded px-3 py-1.5 text-gray-400 transition hover:text-gray-100 aria-selected:bg-white/10 aria-selected:text-white"
						>
							{tab.name || toTitleCase(tab.id)}
						</Ariakit.Tab>
					))}
				</Ariakit.TabList>

				{block.tabs.map((tab) => (
					<Ariakit.TabPanel key={tab.id} id={tab.id}>
						<div className="grid gap-3">
							{tab.children.map((child) => (
								<CharacterSheetBlockElement
									key={child.id}
									block={child}
									values={values}
									onSaveValue={onSaveValue}
								/>
							))}
						</div>
					</Ariakit.TabPanel>
				))}
			</CharacterSheetTabProvider>
		)
	}

	if (block.type === "list") {
		const unsafeItems = values[block.id]

		const items =
			!Array.isArray(unsafeItems) ?
				[]
			:	unsafeItems.flatMap((item) =>
					typeof item === "object" && item != null ?
						[item as Record<string, unknown>]
					:	[],
				)

		return (
			<Ariakit.HeadingLevel>
				<Field
					label={
						<Ariakit.Heading className="mb-2.5 heading-2xl">
							{block.displayName ?? toTitleCase(block.id)}
						</Ariakit.Heading>
					}
				>
					<div className="grid gap-3">
						{items.map((item, index) => (
							<Fragment key={index}>
								<div className="grid gap-2">
									{block.itemFields.map((field) => (
										<CharacterSheetBlockElement
											key={field.id}
											block={field}
											values={item}
											onSaveValue={(key, value) => {
												onSaveValue(
													block.id,
													items.with(index, { ...item, [key]: value }),
												)
											}}
										/>
									))}
									<div className="flex gap-2">
										<Button
											icon={<Icon icon="mingcute:close-fill" />}
											onClick={() => {
												onSaveValue(block.id, items.toSpliced(index, 1))
											}}
										>
											Remove
										</Button>
										<Button
											icon={<Icon icon="mingcute:copy-2-fill" />}
											onClick={() => {
												onSaveValue(
													block.id,
													items.toSpliced(index + 1, 0, item),
												)
											}}
										>
											Duplicate
										</Button>
									</div>
								</div>
								<div className="my-1.5 border-b border-gray-800" />
							</Fragment>
						))}
						<div>
							<Button
								icon={<Icon icon="mingcute:plus-fill" />}
								onClick={() => {
									onSaveValue(block.id, [...items, {}])
								}}
							>
								Add New
							</Button>
						</div>
					</div>
				</Field>
			</Ariakit.HeadingLevel>
		)
	}

	return <p>(field type "{block.type}" not supported)</p>
}

function CharacterSheetTabProvider({
	blockId,
	defaultTabId,
	children,
}: {
	blockId: string
	defaultTabId: string | undefined | null
	children: React.ReactNode
}) {
	const [selectedId, setSelectedId] = useLocalStorageState(
		`CharacterSheetTabProvider:selectedId:${blockId}`,
		defaultTabId,
		(input) => (typeof input === "string" ? input : defaultTabId),
	)
	return (
		<Ariakit.TabProvider
			selectedId={selectedId ?? defaultTabId}
			setSelectedId={setSelectedId}
		>
			{children}
		</Ariakit.TabProvider>
	)
}
