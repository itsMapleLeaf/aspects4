import {
	APIResponseError,
	Client,
	isFullBlock,
	isFullDatabase,
	isFullPage,
	iteratePaginatedAPI,
} from "@notionhq/client"
import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints"
import { invariant, sortBy } from "es-toolkit"
import { flattenPageProperties, formatPage } from "./notion-page.ts"
import { formatRichText } from "./notion-rich-text.ts"
import { compactJoin, prettify } from "./utils.ts"

export async function formatBlockChildren(
	notion: Client,
	blockId: string,
	linePrefix: string,
	baseHeadingLevel = 1,
): Promise<string> {
	console.info("Fetching block children:", blockId)

	const children = await Array.fromAsync(
		iteratePaginatedAPI(notion.blocks.children.list, {
			block_id: blockId,
		}),
	)

	const content = await Promise.all(
		children.map((child) => {
			invariant(isFullBlock(child), `expected full block: ${prettify(child)}`)
			return formatBlock(notion, child, baseHeadingLevel)
		}),
	)

	return content
		.map((chunk) =>
			chunk
				.split("\n")
				.map((line) => linePrefix + line)
				.join("\n"),
		)
		.join("\n\n")
}

export async function formatBlock(
	notion: Client,
	block: BlockObjectResponse,
	baseHeadingLevel = 1,
): Promise<string> {
	if (block.type === "heading_1") {
		return `${"#".repeat(baseHeadingLevel)} ${formatRichText(block.heading_1.rich_text)}`
	}

	if (block.type === "heading_2") {
		return `${"#".repeat(baseHeadingLevel + 1)} ${formatRichText(block.heading_2.rich_text)}`
	}

	if (block.type === "heading_3") {
		return `${"#".repeat(baseHeadingLevel + 2)} ${formatRichText(block.heading_3.rich_text)}`
	}

	if (block.type === "paragraph") {
		return compactJoin("\n\n", [
			formatRichText(block.paragraph.rich_text),
			block.has_children &&
				(await formatBlockChildren(notion, block.id, "  ", baseHeadingLevel)),
		])
	}

	if (block.type === "bulleted_list_item") {
		return compactJoin("\n\n", [
			`- ${formatRichText(block.bulleted_list_item.rich_text)}`,
			block.has_children &&
				(await formatBlockChildren(notion, block.id, "  ", baseHeadingLevel)),
		])
	}

	if (block.type === "numbered_list_item") {
		return compactJoin("\n\n", [
			`1. ${formatRichText(block.numbered_list_item.rich_text)}`,
			block.has_children &&
				(await formatBlockChildren(notion, block.id, "  ", baseHeadingLevel)),
		])
	}

	if (block.type === "quote") {
		return compactJoin("\n\n", [
			`> ${formatRichText(block.quote.rich_text)}`,
			block.has_children &&
				(await formatBlockChildren(notion, block.id, "> ", baseHeadingLevel)),
		])
	}

	if (block.type === "code") {
		const caption = formatRichText(block.code.caption)
		return compactJoin("\n\n", [
			compactJoin("\n", [
				`\`\`\`${block.code.language}`,
				formatRichText(block.code.rich_text),
				await formatBlockChildren(notion, block.id, "", baseHeadingLevel),
				"```",
			]),
			caption && compactJoin("\n", ["<aside>", caption, "</aside>"]),
		])
	}

	if (block.type === "callout") {
		return compactJoin("\n\n", [
			"<aside>",
			compactJoin(" ", [
				block.callout.icon?.type === "emoji" && block.callout.icon.emoji,
				formatRichText(block.callout.rich_text),
			]),
			block.has_children &&
				(await formatBlockChildren(notion, block.id, "", baseHeadingLevel)),
			"</aside>",
		])
	}

	if (block.type === "divider") {
		return "---"
	}

	if (block.type === "table") {
		let columnNames: string[] = []
		const rows = []

		const children = await Array.fromAsync(
			iteratePaginatedAPI(notion.blocks.children.list, {
				block_id: block.id,
			}),
			(child) => {
				invariant(isFullBlock(child), `expected full block: ${prettify(child)}`)
				return child
			},
		)

		for (const child of children) {
			invariant(isFullBlock(child), `expected full block: ${prettify(child)}`)

			if (child.type !== "table_row") continue

			// notion is dumb and backwards; "has column header" means the table has "Header row" enabled lol
			if (columnNames.length === 0 && block.table.has_column_header) {
				columnNames = child.table_row.cells.map((cell) => formatRichText(cell))
			} else {
				rows.push(child.table_row.cells.map((cell) => formatRichText(cell)))
			}
		}

		return formatMarkdownTable(columnNames, rows)
	}

	if (block.type === "table_row") {
		return await formatBlockChildren(notion, block.id, "", baseHeadingLevel)
	}

	if (block.type === "child_database") {
		console.info("Querying database:", block.child_database.title)

		let columnNames: string[] = []

		try {
			const database = await notion.databases.retrieve({
				database_id: block.id,
			})
			invariant(
				isFullDatabase(database),
				`expected full database: ${prettify(database)}`,
			)

			columnNames = sortBy(Object.values(database.properties), [
				// make sure the title is the first column
				(item) => (item.type === "title" ? 0 : 1),
			]).map((item) => item.name)
		} catch (error) {
			// notion errors when trying to fetch a linked database,
			// but we also can't tell a linked database from a regular database,
			// so we'll just ignore it
			if (
				error instanceof APIResponseError &&
				error.message.includes("is a linked database")
			) {
				console.warn(
					`Cannot fetch "${block.child_database.title}", which is a linked database; columns may be out of order!`,
				)
			} else {
				console.warn(`Failed to query database:`, error)
			}
		}

		const rows = []

		const rawItems = await Array.fromAsync(
			iteratePaginatedAPI(notion.databases.query, {
				database_id: block.id,
			}),
		)

		for (const item of rawItems) {
			if (isFullPage(item)) {
				rows.push(await flattenPageProperties(notion, item))
			} else {
				console.warn(`Unsupported database item:`, item)
			}
		}

		// if we failed to fetch column names earlier, infer them from the keys of rows
		if (columnNames.length === 0) {
			columnNames = [...new Set(rows.flatMap((row) => Object.keys(row)))]
		}

		return formatMarkdownTable(
			columnNames,
			rows.map((row) => columnNames.map((key) => row[key] ?? "")),
		)
	}

	if (block.type === "child_page") {
		const page = await notion.pages.retrieve({ page_id: block.id })
		invariant(isFullPage(page), `expected full page: ${prettify(page)}`)
		return await formatPage(notion, page, baseHeadingLevel + 1)
	}

	// catch-all for generic "container" blocks, like synced blocks and columns
	// also a decent fallback for unknown blocks--just render their children, which will probably have known blocks
	if (block.has_children) {
		return await formatBlockChildren(notion, block.id, "", baseHeadingLevel)
	}

	console.warn(`Unsupported block type ${block.type}, skipping`)
	return `<!-- unsupported block type: ${block.type} -->`
}

function formatMarkdownTable(columnNames: string[], rows: string[][]): string {
	return compactJoin("\n", [
		`| ${columnNames.join(" | ")} |`,
		`| ${columnNames.map(() => "---").join(" | ")} |`,
		...rows.map((cells) => `| ${cells.join(" | ")} |`),
	])
}
