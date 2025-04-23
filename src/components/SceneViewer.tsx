import { ArkErrors, type } from "arktype"
import { useMutation, useQuery } from "convex/react"
import { isEqual } from "es-toolkit"
import { useEffect, useState } from "react"
import { twMerge } from "tailwind-merge"
import { useValueRef } from "~/hooks/common.ts"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import type { NormalizedRoomAsset } from "../../convex/roomAssets.ts"
import { useLocalStorageState } from "../hooks/storage.ts"
import { handleDrag } from "../lib/drag.ts"
import {
	defaultViewportTransform,
	getViewportScale,
	handleViewportZoom,
	ViewportTransform,
} from "../lib/viewport.ts"
import { AssetDropData } from "./AssetsPanel.tsx"
import { Icon } from "./ui/Icon.tsx"

export function SceneViewer({
	room,
}: {
	room: {
		_id: Id<"rooms">
		backgroundUrl: string | null | undefined
	}
}) {
	const assets = useQuery(api.roomAssets.list, { roomId: room._id })
	const createRoomAsset = useMutation(api.roomAssets.create)
	const removeRoomAsset = useRemoveRoomAsset(room._id)
	const updateRoomAsset = useUpdateRoomAsset(room._id)
	const [selectedAsssetId, setSelectedAsssetId] = useState<Id<"roomAssets">>()

	const [viewportTransform, setViewportTransform] =
		useLocalStorageState<ViewportTransform>(
			"viewportTransform",
			defaultViewportTransform,
			(input) => {
				const result = ViewportTransform(input)
				if (result instanceof ArkErrors) {
					console.warn(result)
					return defaultViewportTransform
				}
				return result
			},
		)

	const handlePointerDown = (event: React.PointerEvent) => {
		if (event.button === 0 && event.target === event.currentTarget) {
			setSelectedAsssetId(undefined)
		}

		if (event.button === 2) {
			event.preventDefault()
			handleDrag({
				onDrag: (event) => {
					if (!(event.buttons & 2)) return
					setViewportTransform((transform) => ({
						...transform,
						offset: {
							x: transform.offset.x + event.movementX,
							y: transform.offset.y + event.movementY,
						},
					}))
				},
			})
		}
	}

	const handleWheel = (event: React.WheelEvent) => {
		setViewportTransform((transform) => handleViewportZoom(transform, event))
	}

	const handleDragOver = (event: React.DragEvent) => {
		if (event.dataTransfer.types.includes("application/json")) {
			event.preventDefault()
			event.dataTransfer.dropEffect = "move"
		}
	}

	const handleDrop = async (event: React.DragEvent) => {
		event.preventDefault()
		event.stopPropagation()

		try {
			const result = AssetDropData(
				event.dataTransfer.getData("application/json"),
			)
			if (result instanceof type.errors) {
				console.warn(result)
				return
			}

			const scale = getViewportScale(viewportTransform.zoom)
			const dropX =
				(event.clientX - viewportTransform.offset.x) / scale - result.size.x / 2
			const dropY =
				(event.clientY - viewportTransform.offset.y) / scale - result.size.y / 2
			createRoomAsset({
				roomId: room._id,
				assetId: result.assetId as Id<"assets">,
				position: { x: dropX, y: dropY },
			})
		} catch (err) {
			console.error("Error processing dropped asset:", err)
		}
	}

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "0" && event.ctrlKey) {
				setViewportTransform({ offset: { x: 0, y: 0 }, zoom: 0 })
			}

			if (
				event.key === "Delete" &&
				selectedAsssetId &&
				!document.activeElement?.matches("input, textarea")
			) {
				removeRoomAsset({ roomAssetId: selectedAsssetId })
				setSelectedAsssetId(undefined)
			}

			if (
				event.key === "l" &&
				selectedAsssetId &&
				!document.activeElement?.matches("input, textarea")
			) {
				const selectedAsset = assets?.find(
					(asset) => asset._id === selectedAsssetId,
				)
				if (selectedAsset) {
					updateRoomAsset({
						roomAssetId: selectedAsssetId,
						data: {
							locked: !selectedAsset.locked,
						},
					})
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => {
			window.removeEventListener("keydown", handleKeyDown)
		}
	})

	return (
		<div
			className="relative h-dvh w-dvw overflow-clip select-none"
			onPointerDown={handlePointerDown}
			onWheel={handleWheel}
			onDrop={handleDrop}
			onDragOver={handleDragOver}
		>
			<div
				className="pointer-events-children absolute top-0 left-0 origin-top-left transition-[scale,translate] duration-100 ease-out"
				style={{
					translate: `${viewportTransform.offset.x}px ${viewportTransform.offset.y}px`,
					scale: getViewportScale(viewportTransform.zoom),
				}}
			>
				{room.backgroundUrl && (
					<img
						src={room.backgroundUrl}
						alt=""
						className="pointer-events-none max-w-[unset] brightness-50"
						draggable={false}
					/>
				)}
				{assets
					?.sort((a, b) => a.updateTime - b.updateTime)
					.map((asset) => (
						<AssetImage
							key={asset._id}
							asset={asset}
							viewportTransform={viewportTransform}
							isSelected={selectedAsssetId === asset._id}
							onPrimaryPointerDown={() => setSelectedAsssetId(asset._id)}
						/>
					))}
			</div>
		</div>
	)
}

