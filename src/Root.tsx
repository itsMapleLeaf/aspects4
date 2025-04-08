import { ConvexProvider, ConvexReactClient } from "convex/react"
import { Room } from "./components/Room.tsx"

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

export function Root() {
	return (
		<ConvexProvider client={convex}>
			<Room />
		</ConvexProvider>
	)
}
