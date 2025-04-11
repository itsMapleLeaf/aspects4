import { ArkErrors } from "arktype"
import { isEqual } from "es-toolkit"
import { useCallback, useEffect, useState } from "react"
import { twMerge } from "tailwind-merge"
import { useValueRef } from "~/hooks/common.ts"
import { Id } from "../../convex/_generated/dataModel"
import { useDrag } from "../contexts/DragContext.tsx"
import { useLocalStorage } from "../hooks/useLocalStorage.ts"
import {
	useMoveAssetToFront,
	useRemoveAsset,
	useUpdateAsset,
} from "../hooks/useSceneAssets"
import { useSceneAssets, type SceneAsset } from "../hooks/useSceneAssets.ts"
import { handleDrag } from "../lib/drag.ts"
import {
	defaultViewportTransform,
	getViewportScale,
	handleViewportZoom,
	ViewportTransform,
} from "../lib/viewport.ts"
import { Icon } from "./ui/Icon.tsx"

export function SceneViewer({ roomId }: { roomId: Id<"rooms"> }) {
	const { assets, addAssetToScene } = useSceneAssets(roomId)
	const { dragState } = useDrag()
	const [selectedAsssetId, setSelectedAsssetId] = useState<Id<"assets">>()
	const removeAsset = useRemoveAsset()
	const update = useUpdateAsset()

	const [viewportTransform, setViewportTransform] =
		useLocalStorage<ViewportTransform>(
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
			const data = dragState.assetData
			if (!data) return

			const scale = getViewportScale(viewportTransform.zoom)
			const dropX = (event.clientX - viewportTransform.offset.x) / scale
			const dropY = (event.clientY - viewportTransform.offset.y) / scale

			addAssetToScene(data, { x: dropX, y: dropY })
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
				removeAsset({ assetId: selectedAsssetId })
				setSelectedAsssetId(undefined)
			}

			if (
				event.key === "l" &&
				selectedAsssetId &&
				!document.activeElement?.matches("input, textarea")
			) {
				const selectedAsset = assets.find(
					(asset) => asset._id === selectedAsssetId,
				)
				if (selectedAsset) {
					update({
						assetId: selectedAsssetId,
						locked: !selectedAsset.locked,
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
				{assets.map((asset) => (
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
	asset: SceneAsset
	viewportTransform: ViewportTransform
	isSelected: boolean
	onPrimaryPointerDown: () => void
}) {
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
	const dragOffsetRef = useValueRef(dragOffset)
	const [resizeOffset, setResizeOffset] = useState({ width: 0, height: 0 })
	const resizeOffsetRef = useValueRef(resizeOffset)
	const update = useUpdateAsset()
	const moveToFront = useMoveAssetToFront()
	
	const setBodyCursor = useCallback((cursor: string | null) => {
		if (cursor) {
			document.body.style.cursor = cursor
		} else {
			document.body.style.removeProperty('cursor')
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
				width: `${(asset.size?.width ?? 0) + resizeOffset.width}px`,
				height: `${(asset.size?.height ?? 0) + resizeOffset.height}px`,
			}}
			onPointerDown={(event) => {
				if (event.button !== 0) return

				onPrimaryPointerDown()

				event.preventDefault()

				if (asset.locked) return

				handleDrag({
					onDragStart: () => {
						moveToFront({ assetId: asset._id })
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
						update({
							assetId: asset._id,
							position: {
								x: asset.position.x + dragOffsetRef.current.x,
								y: asset.position.y + dragOffsetRef.current.y,
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
					alt={asset.name || ""}
					className="size-full object-cover"
					draggable={false}
				/>

				{isSelected && (
					<div
						className={twMerge(
							"outline-primary-400 bg-primary-800/10 absolute inset-0 outline",
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
								className="bg-primary-400 absolute cursor-nwse-resize"
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

									moveToFront({ assetId: asset._id })
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
												(asset.size?.width ?? 0) + resizeOffsetRef.current.width
											const newHeight =
												(asset.size?.height ?? 0) +
												resizeOffsetRef.current.height

											update({
												assetId: asset._id,
												size: {
													width: Math.max(10, newWidth),
													height: Math.max(10, newHeight),
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
