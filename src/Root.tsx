import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react"
import { Authenticated, AuthLoading, ConvexReactClient, Unauthenticated, useMutation, useQuery } from "convex/react"
import { useActionState, useState } from "react"
import { Route, Switch, useLocation } from "wouter"
import { api } from "../convex/_generated/api"
import { AuthScreen } from "./components/AuthScreen.tsx"
import { DocumentTitle } from "./components/DocumentTitle.tsx"
import { Room } from "./components/Room.tsx"
import { Button } from "./components/ui/Button.tsx"
import { Input } from "./components/ui/Input.tsx"
import { LoadingScreen } from "./components/ui/LoadingScreen.tsx"
import { DragProvider } from "./contexts/DragContext.tsx"
import { panel } from "./styles/panel.ts"

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

function AuthenticatedRoutes() {
	return (
		<>
			<AuthLoading>
				<LoadingScreen className="min-h-screen" />
			</AuthLoading>
			<Authenticated>
				<Switch>
					<Route path="/rooms/:slug">
						{(params) => <Room slug={params.slug} />}
					</Route>
					<Route path="/">
						<Landing />
					</Route>
				</Switch>
			</Authenticated>
			<Unauthenticated>
				<AuthScreen />
			</Unauthenticated>
		</>
	)
}

export function Root() {
	return (
		<ConvexAuthProvider client={convex}>
			<DragProvider>
				<DocumentTitle title="Aspects VTT">
					<AuthenticatedRoutes />
				</DocumentTitle>
			</DragProvider>
		</ConvexAuthProvider>
	)
}

function Landing() {
	const [roomName, setRoomName] = useState("")
	const [slugInput, setSlugInput] = useState("")
	const slug = slugify(slugInput || roomName)

	const existingRoom = useQuery(api.rooms.getBySlug, { slug })
	const createRoom = useMutation(api.rooms.create)

	const [_, navigate] = useLocation()

	const [error, action, pending] = useActionState(async () => {
		if (!roomName.trim()) {
			return "Please enter a room name"
		}

		if (existingRoom) {
			return "A room with this slug already exists"
		}

		try {
			await createRoom({
				name: roomName,
				slug,
			})
			navigate(`/rooms/${slug}`)
		} catch (error) {
			console.error(error)
			return "Sorry, something went wrong. Try again."
		}
	}, "")

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4">
			<div className={panel("flex w-96 flex-col gap-4 p-6")}>
				<h1 className="text-2xl font-light text-white">Create a New Room</h1>
				<form className="contents" action={action}>
					<Input
						name="roomName"
						label="Room name"
						placeholder="Enter room name"
						required
						value={roomName}
						onChange={(event) => setRoomName(event.target.value)}
					/>

					<div>
						<Input
							name="roomSlug"
							label="Room slug"
							placeholder={slugify(roomName)}
							value={slugInput}
							onChange={(event) => setSlugInput(slugify(event.target.value))}
						/>
						<p className="mt-1 text-sm font-semibold text-gray-300">
							Used in the URL. Can only contain lowercase letters, numbers, and
							hyphens (-).
						</p>
					</div>

					{error && (
						<div className="text-sm font-semibold text-red-400">{error}</div>
					)}

					<Button type="submit" disabled={pending} className="self-start">
						{pending ? "Creating..." : "Create Room"}
					</Button>
				</form>
			</div>
			<SignOutButton />
		</div>
	)
}

function slugify(name: string) {
	return name
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^\w-]+/g, "")
}

function SignOutButton() {
	const { signOut } = useAuthActions()
	const [_, startSignOut, isPending] = useActionState(async () => {
		await signOut()
		return null
	}, null)

	return (
		<button
			type="button"
			onClick={startSignOut}
			className="text-primary-400 text-sm hover:underline"
			disabled={isPending}
		>
			{isPending ? "Signing out..." : "Sign out"}
		</button>
	)
}
