import { ConvexAuthProvider } from "@convex-dev/auth/react"
import {
	Authenticated,
	AuthLoading,
	ConvexReactClient,
	Unauthenticated,
} from "convex/react"
import { Route, Switch } from "wouter"
import { DocumentTitle } from "./features/app/DocumentTitle.tsx"
import { Room } from "./features/rooms/Room.tsx"
import { RoomList } from "./features/rooms/RoomList.tsx"
import { LoadingScreen } from "./features/ui/LoadingScreen.tsx"
import { AccountSettings } from "./features/user/AccountSettings.tsx"
import { AuthScreen } from "./features/user/AuthScreen.tsx"

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

export function Root() {
	return (
		<ConvexAuthProvider client={convex}>
			<DocumentTitle title="Aspects VTT">
				<AuthLoading>
					<LoadingScreen className="min-h-screen" />
				</AuthLoading>
				<Authenticated>
					<Switch>
						<Route path="/">
							<RoomList />
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
		</ConvexAuthProvider>
	)
}
