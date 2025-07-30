import { Heading, HeadingLevel } from "@ariakit/react"
import { useMutation, useQuery } from "convex/react"
import { startTransition, useActionState, useState } from "react"
import { twMerge } from "tailwind-merge"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import type { ClientRoom } from "../../convex/rooms.ts"
import type { NormalizedScene } from "../../convex/scenes.ts"
import { Button } from "./ui/Button.tsx"
import { Field } from "./ui/Field.tsx"
import { Icon } from "./ui/Icon.tsx"
import { Input } from "./ui/Input.tsx"
import { LoadingSpinner } from "./ui/LoadingSpinner.tsx"
import { Menu, MenuButton, MenuItem, MenuPanel } from "./ui/Menu.tsx"
import { SmallIconButton } from "./ui/SmallIconButton.tsx"

export function ScenesPanel({
	room,
	className,
}: {
	room: ClientRoom
	className?: string
}) {
	const scenes = useQuery(api.scenes.list, { roomId: room._id })
	const deactivateScene = useMutation(api.scenes.deactivate)
	const [showCreateForm, setShowCreateForm] = useState(false)

	return (
		<section
			className={twMerge(
				"isolate flex h-full flex-col gap-4 overflow-y-auto panel p-4 will-change-scroll [scrollbar-gutter:stable]",
				className,
			)}
		>
			<HeadingLevel>
				<header className="sticky -top-4 z-10 -m-4 flex h-16 items-center justify-between bg-gray-900 px-4">
					<Heading className="heading-xl">Scenes</Heading>
					<div className="flex items-center gap-1">
						{room.activeSceneId && (
							<SmallIconButton
								icon="mingcute:eye-close-line"
								label="Deactivate Scene"
								onClick={() => deactivateScene({ roomId: room._id })}
							/>
						)}
						<SmallIconButton
							icon="lucide:image-plus"
							label="Create Scene"
							className="-mr-2"
							onClick={() => setShowCreateForm(true)}
						/>
					</div>
				</header>

				{showCreateForm && (
					<CreateSceneForm
						roomId={room._id}
						onCancel={() => setShowCreateForm(false)}
						onSuccess={() => setShowCreateForm(false)}
					/>
				)}

				<div className="flex-1 space-y-2 overflow-y-auto">
					{!room.activeSceneId && scenes && scenes.length > 0 && (
						<div className="rounded-lg border border-zinc-600 bg-zinc-700/30 p-3">
							<div className="flex items-center gap-2 text-zinc-300">
								<Icon icon="mingcute:layers-line" className="size-5" />
								<span className="font-medium">No active scene</span>
							</div>
							<div className="mt-1 text-sm text-zinc-400">
								Showing sprites not assigned to any scene
							</div>
						</div>
					)}

					{scenes === undefined ?
						<div className="flex items-center justify-center p-4">
							<LoadingSpinner />
						</div>
					: scenes.length === 0 ?
						<div className="flex flex-col items-center justify-center py-8 text-center text-zinc-400">
							<Icon icon="mingcute:layers-2-line" className="mb-2 size-8" />
							<div>No scenes yet</div>
							<div className="text-sm">Create a scene to get started</div>
						</div>
					:	scenes.map((scene) => (
							<SceneCard
								key={scene._id}
								scene={scene}
								isActive={room.activeSceneId === scene._id}
							/>
						))
					}
				</div>
			</HeadingLevel>
		</section>
	)
}

