import { Heading, HeadingLevel } from "@ariakit/react"
import { useGesture } from "@use-gesture/react"
import { type } from "arktype"
import { useMutation, useQuery } from "convex/react"
import { isEqual } from "es-toolkit"
import { useEffect, useState } from "react"
import { twMerge } from "tailwind-merge"
import { Dialog, DialogButton, DialogPanel } from "~/components/ui/Dialog.tsx"
import { Tooltip } from "~/components/ui/Tooltip.tsx"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import type { NormalizedSprite } from "../../convex/sprites.ts"
import { getThumbnailUrl } from "../lib/images.ts"
import {
	getViewportScale,
	handleViewportZoom,
	ViewportTransform,
} from "../lib/viewport.ts"
import { AssetDropData } from "./AssetsPanel.tsx"
import { Icon } from "./ui/Icon.tsx"

export function SceneViewer({
	room,
	backgroundBrightness,
	viewportTransform,
	updateViewportTransform: setViewportTransform,
}: {
	room: {
		_id: Id<"rooms">
		backgroundUrl: string | null | undefined
	}
	backgroundBrightness: number
	viewportTransform: ViewportTransform
	updateViewportTransform: (
		next: (prev: ViewportTransform) => ViewportTransform,
	) => void
}) {
	const assets = useQuery(api.sprites.list, { roomId: room._id })
	const createSprite = useMutation(api.sprites.place)
	const removeSprite = useRemoveSprite(room._id)
	const updateSprite = useUpdateSprite(room._id)
	const moveSpritesToFront = useMoveSpritesToFront(room._id)
	const [selectedAssetId, setSelectedAssetId] = useState<Id<"sprites">>()
	const [assetDragCursor, setAssetDragOffset] = useState({ x: 0, y: 0 })
	const [assetDragAction, setAssetDragAction] = useState<"move" | "resize">(
		"move",
	)

	const bindPointerGestures = useGesture(
		{
			onPointerDown({ touches, ...info }) {
				const event = info.event as unknown as React.PointerEvent

				if (event.button === 0 && touches === 1) {
					let selectedAssetId, isResizing
					for (const target of event.nativeEvent.composedPath()) {
						if (target instanceof HTMLElement && target.dataset.assetResize) {
							isResizing = true
							console.log("resize")
						}
						if (target instanceof HTMLElement && target.dataset.assetId) {
							selectedAssetId = target.dataset.assetId as Id<"sprites">
						}
					}
					setSelectedAssetId(selectedAssetId)
					setAssetDragAction(isResizing ? "resize" : "move")
				}

				if (event.button === 2) {
					// prevent context menu from opening after drag finish
					window.addEventListener(
						"contextmenu",
						(event) => event.preventDefault(),
						{ once: true },
					)
				}
			},

			onDragStart() {
				// if (selectedAssetId) {
				// 	moveRoomAssetToFront({ roomAssetId: selectedAssetId })
				// }
			},

			onDrag({ buttons, touches, delta: [deltaX, deltaY] }) {
				if (touches === 1 && buttons === 1 && selectedAssetId) {
					setAssetDragOffset((offset) => ({
						x: offset.x + deltaX / getViewportScale(viewportTransform.zoom),
						y: offset.y + deltaY / getViewportScale(viewportTransform.zoom),
					}))
				} else if (
					// single-touch secondary pointer (right click)
					(touches === 1 && buttons === 2) ||
					// double-touch primary pointer (multi-touch)
					(touches === 2 && buttons === 1)
				) {
					setViewportTransform((transform) => ({
						...transform,
						offset: {
							x: transform.offset.x + deltaX,
							y: transform.offset.y + deltaY,
						},
					}))
				}
			},

			onDragEnd: () => {
				const selectedAsset = assets?.find((it) => it._id === selectedAssetId)
				if (!selectedAsset) {
					return
				}

				if (assetDragAction === "move") {
					updateSprite({
						spriteId: selectedAsset._id,
						data: {
							position: {
								x: selectedAsset.position.x + assetDragCursor.x,
								y: selectedAsset.position.y + assetDragCursor.y,
							},
						},
					})
				}

				if (assetDragAction === "resize") {
					const newWidth = (selectedAsset?.size?.x ?? 0) + assetDragCursor.x
					const newHeight = (selectedAsset?.size?.y ?? 0) + assetDragCursor.y

					updateSprite({
						spriteId: selectedAsset._id,
						data: {
							size: {
								x: newWidth,
								y: newHeight,
							},
						},
					})
				}

				setAssetDragOffset({ x: 0, y: 0 })
				setBodyCursor(null)
			},

			onWheel({ event }) {
				setViewportTransform((transform) =>
					handleViewportZoom(transform, {
						clientX: event.clientX,
						clientY: event.clientY,
						deltaY: Math.sign(event.deltaY),
					}),
				)
			},

			onPinch({ memo, da: [distance] }) {
				const distanceDelta = (memo ?? distance) - distance

				setViewportTransform((transform) =>
					handleViewportZoom(transform, {
						clientX: window.innerWidth / 2,
						clientY: window.innerHeight / 2,
						deltaY: distanceDelta / 100,
					}),
				)

				return distance
			},

			onDragOver({ event }) {
				if (event.dataTransfer!.types.includes("application/json")) {
					event.preventDefault()
					event.dataTransfer!.dropEffect = "move"
				}
			},

			onDrop({ event }) {
				event.preventDefault()
				event.stopPropagation()

				try {
					const result = AssetDropData(
						event.dataTransfer!.getData("application/json"),
					)
					if (result instanceof type.errors) {
						console.warn(result)
						return
					}

					const scale = getViewportScale(viewportTransform.zoom)
					const dropX = (event.clientX - viewportTransform.offset.x) / scale
					const dropY = (event.clientY - viewportTransform.offset.y) / scale
					createSprite({
						roomId: room._id,
						assetId: result.assetId as Id<"assets">,
						position: { x: dropX, y: dropY },
					})
				} catch (err) {
					console.error("Error processing dropped asset:", err)
				}
			},
		},
		{
			drag: {
				pointer: {
					buttons: [1, 2],
				},
				threshold: 4,
			},
		},
	)

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "0" && event.ctrlKey) {
				setViewportTransform(() => ({ offset: { x: 0, y: 0 }, zoom: 0 }))
			}

			if (
				event.key === "Delete" &&
				selectedAssetId &&
				!document.activeElement?.matches("input, textarea")
			) {
				removeSprite({ spriteId: selectedAssetId })
				setSelectedAssetId(undefined)
			}

			if (
				event.key === "l" &&
				selectedAssetId &&
				!document.activeElement?.matches("input, textarea")
			) {
				const selectedAsset = assets?.find(
					(asset) => asset._id === selectedAssetId,
				)
				if (selectedAsset) {
					updateSprite({
						spriteId: selectedAssetId,
						data: {
							locked: !selectedAsset.locked,
						},
					})
				}
			}

			// shitty layering workaround i guess
			if (
				event.key === "t" &&
				selectedAssetId &&
				!document.activeElement?.matches("input, textarea")
			) {
				moveSpritesToFront({ spriteId: selectedAssetId })
			}
			if (
				event.key === "b" &&
				selectedAssetId &&
				!document.activeElement?.matches("input, textarea")
			) {
				updateSprite({
					spriteId: selectedAssetId,
					data: {
						updateTime: 0,
					},
				})
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => {
			window.removeEventListener("keydown", handleKeyDown)
		}
	})

	return (
		<div
			{...bindPointerGestures()}
			className="relative h-dvh w-dvw touch-none overflow-clip select-none"
		>
			{room.backgroundUrl && (
				<div
					className="pointer-events-none fixed inset-0 bg-cover bg-center"
					style={{
						backgroundImage: `url(${room.backgroundUrl})`,
						filter: `brightness(${backgroundBrightness / 100})`,
					}}
				/>
			)}
			<div
				className="pointer-events-children absolute top-0 left-0 origin-top-left transition-[scale,translate] duration-100 ease-out"
				style={{
					translate: `${viewportTransform.offset.x}px ${viewportTransform.offset.y}px`,
					scale: getViewportScale(viewportTransform.zoom),
				}}
			>
				{assets
					?.sort((a, b) => a.updateTime - b.updateTime)
					.map((asset) => (
						<AssetImage
							key={asset._id}
							asset={asset}
							viewportTransform={viewportTransform}
							isSelected={selectedAssetId === asset._id}
							dragOffset={
								selectedAssetId === asset._id && assetDragAction === "move" ?
									assetDragCursor
								:	{ x: 0, y: 0 }
							}
							resizeOffset={
								selectedAssetId === asset._id && assetDragAction === "resize" ?
									assetDragCursor
								:	{ x: 0, y: 0 }
							}
						/>
					))}
			</div>
			<OffScreenAssetIndicators
				assets={assets ?? []}
				viewportTransform={viewportTransform}
				selectedAssetId={selectedAssetId}
				onAssetClick={(assetId: Id<"sprites">) => {
					setSelectedAssetId(assetId)
					const asset = assets?.find((a) => a._id === assetId)
					if (asset) {
						const scale = getViewportScale(viewportTransform.zoom)
						const centerX = window.innerWidth / 2 - asset.position.x * scale
						const centerY = window.innerHeight / 2 - asset.position.y * scale
						setViewportTransform(() => ({
							...viewportTransform,
							offset: { x: centerX, y: centerY },
						}))
					}
				}}
			/>
		</div>
	)
}

