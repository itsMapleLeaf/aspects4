import { useMutation, useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"
import { useCallback, useState } from "react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"

export type SceneAsset = FunctionReturnType<typeof api.assets.list>[number]

export function useSceneAssets(roomId: Id<"rooms">) {
	const [isUploading, setIsUploading] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	const assets = useQuery(api.assets.list, { roomId }) || []

	const generateUploadUrl = useMutation(api.assets.generateUploadUrl)
	const createAsset = useMutation(api.assets.create)
	const updateAsset = useMutation(api.assets.update)
	const removeAsset = useMutation(api.assets.remove)

	const addAssetToScene = useCallback(
		async (
			asset: { name: string; url: string; type: string },
			position: { x: number; y: number },
		) => {
			try {
				setIsUploading(true)
				setError(null)

				const assetBlob = await fetch(asset.url).then((res) => res.blob())

				const { width, height } = await createImageBitmap(assetBlob)

				const uploadUrl = await generateUploadUrl()

				const result = await fetch(uploadUrl, {
					method: "POST",
					headers: {
						"Content-Type": asset.type,
					},
					body: assetBlob,
				})

				if (!result.ok) {
					throw new Error(`Failed to upload file: ${result.statusText}`)
				}

				const responseData = (await result.json()) as { storageId: string }
				const fileId = responseData.storageId as Id<"_storage">

				await createAsset({
					name: asset.name,
					type: asset.type,
					fileId,
					roomId,
					position: {
						x: position.x - width / 2,
						y: position.y - height / 2,
					},
					size: { width, height },
				})

				return true
			} catch (err) {
				console.error("Error adding asset to scene:", err)
				setError(err instanceof Error ? err : new Error(String(err)))
				return false
			} finally {
				setIsUploading(false)
			}
		},
		[generateUploadUrl, createAsset, roomId],
	)

	const updateAssetProperties = useCallback(
		async (
			assetId: Id<"assets">,
			updates: {
				position?: { x: number; y: number }
				size?: { width: number; height: number }
				rotation?: number
			},
		) => {
			try {
				setError(null)
				await updateAsset({
					assetId,
					...updates,
				})
				return true
			} catch (err) {
				console.error("Error updating asset:", err)
				setError(err instanceof Error ? err : new Error(String(err)))
				return false
			}
		},
		[updateAsset],
	)

	const removeAssetFromScene = useCallback(
		async (assetId: Id<"assets">) => {
			try {
				setError(null)
				await removeAsset({ assetId })
				return true
			} catch (err) {
				console.error("Error removing asset:", err)
				setError(err instanceof Error ? err : new Error(String(err)))
				return false
			}
		},
		[removeAsset],
	)

	return {
		assets,
		isUploading,
		error,
		addAssetToScene,
		updateAssetProperties,
		removeAssetFromScene,
	}
}
export function useUpdateAsset() {
	return useMutation(api.assets.update).withOptimisticUpdate(
		(localStore, { assetId, ...updates }) => {
			for (const query of localStore.getAllQueries(api.assets.list)) {
				if (query.value === undefined) return
				localStore.setQuery(
					api.assets.list,
					{ roomId: query.args.roomId },
					query.value.map((asset: SceneAsset) =>
						asset._id === assetId ? { ...asset, ...updates } : asset,
					),
				)
			}
		},
	)
}

export function useRemoveAsset() {
	return useMutation(api.assets.remove).withOptimisticUpdate(
		(localStore, { assetId }) => {
			for (const query of localStore.getAllQueries(api.assets.list)) {
				if (query.value === undefined) return
				localStore.setQuery(
					api.assets.list,
					{ roomId: query.args.roomId },
					query.value.filter((asset) => asset._id !== assetId),
				)
			}
		},
	)
}

export function useMoveAssetToFront() {
	return useMutation(api.assets.moveToFront).withOptimisticUpdate(
		(localStore, { assetId }) => {
			for (const query of localStore.getAllQueries(api.assets.list)) {
				if (query.value === undefined) return
				
				const assets = [...query.value]
				const assetIndex = assets.findIndex((asset) => asset._id === assetId)
				
				if (assetIndex !== -1) {
					const asset = assets[assetIndex]
					if (asset) {
						asset.updatedAt = Date.now()
						
						localStore.setQuery(
							api.assets.list,
							{ roomId: query.args.roomId },
							assets.sort((a, b) => a.updatedAt - b.updatedAt)
						)
					}
				}
			}
		},
	)
}
