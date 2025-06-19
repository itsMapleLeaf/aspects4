import { Client as NotionClient } from "@notionhq/client"
import { existsSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { parseArgs } from "node:util"
import * as prettier from "prettier"
import { NotionPage } from "./lib/notion-page.ts"

const GUIDE_PAGE_ID = "1b1b0b885c0e803d8566fb10e0b5130c"

async function main() {
	const notionSecret = process.env.NOTION_SECRET
	if (!notionSecret) {
		console.error("Error: NOTION_SECRET environment variable is not set")
		process.exit(1)
	}

	const options = parseArgs({
		args: process.argv.slice(2),
		options: {
			format: {
				type: "boolean",
				default: true,
			},
			content: {
				type: "string",
			},
		},
	})

	const shouldSavePageContent =
		options.values.content == null || options.values.content?.startsWith("page")

	const shouldSaveDatabaseContent =
		options.values.content == null ||
		options.values.content?.startsWith("database") ||
		options.values.content?.startsWith("db")

	const shouldFormat = options.values.format

	const page = await NotionPage.cache.fetch(
		GUIDE_PAGE_ID,
		new NotionClient({ auth: notionSecret }),
	)

	if (shouldSavePageContent) {
		let content = await page.toMarkdown()
		if (shouldFormat) {
			console.info("Formatting... (pass --no-format to skip)")
			content = await prettier.format(content, { parser: "markdown" })
		}
		await writeFileNested(resolve("public/guide.md"), content)
	}

	if (shouldSaveDatabaseContent) {
		const databases = await page.collectDatabaseData()
		for (const [title, rows] of databases) {
			await writeFileNested(
				resolve(resolve("src/data"), `${title}.json`),
				JSON.stringify(rows, null, 2),
			)
		}
	}
}

async function writeFileNested(path: string, content: string) {
	const outputFolder = dirname(path)
	if (!existsSync(outputFolder)) {
		await mkdir(outputFolder, { recursive: true })
	}
	await writeFile(path, content)
}

if (!import.meta.main) {
	console.error("This file must be run as a standalone script")
	process.exit(1)
}

await main()
