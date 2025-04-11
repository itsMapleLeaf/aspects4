import { ConvexProvider, ConvexReactClient, useMutation } from "convex/react"
import { Route, Switch, useLocation } from "wouter"
import { api } from "../convex/_generated/api"
import { Id } from "../convex/_generated/dataModel"
import { DocumentTitle } from "./components/DocumentTitle.tsx"
import { Room } from "./components/Room.tsx"
import { Button } from "./components/ui/Button.tsx"
import { Input } from "./components/ui/Input.tsx"
import { DragProvider } from "./contexts/DragContext.tsx"
import { panel } from "./styles/panel.ts"

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

export function Root() {
	return (
		<ConvexProvider client={convex}>
			<DragProvider>
				<DocumentTitle title="Aspects VTT">
					<Switch>
						<Route path="/rooms/:roomId">
							{(params) => <Room roomId={params.roomId as Id<"rooms">} />}
						</Route>
						<Route path="/">
							<Landing />
						</Route>
					</Switch>
				</DocumentTitle>
			</DragProvider>
		</ConvexProvider>
	)
}

function Landing() {
	const createRoom = useMutation(api.rooms.create)
	const [_, navigate] = useLocation()

	return (
		<div className="flex min-h-screen items-center justify-center">
			<form
				className={panel("flex flex-col gap-4 p-6")}
				onSubmit={async (event) => {
					event.preventDefault()
					const formData = new FormData(event.currentTarget)
					const roomName = formData.get("roomName") as string

					if (!roomName.trim()) {
						alert("Please enter a room name")
						return
					}

					try {
						// Create the room and get back the Convex ID
						const roomId: Id<"rooms"> = await createRoom({ name: roomName })
						// Navigate to the new room using the string representation of the ID
						navigate(`/rooms/${roomId.toString()}`)
					} catch (error) {
						console.error(error)
						alert("Failed to create room. Please try again.")
					}
				}}
			>
				<h1 className="text-2xl font-light text-white">Create a New Room</h1>
				<Input
					name="roomName"
					label="Room name"
					placeholder="Enter room name"
					required
				/>
				<Button
					type="submit"
					appearance="default"
					size="default"
					className="w-full"
				>
					Create Room
				</Button>
			</form>
		</div>
	)
}