function AssetImage({
	asset,
	viewportTransform,
	isSelected,
	onPrimaryPointerDown,
}: {
	asset: NormalizedRoomAsset
	viewportTransform: ViewportTransform
	isSelected: boolean
	onPrimaryPointerDown: () => void
}) {
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
	const dragOffsetRef = useValueRef(dragOffset)
	const [resizeOffset, setResizeOffset] = useState({ x: 0, y: 0 })
	const resizeOffsetRef = useValueRef(resizeOffset)

	const updateRoomAsset = useUpdateRoomAsset(asset.roomId)
	const moveToFront = useMoveRoomAssetToFront(asset.roomId)

	const setBodyCursor = (cursor: string | null) => {
		if (cursor) {
			document.body.style.cursor = cursor
		} else {
			document.body.style.removeProperty("cursor")
		}
	}

	const isIdle =
		isEqual(dragOffset, { x: 0, y: 0 }) && isEqual(resizeOffset, { x: 0, y: 0 })

	return (
		<div
			className={twMerge(
				"absolute top-0 left-0 origin-top-left transition-[translate_rotate] ease-out",
				isIdle ? "duration-300" : "duration-50",
				asset.locked ? "" : "cursor-move",
			)}
			style={{
				translate: `${asset.position.x + dragOffset.x}px ${asset.position.y + dragOffset.y}px`,
				rotate: `${asset.rotation}deg`,
				width: `${asset.size.x + resizeOffset.x}px`,
				height: `${asset.size.y + resizeOffset.y}px`,
			}}
			onPointerDown={(event) => {
				if (event.button !== 0) return

				event.preventDefault()
				onPrimaryPointerDown()

				if (asset.locked) return

				handleDrag({
					onDragStart: () => {
						moveToFront({ roomAssetId: asset._id })
						setBodyCursor("move")
					},
					onDrag: (event) => {
						setDragOffset((offset) => ({
							x:
								offset.x +
								event.movementX / getViewportScale(viewportTransform.zoom),
							y:
								offset.y +
								event.movementY / getViewportScale(viewportTransform.zoom),
						}))
					},
					onDragEnd: () => {
						updateRoomAsset({
							roomAssetId: asset._id,
							data: {
								position: {
									x: asset.position.x + dragOffsetRef.current.x,
									y: asset.position.y + dragOffsetRef.current.y,
								},
							},
						})
						setDragOffset({ x: 0, y: 0 })
						setBodyCursor(null)
					},
				})
			}}
		>
			<div className="relative size-full">
				<img
					src={asset.url || ""}
					alt=""
					className="size-full object-cover"
					draggable={false}
				/>

				{isSelected && (
					<div
						className={twMerge(
							"absolute inset-0 bg-primary-800/10 outline outline-primary-400",
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
								className="absolute cursor-nwse-resize bg-primary-400"
								style={{
									width: 16 / getViewportScale(viewportTransform.zoom),
									height: 16 / getViewportScale(viewportTransform.zoom),
									right: -8 / getViewportScale(viewportTransform.zoom),
									bottom: -8 / getViewportScale(viewportTransform.zoom),
								}}
								onPointerDown={(event) => {
									if (event.button !== 0) return

									event.stopPropagation()
									event.preventDefault()

									moveToFront({ roomAssetId: asset._id })
									setBodyCursor("nwse-resize")

									handleDrag({
										onDrag: (event) => {
											setResizeOffset((offset) => ({
												x:
													offset.x +
													event.movementX /
														getViewportScale(viewportTransform.zoom),
												y:
													offset.y +
													event.movementY /
														getViewportScale(viewportTransform.zoom),
											}))
										},
										onDragEnd: () => {
											const newWidth =
												(asset?.size?.x ?? 0) + resizeOffsetRef.current.x
											const newHeight =
												(asset?.size?.y ?? 0) + resizeOffsetRef.current.y

											updateRoomAsset({
												roomAssetId: asset._id,
												data: {
													size: {
														x: newWidth,
														y: newHeight,
													},
												},
											})
											setResizeOffset({ x: 0, y: 0 })
											setBodyCursor(null)
										},
									})
								}}
							/>
						)}
					</div>
				)}
			</div>
		</div>
	)
}

function useUpdateRoomAsset(roomId: Id<"rooms">) {
	return useMutation(api.roomAssets.update).withOptimisticUpdate(
		(store, args) => {
			const items = store.getQuery(api.roomAssets.list, { roomId })
			store.setQuery(
				api.roomAssets.list,
				{ roomId },
				items?.map((item) =>
					item._id === args.roomAssetId ? { ...item, ...args.data } : item,
				),
			)
		},
	)
}

function useMoveRoomAssetToFront(roomId: Id<"rooms">) {
	return useMutation(api.roomAssets.moveToFront).withOptimisticUpdate(
		(store, args) => {
			const items = store.getQuery(api.roomAssets.list, { roomId })
			store.setQuery(
				api.roomAssets.list,
				{ roomId },
				items?.map((item) =>
					item._id === args.roomAssetId ?
						{ ...item, updateTime: Date.now() }
					:	item,
				),
			)
		},
	)
}

function useRemoveRoomAsset(roomId: Id<"rooms">) {
	return useMutation(api.roomAssets.remove).withOptimisticUpdate(
		(store, args) => {
			const items = store.getQuery(api.roomAssets.list, { roomId })
			store.setQuery(
				api.roomAssets.list,
				{ roomId },
				items?.filter((item) => item._id !== args.roomAssetId),
			)
		},
	)
}
