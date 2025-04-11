import { createContext, use, useEffect } from "react"

const DocumentTitleContext = createContext("")

export function DocumentTitle({
	title,
	children,
}: {
	title: string
	children: React.ReactNode
}) {
	const parentTitle = use(DocumentTitleContext)
	useEffect(() => {
		document.title = title
		return () => {
			document.title = parentTitle
		}
	}, [parentTitle, title])
	return <DocumentTitleContext value={title}>{children}</DocumentTitleContext>
}
