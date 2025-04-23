import { ArkErrors } from "arktype"
import { useMutation, useQuery } from "convex/react"
import { isEqual } from "es-toolkit"
import { useCallback, useEffect, useState } from "react"
import { twMerge } from "tailwind-merge"
import { useValueRef } from "~/hooks/common.ts"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import type { NormalizedRoomAsset } from "../../convex/roomAssets.ts"
import { useDrag } from "../contexts/DragContext.tsx"
import { useLocalStorageState } from "../hooks/storage.ts"
import { handleDrag } from "../lib/drag.ts"
import {
	defaultViewportTransform,
	getViewportScale,
	handleViewportZoom,
	ViewportTransform,
} from "../lib/viewport.ts"
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
	const removeRoomAsset = useMutation(api.roomAssets.remove)
	const updateRoomAsset = useMutation(api.roomAssets.update)
	const { dragState } = useDrag()
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

	const handleDrop = async (event: React.DragEvent) => {
		event.preventDefault()
		event.stopPropagation()

		try {
			// TODO
			// const data = dragState.assetData
			// if (!data) return
			// const scale = getViewportScale(viewportTransform.zoom)
			// const dropX = (event.clientX - viewportTransform.offset.x) / scale
			// const dropY = (event.clientY - viewportTransform.offset.y) / scale
			// createRoomAsset({
			// 	roomId: room._id,
			// 	assetId: data._id,
			// 	position: { x: dropX, y: dropY },
			// })
		} catch (err) {
			console.error("Error processing dropped asset:", err)
		}
	}

	const handleDragOver = (event: React.DragEvent) => {
		if (event.dataTransfer.types.includes("application/json")) {
			event.preventDefault()
			event.dataTransfer.dropEffect = "copy"
		}
	}

	const handleWheel = (event: React.WheelEvent) => {
		setViewportTransform((transform) => handleViewportZoom(transform, event))
	}

	const handleDragLeave = () => {}

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
			onDragLeave={handleDragLeave}
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
				{assets?.map((asset) => (
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
	const [resizeOffset, setResizeOffset] = useState({ width: 0, height: 0 })
	const resizeOffsetRef = useValueRef(resizeOffset)
	const updateRoomAsset = useMutation(api.roomAssets.update)

	const setBodyCursor = useCallback((cursor: string | null) => {
		if (cursor) {
			document.body.style.cursor = cursor
		} else {
			document.body.style.removeProperty("cursor")
		}
	}, [])

	const isIdle =
		isEqual(dragOffset, { x: 0, y: 0 }) &&
		isEqual(resizeOffset, { width: 0, height: 0 })

	return (
		<div
			className={twMerge(
				"absolute top-0 left-0 origin-top-left transition-[translate_rotate] ease-out",
				isIdle ? "duration-300" : "duration-50",
				asset.locked ? "" : "cursor-move",
			)}
			style={{
				translate: `${asset.position.x + dragOffset.x}px ${asset.position.y + dragOffset.y}px`,
				rotate: `${asset.rotation ?? 0}deg`,
				width: `${(asset.asset?.size?.x ?? 0) + resizeOffset.width}px`,
				height: `${(asset.asset?.size?.y ?? 0) + resizeOffset.height}px`,
				scale: asset.scale,
			}}
			onPointerDown={(event) => {
				if (event.button !== 0) return

				onPrimaryPointerDown()

				event.preventDefault()

				if (asset.locked) return

				handleDrag({
					onDragStart: () => {
						// moveToFront({ assetId: asset._id })
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
					src={asset.asset?.url || ""}
					alt={asset.asset?.name || ""}
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

									// moveToFront({ assetId: asset._id })
									setBodyCursor("nwse-resize")

									handleDrag({
										onDrag: (event) => {
											setResizeOffset((offset) => ({
												width:
													offset.width +
													event.movementX /
														getViewportScale(viewportTransform.zoom),
												height:
													offset.height +
													event.movementY /
														getViewportScale(viewportTransform.zoom),
											}))
										},
										onDragEnd: () => {
											const newWidth =
												(asset.asset?.size?.x ?? 0) +
												resizeOffsetRef.current.width
											const newHeight =
												(asset.asset?.size?.y ?? 0) +
												resizeOffsetRef.current.height

											updateRoomAsset({
												roomAssetId: asset._id,
												data: {
													scale: Math.max(10, newWidth),
												},
											})
											setResizeOffset({ width: 0, height: 0 })
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
