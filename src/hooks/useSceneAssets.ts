import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useState, useCallback } from "react"
import { Id } from "../../convex/_generated/dataModel"

export interface SceneAsset {
  _id: Id<"assets">
  name: string
  type: string
  url: string
  position: {
    x: number
    y: number
  }
  size?: {
    width: number
    height: number
  }
  rotation?: number
  createdAt: number
}

export function useSceneAssets(roomId: Id<"rooms">) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Query assets for the current room
  const assets = useQuery(api.assets.list, { roomId }) || []
  
  // Mutations
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl)
  const createAsset = useMutation(api.assets.create)
  const updateAsset = useMutation(api.assets.update)
  const removeAsset = useMutation(api.assets.remove)
  
  // Add an asset to the scene
  const addAssetToScene = useCallback(async (
    file: File, 
    position: { x: number, y: number }
  ) => {
    try {
      setIsUploading(true)
      setError(null)
      
      // 1. Get a URL to upload the file
      const uploadUrl = await generateUploadUrl()
      
      // 2. Upload the file to the URL
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
      
      // 3. Get the storage ID from the response
      const responseData = await result.json() as { storageId: string }
      const fileId = responseData.storageId as Id<"_storage">
      
      // 4. Create the asset in the database
      await createAsset({
        name: file.name,
        type: file.type,
        fileId,
        roomId,
        position,
        // Optional size and rotation can be added later
      })
      
      return true
    } catch (err) {
      console.error("Error adding asset to scene:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
      return false
    } finally {
      setIsUploading(false)
    }
  }, [generateUploadUrl, createAsset, roomId])
  
  // Update an asset's position, size, or rotation
  const updateAssetProperties = useCallback(async (
    assetId: Id<"assets">,
    updates: {
      position?: { x: number, y: number }
      size?: { width: number, height: number }
      rotation?: number
    }
  ) => {
    try {
      setError(null)
      await updateAsset({
        assetId,
        ...updates
      })
      return true
    } catch (err) {
      console.error("Error updating asset:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
      return false
    }
  }, [updateAsset])
  
  // Remove an asset from the scene
  const removeAssetFromScene = useCallback(async (assetId: Id<"assets">) => {
    try {
      setError(null)
      await removeAsset({ assetId })
      return true
    } catch (err) {
      console.error("Error removing asset:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
      return false
    }
  }, [removeAsset])
  
  return {
    assets,
    isUploading,
    error,
    addAssetToScene,
    updateAssetProperties,
    removeAssetFromScene
  }
}