const setBodyCursor = (cursor: string | null) => {
	if (cursor) {
		document.body.style.cursor = cursor
	} else {
		document.body.style.removeProperty("cursor")
	}
}

function AssetImage({
	asset,
	viewportTransform,
	isSelected,
	dragOffset,
	resizeOffset,
}: {
	asset: NormalizedSprite
	viewportTransform: ViewportTransform
	isSelected: boolean
	dragOffset: { x: number; y: number }
	resizeOffset: { x: number; y: number }
}) {
	const isIdle =
		isEqual(dragOffset, { x: 0, y: 0 }) && isEqual(resizeOffset, { x: 0, y: 0 })

	return (
		<div
			data-asset-id={asset._id}
			className={twMerge(
				"absolute top-0 left-0 origin-top-left touch-none transition-[translate_rotate] ease-out",
				isIdle ? "duration-300" : "duration-50",
				asset.locked ? "" : "cursor-move",
			)}
			style={{
				translate: `${asset.position.x + dragOffset.x}px ${asset.position.y + dragOffset.y}px`,
				rotate: `${asset.rotation}deg`,
				width: `${asset.size.x + resizeOffset.x}px`,
				height: `${asset.size.y + resizeOffset.y}px`,
			}}
		>
			<div className="relative size-full">
				<img
					src={asset.url || ""}
					alt=""
					className="size-full touch-none object-contain"
					draggable={false}
				/>

				{isSelected && (
					<div
						className={twMerge(
							"pointer-events-none absolute inset-0 bg-primary-800/10 outline outline-primary-400",
						)}
						style={{
							outlineWidth: 2 / getViewportScale(viewportTransform.zoom),
						}}
					>
						{asset.locked && (
							<div className="absolute top-0 left-0 p-1 opacity-50">
								<Icon
									icon="mingcute:lock-fill"
									className="aspect-square"
									style={{
										width: 16 / getViewportScale(viewportTransform.zoom),
										height: 16 / getViewportScale(viewportTransform.zoom),
									}}
								/>
							</div>
						)}

						{!asset.locked && (
							<div
								className="absolute right-0 bottom-0 flex items-center justify-center transition-[scale]"
								style={{
									scale: 1 / getViewportScale(viewportTransform.zoom),
								}}
							>
								<div className="absolute size-4 bg-primary-400"></div>
								<div
									data-asset-resize
									className="pointer-events-auto absolute size-10 cursor-nwse-resize touch-none ease-out"
								></div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	)
}

function OffScreenAssetIndicators({
	assets,
	viewportTransform,
	selectedAssetId,
	onAssetClick,
}: {
	assets: NormalizedSprite[]
	viewportTransform: ViewportTransform
	selectedAssetId: Id<"sprites"> | undefined
	onAssetClick: (assetId: Id<"sprites">) => void
}) {
	const scale = getViewportScale(viewportTransform.zoom)
	const viewportWidth = window.innerWidth
	const viewportHeight = window.innerHeight

	const offScreenAssets = assets.filter((asset) => {
		const screenX = asset.position.x * scale + viewportTransform.offset.x
		const screenY = asset.position.y * scale + viewportTransform.offset.y
		const assetWidth = (asset.size?.x ?? 0) * scale
		const assetHeight = (asset.size?.y ?? 0) * scale

		return (
			screenX + assetWidth < 0 ||
			screenX > viewportWidth ||
			screenY + assetHeight < 0 ||
			screenY > viewportHeight
		)
	})

	return (
		<>
			{offScreenAssets.map((asset) => {
				const screenX = asset.position.x * scale + viewportTransform.offset.x
				const screenY = asset.position.y * scale + viewportTransform.offset.y
				const assetWidth = (asset.size?.x ?? 0) * scale
				const assetHeight = (asset.size?.y ?? 0) * scale

				const assetCenterX = screenX + assetWidth / 2
				const assetCenterY = screenY + assetHeight / 2

				let indicatorX = assetCenterX
				let indicatorY = assetCenterY

				const margin = 24

				if (assetCenterX < margin) {
					indicatorX = margin
				} else if (assetCenterX > viewportWidth - margin) {
					indicatorX = viewportWidth - margin
				}

				if (assetCenterY < margin) {
					indicatorY = margin
				} else if (assetCenterY > viewportHeight - margin) {
					indicatorY = viewportHeight - margin
				}

				const url = asset.url && getThumbnailUrl(asset.url, 32)

				return (
					<button
						key={asset._id}
						type="button"
						className={twMerge(
							"absolute top-0 left-0 size-8 rounded-full border bg-gray-800/80 transition-[translate] ease-out hover:scale-110",
							selectedAssetId === asset._id ?
								"border-primary-400 shadow-lg shadow-primary-400/25"
							:	"border-gray-600",
						)}
						style={{
							translate: `${indicatorX - 16}px ${indicatorY - 16}px`,
						}}
						onClick={() => onAssetClick(asset._id)}
					>
						<img
							src={url ?? ""}
							alt=""
							className="size-full rounded-full object-cover"
							draggable={false}
						/>
					</button>
				)
			})}
		</>
	)
}

function useUpdateSprite(roomId: Id<"rooms">) {
	return useMutation(api.sprites.update).withOptimisticUpdate((store, args) => {
		const items = store.getQuery(api.sprites.list, { roomId })
		store.setQuery(
			api.sprites.list,
			{ roomId },
			items?.map((item) =>
				item._id === args.spriteId ? { ...item, ...args.data } : item,
			),
		)
	})
}

function useMoveSpritesToFront(roomId: Id<"rooms">) {
	const assets = useQuery(api.sprites.list, { roomId })
	return useMutation(api.sprites.moveToFront).withOptimisticUpdate(
		(store, args) => {
			store.setQuery(
				api.sprites.list,
				{ roomId },
				assets?.map((item) =>
					item._id === args.spriteId ?
						{ ...item, updateTime: Date.now() }
					:	item,
				),
			)
		},
	)
}

function useRemoveSprite(roomId: Id<"rooms">) {
	return useMutation(api.sprites.remove).withOptimisticUpdate((store, args) => {
		const items = store.getQuery(api.sprites.list, { roomId })
		store.setQuery(
			api.sprites.list,
			{ roomId },
			items?.filter((item) => item._id !== args.spriteId),
		)
	})
}

export function SceneViewerHelpButton() {
	return (
		<Dialog>
			<DialogButton
				render={<Tooltip content="Help" placement="top" />}
				aria-label="Help"
				className="opacity-75 transition-opacity hover:opacity-100"
			>
				<div className="flex size-10 items-center justify-center rounded-full border border-gray-700 bg-gray-800 shadow-lg">
					<Icon
						icon="mingcute:question-line"
						className="size-6 text-gray-300"
					/>
				</div>
			</DialogButton>
			<DialogPanel title="Scene Controls">
				<HeadingLevel>
					<div className="grid gap-4">
						<section>
							<Heading className="mb-2 heading-xl">
								Navigation (Desktop)
							</Heading>
							<ul className="list-disc space-y-1 pl-6">
								<li>Right-click and drag to pan the scene</li>
								<li>Scroll wheel to zoom in/out</li>
								<li>Ctrl+0 to reset view to center</li>
							</ul>
						</section>
						<section>
							<Heading className="mb-2 heading-xl">Navigation (Touch)</Heading>
							<ul className="list-disc space-y-1 pl-6">
								<li>Use two fingers to zoom and pan the scene</li>
							</ul>
						</section>
						<section>
							<Heading className="mb-2 heading-xl">Assets</Heading>
							<ul className="list-disc space-y-1 pl-6">
								<li>
									Drag assets from the Assets panel to place them in the scene
								</li>
								<li>Tap an asset in the scene to select it</li>
								<li>Drag selected assets to move and resize them</li>
								<li>Press Delete to remove selected asset from the scene</li>
								<li>
									Press L to lock/unlock the size/position of the selected asset
								</li>
								<li>Press T to move an asset to the top</li>
								<li>Press B to move an asset to the bottom</li>
								<li>
									Click off-screen asset indicators (shown on screen edges) to
									center them in view
								</li>
							</ul>
						</section>
					</div>
				</HeadingLevel>
			</DialogPanel>
		</Dialog>
	)
}
