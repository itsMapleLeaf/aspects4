import * as Ariakit from "@ariakit/react"
import { ConvexAuthProvider } from "@convex-dev/auth/react"
import {
	Authenticated,
	AuthLoading,
	ConvexReactClient,
	Unauthenticated,
	useMutation,
	useQuery,
} from "convex/react"
import { formatDistanceToNow } from "date-fns"
import { useActionState, useState } from "react"
import { Link, Route, Switch, useLocation } from "wouter"
import { api } from "../convex/_generated/api"
import { AppHeader } from "./components/AppHeader.tsx"
import { AuthScreen } from "./components/AuthScreen.tsx"
import { DocumentTitle } from "./components/DocumentTitle.tsx"
import { Room } from "./components/Room.tsx"
import { Button } from "./components/ui/Button.tsx"
import { Dialog, DialogButton, DialogPanel } from "./components/ui/Dialog.tsx"
import { Icon } from "./components/ui/Icon.tsx"
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
					<Route path="/">
						<RoomsList />
					</Route>
					<Route path="/rooms/:slug">
						{(params) => <Room slug={params.slug} />}
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

function RoomsList() {
	const rooms = useQuery(api.rooms.list)

	return (
		<div className="flex min-h-screen flex-col">
			<AppHeader>
				<div className="flex w-full flex-col items-center justify-center">
					<main className="w-full max-w-screen-md px-6 py-4">
						<Ariakit.HeadingLevel>
							<div className="mb-4 flex items-center justify-between">
								<Ariakit.Heading className="text-2xl font-light text-white">
									Your rooms
								</Ariakit.Heading>
								<CreateRoomDialog />
							</div>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
								{rooms?.length ?
									rooms.map((room) => (
										<Link
											key={room._id}
											to={`/rooms/${room.slug}`}
											className={panel(
												"flex flex-col items-start gap-2 px-3 py-2.5 transition hover:border-gray-700 hover:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none",
											)}
										>
											<Ariakit.HeadingLevel>
												<Ariakit.Heading className="text-xl/tight font-medium text-white">
													{room.name}
												</Ariakit.Heading>
												<p className="flex items-center gap-1 text-sm text-gray-400">
													<span className="sr-only">Created at</span>
													<Icon icon="mingcute:time-fill" />
													<time
														dateTime={new Date(
															room._creationTime,
														).toISOString()}
													>
														{formatDistanceToNow(room._creationTime, {
															addSuffix: true,
														})}
													</time>
												</p>
											</Ariakit.HeadingLevel>
										</Link>
									))
								:	<div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
										<p className="mb-4 text-gray-400">
											You don't have any rooms yet
										</p>
									</div>
								}
							</div>
						</Ariakit.HeadingLevel>
					</main>
				</div>
			</AppHeader>
		</div>
	)
}

function CreateRoomDialog() {
	const dialog = Ariakit.useDialogStore()
	const [roomName, setRoomName] = useState("")
	const [slugInput, setSlugInput] = useState("")
	const slug = slugify(slugInput || roomName)

	const existingRoom = useQuery(api.rooms.getBySlug, { slug })
	const createRoom = useMutation(api.rooms.create)

	const [, navigate] = useLocation()

	const [error, action, isPending] = useActionState(async () => {
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
			dialog.hide()
			setRoomName("")
			setSlugInput("")
			navigate(`/rooms/${slug}`)
		} catch (error) {
			console.error(error)
			return "Sorry, something went wrong. Try again."
		}
	}, undefined)

	return (
		<Dialog store={dialog}>
			<Button
				icon={<Icon icon="mingcute:open-door-fill" />}
				render={<DialogButton store={dialog} />}
			>
				Create a room
			</Button>
			<DialogPanel store={dialog} title="Create a new room" className="h-fit">
				<form action={action} className="flex flex-col gap-4">
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

					<Button type="submit" disabled={isPending} className="self-start">
						{isPending ? "Creating..." : "Create room"}
					</Button>
				</form>
			</DialogPanel>
		</Dialog>
	)
}

function slugify(name: string) {
	return name
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^\w-]+/g, "")
}
