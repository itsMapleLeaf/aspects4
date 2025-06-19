import {
	Client,
	Client as NotionClient,
	collectPaginatedAPI,
	isFullBlock,
	isFullPage,
	iteratePaginatedAPI,
} from "@notionhq/client"
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints"
import { camelCase, invariant, kebabCase, mapKeys } from "es-toolkit"
import * as yaml from "yaml"
import { AsyncCache } from "./AsyncCache.ts"
import { formatBlockChildren } from "./notion-block.ts"
import {
	formatRichText,
	type FormatRichTextItemOptions,
} from "./notion-rich-text.ts"
import { prettify } from "./utils.ts"

export type PageProperty = PageObjectResponse["properties"][string]

export type PagePropertyExcludingTitle = Exclude<
	PageProperty,
	{ type: "title" }
>

export type PagePropertyValue = string | number | null

export class NotionPage {
	static readonly cache = new AsyncCache(
		async (pageId, notion: NotionClient) => {
			const data = await notion.pages.retrieve({ page_id: pageId })
			invariant(
				isFullPage(data),
				`expected full page, received: ${prettify(data)}`,
			)
			return new NotionPage(data, notion)
		},
	)

	readonly title: string = "Unknown Title"
	readonly properties: Record<string, PagePropertyExcludingTitle> = {}

	readonly #data: PageObjectResponse
	readonly #notion: NotionClient

	constructor(data: PageObjectResponse, notion: NotionClient) {
		this.#data = data
		this.#notion = notion

		for (const [key, property] of Object.entries(data.properties)) {
			if (property.type === "title") {
				this.title = formatRichText(property.title)
			} else {
				this.properties[key] = property
			}
		}
	}

	async toMarkdown(baseHeadingLevel = 1) {
		let output = ""

		if (Object.keys(this.properties).length > 0) {
			output += yaml.stringify(this.properties) + `---\n\n`
		}

		output += `${"#".repeat(baseHeadingLevel)} ${this.title}\n\n`

		output += await formatBlockChildren(
			this.#notion,
			this.#data.id,
			"",
			baseHeadingLevel + 1,
		)

		return output
	}

	async collectDatabaseData() {
		const databases = new Map<string, Record<string, string>[]>()
		await this.#collectDatabasesRecursive(this.#data.id, databases)
		return databases
	}

	async #collectDatabasesRecursive(
		rootBlockId: string,
		databases: Map<string, Record<string, PagePropertyValue>[]>,
	) {
		const blocks = await Array.fromAsync(
			iteratePaginatedAPI(this.#notion.blocks.children.list, {
				block_id: rootBlockId,
			}),
			(block) => {
				invariant(isFullBlock(block), `expected full block: ${prettify(block)}`)
				return block
			},
		)

		for (const block of blocks) {
			if (block.has_children) {
				await this.#collectDatabasesRecursive(block.id, databases)
				continue
			}

			if (block.type === "child_page") {
				await this.#collectDatabasesRecursive(block.id, databases)
				continue
			}

			if (block.type !== "child_database") {
				continue
			}

			const title = kebabCase(block.child_database.title)

			// technically there can be different databases with the same name,
			// but for now we don't care
			if (databases.has(title)) {
				console.info(`Already fetched ${block.child_database.title}, skipping`)
				continue
			}

			const rows: Record<string, PagePropertyValue>[] = []
			databases.set(title, rows)

			console.info(`Fetching database ${block.child_database.title}...`)

			try {
				for (const row of await collectPaginatedAPI(
					this.#notion.databases.query,
					{
						database_id: block.id,
					},
				)) {
					invariant(isFullPage(row), `expected full page: ${prettify(row)}`)

					const page = new NotionPage(row, this.#notion)
					const rowObject = await page.flattenProperties({ asPlainText: true })
					rows.push(mapKeys(rowObject, (_value, key) => camelCase(key)))
				}
			} catch (error) {
				console.error(`Error fetching database: ${block.id}`, error)
			}
		}
	}

	async flattenProperties(
		options?: FormatRichTextItemOptions,
	): Promise<Record<string, PagePropertyValue>> {
		return Object.fromEntries(
			await Array.fromAsync(
				Object.entries(this.#data.properties),
				async ([name, property]) => [
					name,
					await flattenPageProperty(this.#notion, property, options),
				],
			),
		)
	}
}

async function flattenPageProperty(
	notion: Client,
	property: PageProperty,
	options?: FormatRichTextItemOptions,
): Promise<PagePropertyValue> {
	if (property.type === "title") {
		return formatRichText(property.title, options)
	}

	if (property.type === "rich_text") {
		return formatRichText(property.rich_text, options)
	}

	if (property.type === "select") {
		return property.select?.name ?? ""
	}

	if (property.type === "multi_select") {
		return property.multi_select.map((value) => value.name).join(", ")
	}

	if (property.type === "relation") {
		const relatedPages = await Array.fromAsync(property.relation, (related) =>
			NotionPage.cache.fetch(related.id, notion),
		)
		return relatedPages.map((page) => page.title).join(", ")
	}

	if (property.type === "number") {
		return property.number ?? null
	}

	console.warn(`Unsupported database property:`, property)
	return JSON.stringify(property)
}
