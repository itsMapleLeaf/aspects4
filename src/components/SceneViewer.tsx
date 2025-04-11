import { ArkErrors } from "arktype"
import { useParams } from "wouter"
import { Id } from "../../convex/_generated/dataModel"
import { useDrag } from "../contexts/DragContext.tsx"
import { useLocalStorage } from "../hooks/useLocalStorage.ts"
import { useSceneAssets } from "../hooks/useSceneAssets.ts"
import { handleDrag } from "../lib/drag.ts"
import {
	defaultViewportTransform,
	getViewportScale,
	handleViewportZoom,
	ViewportTransform,
} from "../lib/viewport.ts"
import mapUrl from "../map.jpg"

export function SceneViewer() {
	const { roomId } = useParams<{ roomId: string }>()
	const {
		assets,
		addAssetToScene,
		updateAssetProperties: _updateAssetProperties,
		removeAssetFromScene: _removeAssetFromScene,
	} = useSceneAssets(roomId as Id<"rooms">)
	const { dragState } = useDrag()

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
		// Only handle right-click for panning the scene
		if (event.button !== 2) return

		event.preventDefault()
		handleDrag((event) => {
			setViewportTransform((transform) => ({
				...transform,
				offset: {
					x: transform.offset.x + event.movementX,
					y: transform.offset.y + event.movementY,
				},
			}))
		})
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
				className="absolute top-0 left-0 origin-top-left transition-[scale,translate] duration-100 ease-out"
				style={{
					translate: `${viewportTransform.offset.x}px ${viewportTransform.offset.y}px`,
					scale: getViewportScale(viewportTransform.zoom),
				}}
			>
				<img src={mapUrl} draggable={false} className="max-w-[unset]" />
				{assets.map((asset) => (
					<div
						key={asset._id}
						className="absolute top-0 left-0 origin-top-left cursor-move"
						style={{
							translate: `${asset.position.x}px ${asset.position.y}px`,
							rotate: `${asset.rotation ?? 0}deg`,
							width: `${asset.size?.width ?? "auto"}px`,
							height: `${asset.size?.height ?? "auto"}px`,
						}}
					>
						<img
							src={asset.url || ""}
							alt={asset.name || ""}
							className="max-h-full max-w-full object-contain"
							draggable={false}
						/>
					</div>
				))}
			</div>
		</div>
	)
}