function CreateSceneForm({
	roomId,
	onCancel,
	onSuccess,
}: {
	roomId: Id<"rooms">
	onCancel: () => void
	onSuccess: () => void
}) {
	const createScene = useMutation(api.scenes.create)
	const [name, setName] = useState("")

	const [error, formAction, isPending] = useActionState(async () => {
		try {
			if (!name.trim()) {
				return "Scene name is required"
			}

			await createScene({
				roomId,
				name: name.trim(),
			})

			setName("")
			onSuccess()
		} catch (err) {
			return err instanceof Error ? err.message : "Failed to create scene"
		}
	}, null)

	return (
		<form action={formAction} className="space-y-2">
			<Field label="Scene Name">
				<Input
					value={name}
					onChange={(event) => setName(event.target.value)}
					placeholder="Enter scene name..."
					autoFocus
				/>
			</Field>
			{error && <div className="text-sm text-red-400">{error}</div>}
			<div className="flex gap-2">
				<Button
					type="submit"
					icon={<Icon icon="mingcute:check-fill" />}
					pending={isPending}
					disabled={!name.trim()}
				>
					Create
				</Button>
				<Button
					type="button"
					appearance="ghost"
					onClick={onCancel}
					icon={<Icon icon="mingcute:close-fill" />}
				>
					Cancel
				</Button>
			</div>
		</form>
	)
}

function SceneCard({
	scene,
	isActive,
}: {
	scene: NormalizedScene
	isActive: boolean
}) {
	const activateScene = useMutation(api.scenes.activate)
	const updateScene = useMutation(api.scenes.update)
	const removeScene = useMutation(api.scenes.remove)
	const [isEditing, setIsEditing] = useState(false)
	const [editName, setEditName] = useState(scene.name)

	const handleActivate = () => {
		if (!isActive) {
			startTransition(() => {
				activateScene({ sceneId: scene._id })
			})
		}
	}

	const handleSaveEdit = async () => {
		if (editName.trim() && editName !== scene.name) {
			await updateScene({
				sceneId: scene._id,
				name: editName.trim(),
			})
		}
		setIsEditing(false)
	}

	const handleCancelEdit = () => {
		setEditName(scene.name)
		setIsEditing(false)
	}

	const handleDelete = () => {
		if (
			confirm(
				`Delete scene "${scene.name}"? This will remove all sprites in this scene.`,
			)
		) {
			startTransition(() => {
				removeScene({ sceneId: scene._id })
			})
		}
	}

	return (
		<div
			className={`rounded-lg border p-3 ${
				isActive ?
					"border-primary-500 bg-primary-500/10"
				:	"border-zinc-700 bg-zinc-800/50"
			}`}
		>
			<div className="flex items-center justify-between">
				<div className="flex-1">
					{isEditing ?
						<div className="flex gap-2">
							<Input
								value={editName}
								onChange={(event) => setEditName(event.target.value)}
								className="flex-1"
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										handleSaveEdit()
									} else if (event.key === "Escape") {
										handleCancelEdit()
									}
								}}
								autoFocus
							/>
							<Button
								size="sm"
								icon={<Icon icon="mingcute:check-fill" />}
								onClick={handleSaveEdit}
							/>
							<Button
								size="sm"
								appearance="ghost"
								icon={<Icon icon="mingcute:close-fill" />}
								onClick={handleCancelEdit}
							/>
						</div>
					:	<div className="flex items-center gap-2">
							<button
								className="flex-1 text-left font-medium hover:text-primary-400"
								onClick={handleActivate}
							>
								{scene.name}
							</button>
							{isActive && (
								<div className="rounded bg-primary-500 px-2 py-1 text-xs font-medium">
									Active
								</div>
							)}
						</div>
					}
				</div>

				{!isEditing && (
					<Menu>
						<MenuButton
							render={
								<Button
									size="sm"
									appearance="ghost"
									icon={<Icon icon="mingcute:more-2-fill" />}
								/>
							}
						/>
						<MenuPanel>
							<MenuItem onClick={() => setIsEditing(true)}>
								<Icon icon="mingcute:edit-2-line" />
								<span>Rename</span>
							</MenuItem>
							<MenuItem
								onClick={handleDelete}
								className="text-red-400 hover:bg-red-500/20"
							>
								<Icon icon="mingcute:delete-2-line" />
								<span>Delete</span>
							</MenuItem>
						</MenuPanel>
					</Menu>
				)}
			</div>

			<div className="mt-2 text-sm text-zinc-400">
				{scene.spriteCount} {scene.spriteCount === 1 ? "sprite" : "sprites"}
			</div>
		</div>
	)
}
