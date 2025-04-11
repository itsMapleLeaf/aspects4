import { ArkErrors } from "arktype"
import { isEqual } from "es-toolkit"
import { useEffect, useState } from "react"
import { twMerge } from "tailwind-merge"
import { useValueRef } from "~/hooks/common.ts"
import { Id } from "../../convex/_generated/dataModel"
import { useDrag } from "../contexts/DragContext.tsx"
import { useLocalStorage } from "../hooks/useLocalStorage.ts"
import { useRemoveAsset, useUpdateAsset } from "../hooks/useSceneAssets"
import { useSceneAssets, type SceneAsset } from "../hooks/useSceneAssets.ts"
import { handleDrag } from "../lib/drag.ts"
import {
	defaultViewportTransform,
	getViewportScale,
	handleViewportZoom,
	ViewportTransform,
} from "../lib/viewport.ts"
import mapUrl from "../map.jpg"

export function SceneViewer({ roomId }: { roomId: Id<"rooms"> }) {
	const { assets, addAssetToScene } = useSceneAssets(roomId)
	const { dragState } = useDrag()
	const [selectedAsssetId, setSelectedAsssetId] = useState<Id<"assets">>()
	const removeAsset = useRemoveAsset()

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

			if (!data) {
				return
			}

			const res = await fetch(data.url)
			const blob = await res.blob()
			const file = new File([blob], data.name, { type: data.type })

			const scale = getViewportScale(viewportTransform.zoom)
			const dropX = (event.clientX - viewportTransform.offset.x) / scale
			const dropY = (event.clientY - viewportTransform.offset.y) / scale

			addAssetToScene(file, { x: dropX, y: dropY })
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
			if (
				event.key === "Delete" &&
				selectedAsssetId &&
				!document.activeElement?.matches("input, textarea")
			) {
				removeAsset({ assetId: selectedAsssetId })
				setSelectedAsssetId(undefined)
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => {
			window.removeEventListener("keydown", handleKeyDown)
		}
	}, [selectedAsssetId, removeAsset])

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
				<img
					src={mapUrl}
					draggable={false}
					className="pointer-events-none max-w-[unset]"
				/>
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
	const update = useUpdateAsset()

	return (
		<div
			className={twMerge(
				"absolute top-0 left-0 origin-top-left cursor-move transition-[translate_rotate] ease-out",
				isEqual(dragOffset, { x: 0, y: 0 }) ? "duration-300" : "duration-50",
			)}
			style={{
				translate: `${asset.position.x + dragOffset.x}px ${asset.position.y + dragOffset.y}px`,
				rotate: `${asset.rotation ?? 0}deg`,
				width: `${asset.size?.width ?? "auto"}px`,
				height: `${asset.size?.height ?? "auto"}px`,
			}}
			onPointerDown={(event) => {
				if (event.button !== 0) return

				onPrimaryPointerDown()

				event.preventDefault()

				handleDrag({
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
					},
				})
			}}
		>
			<div className="relative">
				<img
					src={asset.url || ""}
					alt={asset.name || ""}
					className="max-h-full max-w-full object-contain"
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
					></div>
				)}
			</div>
		</div>
	)
}
