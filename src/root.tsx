/* eslint-disable react-refresh/only-export-components */
import "@fontsource-variable/quicksand/index.css"
import "./styles/index.css"

import { ConvexAuthProvider } from "@convex-dev/auth/react"
import {
	Authenticated,
	AuthLoading,
	ConvexReactClient,
	Unauthenticated,
} from "convex/react"
import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router"
import type { Route } from "./+types/root"
import { DocumentTitle } from "./features/app/DocumentTitle.tsx"
import { LoadingScreen } from "./features/ui/LoadingScreen.tsx"
import { AuthScreen } from "./features/user/AuthScreen.tsx"

export const meta: Route.MetaFunction = () => [{ title: "Aspects VTT" }]

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
]

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="break-words [word-break:break-word]">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	)
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

export default function App() {
	return (
		<ConvexAuthProvider client={convex}>
			<DocumentTitle title="Aspects VTT">
				<AuthLoading>
					<LoadingScreen className="min-h-screen" />
				</AuthLoading>
				<Authenticated>
					<Outlet />
				</Authenticated>
				<Unauthenticated>
					<AuthScreen />
				</Unauthenticated>
			</DocumentTitle>
		</ConvexAuthProvider>
	)
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!"
	let details = "An unexpected error occurred."
	let stack: string | undefined

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error"
		details =
			error.status === 404 ?
				"The requested page could not be found."
			:	error.statusText || details
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message
		stack = error.stack
	}

	return (
		<main className="container mx-auto p-4 pt-16">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full overflow-x-auto p-4">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	)
}
