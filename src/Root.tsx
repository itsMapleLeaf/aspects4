import { ConvexAuthProvider } from "@convex-dev/auth/react"
import {
	Authenticated,
	AuthLoading,
	ConvexReactClient,
	Unauthenticated,
} from "convex/react"
import { Route, Switch } from "wouter"
import { AccountSettings } from "./components/AccountSettings.tsx"
import { AuthScreen } from "./components/AuthScreen.tsx"
import { DocumentTitle } from "./components/DocumentTitle.tsx"
import { Room } from "./components/Room.tsx"
import { RoomsList } from "./components/RoomsList.tsx"
import { LoadingScreen } from "./components/ui/LoadingScreen.tsx"
import { DragProvider } from "./contexts/DragContext.tsx"

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

export function Root() {
	return (
		<ConvexAuthProvider client={convex}>
			<DragProvider>
				<DocumentTitle title="Aspects VTT">
					<AuthLoading>
						<LoadingScreen className="min-h-screen" />
					</AuthLoading>
					<Authenticated>
						<Switch>
							<Route path="/">
								<RoomsList />
							</Route>
							<Route path="/rooms/:slug">
								{(params) => <Room slug={params.slug} />}
							</Route>
							<Route path="/account/settings">
								<AccountSettings />
							</Route>
						</Switch>
					</Authenticated>
					<Unauthenticated>
						<AuthScreen />
					</Unauthenticated>
				</DocumentTitle>
			</DragProvider>
		</ConvexAuthProvider>
	)
}
