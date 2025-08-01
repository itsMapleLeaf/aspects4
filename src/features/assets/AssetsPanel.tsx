import { Heading, HeadingLevel } from "@ariakit/react"
import { type } from "arktype"
import { useMutation, useQuery } from "convex/react"
import {
	startTransition,
	useActionState,
	useDeferredValue,
	useEffect,
	useRef,
	useState,
} from "react"
import { createPortal } from "react-dom"
import { twMerge } from "tailwind-merge"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import type { NormalizedAsset } from "../../../convex/assets.ts"
import type { NormalizedSprite } from "../../../convex/sprites.ts"
import { getThumbnailUrl } from "../../lib/images.ts"
import { getViewportCenter, ViewportTransform } from "../../lib/viewport.ts"
import { useFileUpload } from "../files/useFileUpload.ts"
import { Icon } from "../ui/Icon.tsx"
import { LoadingSpinner } from "../ui/LoadingSpinner.tsx"
import { Menu, MenuButton, MenuItem, MenuPanel } from "../ui/Menu.tsx"
import { SmallIconButton } from "../ui/SmallIconButton.tsx"
import { Tooltip } from "../ui/Tooltip.tsx"

export const AssetDropData = type("string.json.parse").to({
	assetId: "string",
})

export function AssetsPanel({
	room,
	viewportTransform,
	onAssetAdded,
	className,
}: {
	room: {
		_id: Id<"rooms">
		backgroundAssetId: Id<"assets"> | null | undefined
	}
	viewportTransform: ViewportTransform
	onAssetAdded?: () => void
	className?: string
}) {
	const createAsset = useMutation(api.assets.create)
	const createSprite = useMutation(api.sprites.place)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const uploadFile = useFileUpload()

	const [, importFiles, isFileImportPending] = useActionState(
		async (_state, files: Iterable<File>) => {
			for (const file of files) {
				try {
					const { width, height } = await createImageBitmap(file)
					const storageId = await uploadFile(file)
					if (!storageId) return
					await createAsset({
						name: file.name,
						type: file.type,
						size: { x: width, y: height },
						storageId,
					})
				} catch (error) {
					console.error(error)
				}
			}
		},
	)

	const [isFileOver, setIsFileOver] = useState(false)
	useEffect(() => {
		const controller = new AbortController()

		window.addEventListener(
			"dragenter",
			(event) => {
				if (event.dataTransfer?.types.includes("Files")) {
					event.preventDefault()
					setIsFileOver(true)
				}
			},
			{ signal: controller.signal },
		)

		window.addEventListener(
			"dragleave",
			(event) => {
				if (event.dataTransfer?.types.includes("Files")) {
					event.preventDefault()
					setIsFileOver(false)
				}
			},
			{ signal: controller.signal },
		)

		window.addEventListener(
			"dragover",
			(event) => {
				if (event.dataTransfer?.types.includes("Files")) {
					event.preventDefault()
					setIsFileOver(true)
				}
			},
			{ signal: controller.signal },
		)

		window.addEventListener(
			"drop",
			async (event) => {
				const isFileType = event.dataTransfer?.types.includes("Files")
				if (!isFileType) return

				event.preventDefault()
				setIsFileOver(false)
				importFiles(event.dataTransfer?.files ?? [])
			},
			{ signal: controller.signal },
		)

		return () => {
			controller.abort()
		}
	})

	return (
		<section
			className={twMerge(
				"isolate flex h-full flex-col gap-4 overflow-y-auto panel p-4 will-change-scroll [scrollbar-gutter:stable]",
				className,
			)}
		>
			<HeadingLevel>
				<header className="sticky -top-4 z-10 -m-4 flex h-16 items-center justify-between bg-gray-900 px-4">
					<Heading className="heading-xl">Assets</Heading>
					{isFileImportPending ?
						<LoadingSpinner className="size-5" />
					:	<SmallIconButton
							icon="mdi:file-import"
							label="Import Asset"
							className="-mr-2"
							onClick={() => {
								fileInputRef.current?.click()
							}}
						/>
					}
					<input
						ref={fileInputRef}
						type="file"
						multiple
						accept="image/*"
						hidden
						onChange={async (event) => {
							const files = event.target.files ?? []
							startTransition(() => {
								importFiles(files)
							})
						}}
					/>
				</header>
				<AssetList
					room={room}
					onAssetAdded={async (assetId) => {
						const viewportSize = {
							width: window.innerWidth,
							height: window.innerHeight,
						}
						const centerPosition = getViewportCenter(
							viewportTransform,
							viewportSize,
						)
						await createSprite({
							assetId,
							roomId: room._id,
							position: centerPosition,
						})
						onAssetAdded?.()
					}}
				/>
			</HeadingLevel>

			{createPortal(
				<div
					className="invisible fixed inset-0 flex items-center justify-center bg-black/25 opacity-0 backdrop-blur transition-all data-[visible=true]:visible data-[visible=true]:opacity-100"
					data-visible={isFileOver}
				>
					<p className="heading-4xl text-white">Drop files to import assets</p>
				</div>,
				document.body,
			)}
		</section>
	)
}

