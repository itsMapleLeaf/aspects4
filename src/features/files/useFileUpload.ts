import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"

export function useFileUpload() {
	const generateUploadUrl = useMutation(api.storage.generateUploadUrl)

	return async function uploadFile(blob: Blob) {
		const uploadUrl = await generateUploadUrl()

		const result = await fetch(uploadUrl, {
			method: "POST",
			body: blob,
		})

		if (!result.ok) {
			throw new Error(`Upload failed: ${result.statusText}`)
		}

		const { storageId } = (await result.json()) as {
			storageId: Id<"_storage">
		}

		return storageId
	}
}
