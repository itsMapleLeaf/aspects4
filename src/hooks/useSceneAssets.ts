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
		async (file: File, position: { x: number; y: number }) => {
			try {
				setIsUploading(true)
				setError(null)

				const { width, height } = await createImageBitmap(file)

				const uploadUrl = await generateUploadUrl()

				const result = await fetch(uploadUrl, {
					method: "POST",
					headers: {
						"Content-Type": file.type,
					},
					body: file,
				})

				if (!result.ok) {
					throw new Error(`Failed to upload file: ${result.statusText}`)
				}

				const responseData = (await result.json()) as { storageId: string }
				const fileId = responseData.storageId as Id<"_storage">

				await createAsset({
					name: file.name,
					type: file.type,
					fileId,
					roomId,
					position,
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
