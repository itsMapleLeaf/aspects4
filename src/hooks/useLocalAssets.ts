import { useEffect, useState } from "react"

export interface Asset {
	id: string
	name: string
	type: string
	data: Blob
	createdAt: number
	url?: string
}

const openDB = (): Promise<IDBDatabase> => {
	return new Promise((resolve, reject) => {
		const request = window.indexedDB.open("AssetsDB", 1)

		request.onerror = () => {
			console.error("Failed to open IndexedDB")
			reject(request.error)
		}

		request.onsuccess = () => {
			resolve(request.result)
		}

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result
			if (!db.objectStoreNames.contains("assets")) {
				const store = db.createObjectStore("assets", { keyPath: "id" })
				store.createIndex("name", "name", { unique: false })
				store.createIndex("type", "type", { unique: false })
				store.createIndex("createdAt", "createdAt", { unique: false })
			}
		}
	})
}

export function useLocalAssets() {
	const [assets, setAssets] = useState<Asset[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	useEffect(() => {
		const loadAssets = async () => {
			try {
				setLoading(true)
				const db = await openDB()
				const transaction = db.transaction(["assets"], "readonly")
				const store = transaction.objectStore("assets")
				const request = store.getAll()

				request.onsuccess = () => {
					const assetsWithUrls = request.result.map((asset) => ({
						...asset,
						url: URL.createObjectURL(asset.data),
					}))
					setAssets(assetsWithUrls)
					setLoading(false)
				}

				request.onerror = () => {
					throw new Error("Failed to load assets")
				}
			} catch (err) {
				console.error("Error loading assets:", err)
				setError(err instanceof Error ? err : new Error(String(err)))
				setLoading(false)
			}
		}

		loadAssets()
	}, [])

	const addAsset = async (file: File): Promise<void> => {
		try {
			const asset: Asset = {
				id: crypto.randomUUID(),
				name: file.name,
				type: file.type,
				data: file,
				createdAt: Date.now(),
			}

			const db = await openDB()
			const transaction = db.transaction(["assets"], "readwrite")
			const store = transaction.objectStore("assets")

			return new Promise((resolve, reject) => {
				const request = store.add(asset)

				request.onsuccess = () => {
					const assetWithUrl = {
						...asset,
						url: URL.createObjectURL(file),
					}
					setAssets((prev) => [...prev, assetWithUrl])
					resolve()
				}

				request.onerror = () => {
					reject(new Error("Failed to import asset"))
				}
			})
		} catch (err) {
			console.error("Error importing asset:", err)
			setError(err instanceof Error ? err : new Error(String(err)))
			throw err
		}
	}

	const deleteAsset = async (id: string): Promise<void> => {
		try {
			const assetToDelete = assets.find((asset) => asset.id === id)

			const db = await openDB()
			const transaction = db.transaction(["assets"], "readwrite")
			const store = transaction.objectStore("assets")
			const request = store.delete(id)

			return new Promise((resolve, reject) => {
				request.onsuccess = () => {
					if (assetToDelete?.url) {
						URL.revokeObjectURL(assetToDelete.url)
					}

					setAssets((prev) => prev.filter((asset) => asset.id !== id))
					resolve()
				}

				request.onerror = () => {
					reject(new Error("Failed to delete asset"))
				}
			})
		} catch (err) {
			console.error("Error deleting asset:", err)
			setError(err instanceof Error ? err : new Error(String(err)))
			throw err
		}
	}

	return {
		list: assets,
		loading,
		error,
		add: addAsset,
		remove: deleteAsset,
	}
}
