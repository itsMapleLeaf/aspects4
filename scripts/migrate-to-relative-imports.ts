import { relative } from "node:path"
import { Project, SyntaxKind } from "ts-morph"

const project = new Project({
	tsConfigFilePath: "tsconfig.json",
	skipAddingFilesFromTsConfig: true,
	skipLoadingLibFiles: true,
})

const sourceFiles = project.addSourceFilesAtPaths("src/**")

await Array.fromAsync(sourceFiles, async (sourceFile) => {
	const updated = []

	for (const importDeclaration of sourceFile.getChildrenOfKind(
		SyntaxKind.ImportDeclaration,
	)) {
		const specifier = importDeclaration.getModuleSpecifier()
		if (!specifier.getLiteralValue().startsWith("~")) continue

		const specifierSourceFile = importDeclaration.getModuleSpecifierSourceFile()
		if (!specifierSourceFile) {
			console.warn(`No source file for ${specifier.getLiteralValue()}`)
			continue
		}

		const newSpecifier =
			sourceFile.getRelativePathAsModuleSpecifierTo(specifierSourceFile) +
			specifierSourceFile.getExtension()

		updated.push({
			current: specifier.getLiteralValue(),
			next: newSpecifier,
		})

		specifier.setLiteralValue(newSpecifier)
	}

	if (updated.length > 0) {
		await sourceFile.save()

		console.info()
		console.info(`${relative(process.cwd(), sourceFile.getFilePath())}:`)

		for (const { current, next } of updated) {
			console.info(`${current} -> ${next}`)
		}
	}
})