function AssetList({
	room,
	onAssetAdded,
}: {
	room: {
		_id: Id<"rooms">
		backgroundAssetId: Id<"assets"> | null | undefined
		activeSceneId?: Id<"scenes">
	}
	onAssetAdded?: (assetId: Id<"assets">) => void
}) {
	const originalAssets = useQuery(api.assets.list, {})
	const assets = useDeferredValue(originalAssets)
	const isPending = assets !== originalAssets

	const sprites = useQuery(api.sprites.list, {
		roomId: room._id,
		sceneId: room.activeSceneId,
	})

	const spritesByAssetId = new Map(
		sprites?.map((asset) => [asset.assetId, asset]) ?? [],
	)

	return (
		<ul className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2">
			{isPending && assets == null && (
				<div className="col-span-full flex justify-center py-4">
					<LoadingSpinner />
				</div>
			)}
			{assets?.map((asset) => {
				const sprite = spritesByAssetId.get(asset._id)
				return (
					<li key={asset._id}>
						<AssetCard
							asset={asset}
							room={room}
							sprite={sprite}
							onAddToScene={() => onAssetAdded?.(asset._id)}
						/>
					</li>
				)
			})}
		</ul>
	)
}

function AssetCard({
	asset,
	room,
	sprite,
	onAddToScene,
}: {
	asset: NormalizedAsset
	room: {
		_id: Id<"rooms">
		backgroundAssetId: Id<"assets"> | null | undefined
	}
	sprite?: NormalizedSprite
	onAddToScene?: () => void
}) {
	const removeAsset = useMutation(api.assets.remove)
	const updateAsset = useMutation(api.assets.update)
	const removeSprite = useMutation(api.sprites.remove)
	const updateRoom = useMutation(api.rooms.update)
	const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

	const url = asset.url && getThumbnailUrl(asset.url, 150)
	const isInScene = Boolean(sprite)
	const isRoomBackground = asset._id === room.backgroundAssetId

	return (
		<Menu placement="bottom-start">
			<MenuButton
				className="block w-full overflow-clip panel-dark rounded outline-2 outline-transparent transition select-none hover:border-gray-600"
				draggable
				onPointerDown={(event: React.PointerEvent) => {
					setMenuPosition({ x: event.clientX, y: event.clientY })
				}}
				onDragStart={(event: React.DragEvent) => {
					const data: typeof AssetDropData.inferOut = {
						assetId: asset._id,
					}
					event.dataTransfer.setData("application/json", JSON.stringify(data))
					event.dataTransfer.dropEffect = "move"
				}}
			>
				<div className="relative">
					<img
						src={url ?? ""}
						alt=""
						className={twMerge(
							"aspect-square w-full rounded-xs object-cover object-top transition",
							isInScene && "brightness-50",
						)}
						draggable={false}
					/>
					<div className="absolute right-0 bottom-0 flex gap-1 p-1 text-white *:opacity-60 *:transition-opacity *:hover:opacity-100">
						{isInScene && (
							<Tooltip content="Currently present in the scene">
								<Icon icon="mingcute:classify-2-fill" className="size-4" />
							</Tooltip>
						)}
						{isRoomBackground && (
							<Tooltip content="Set as room background">
								<Icon icon="mingcute:pic-fill" className="size-4" />
							</Tooltip>
						)}
					</div>
				</div>
				<p className="truncate px-2 py-1 text-center text-xs leading-none font-medium">
					{asset.name}
				</p>
			</MenuButton>
			<MenuPanel gutter={0} getAnchorRect={() => menuPosition}>
				{isInScene ?
					<MenuItem
						onClick={() => {
							if (sprite) {
								removeSprite({ spriteId: sprite._id })
							}
						}}
					>
						<Icon icon="mingcute:classify-2-fill" className="size-5" />
						<span>Remove from scene</span>
					</MenuItem>
				:	<MenuItem onClick={onAddToScene}>
						<Icon icon="mingcute:classify-add-2-fill" className="size-5" />
						<span>Add to scene</span>
					</MenuItem>
				}
				<MenuItem
					onClick={() => {
						if (isRoomBackground) {
							updateRoom({
								roomId: room._id,
								backgroundAssetId: null,
							})
						} else {
							updateRoom({
								roomId: room._id,
								backgroundAssetId: asset._id,
							})
						}
					}}
				>
					<Icon icon="mingcute:pic-fill" className="size-5" />
					<span>
						{isRoomBackground ? "Clear background" : "Set as background"}
					</span>
				</MenuItem>
				<MenuItem
					onClick={() => {
						const newName = prompt("Enter new name:", asset.name)?.trim()
						if (!newName) return
						updateAsset({
							assetId: asset._id,
							name: newName,
						})
					}}
				>
					<Icon icon="mingcute:edit-2-fill" className="size-5" />
					<span>Rename</span>
				</MenuItem>
				<MenuItem onClick={() => removeAsset({ assetIds: [asset._id] })}>
					<Icon icon="mingcute:delete-2-fill" className="size-5" />
					<span>Delete</span>
				</MenuItem>
			</MenuPanel>
		</Menu>
	)
}
