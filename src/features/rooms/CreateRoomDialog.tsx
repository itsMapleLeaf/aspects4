import * as Ariakit from "@ariakit/react"
import { useMutation, useQuery } from "convex/react"
import { useActionState, useState } from "react"
import { useLocation } from "wouter"
import { api } from "../../../convex/_generated/api"
import { Button } from "../ui/Button.tsx"
import { Dialog, DialogButton, DialogPanel } from "../ui/Dialog.tsx"
import { Icon } from "../ui/Icon.tsx"
import { Input } from "../ui/Input.tsx"

export function CreateRoomDialog() {
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
