import { useMutation } from "convex/react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"

interface UseFileUploadOptions {
	onSuccess?: (storageId: Id<"_storage">) => void
	onError?: (error: Error) => void
}

interface FileUploadState {
	isUploading: boolean
	error: Error | null
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
	const generateUploadUrl = useMutation(api.storage.generateUploadUrl)
	const [state, setState] = useState<FileUploadState>({
		isUploading: false,
		error: null,
	})

	const uploadFile = async (blob: Blob): Promise<Id<"_storage"> | null> => {
		setState({ isUploading: true, error: null })

		try {
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

			setState({ isUploading: false, error: null })

			if (options.onSuccess) {
				options.onSuccess(storageId)
			}

			return storageId
		} catch (error) {
			const uploadError =
				error instanceof Error ? error : new Error(String(error))

			setState({ isUploading: false, error: uploadError })

			if (options.onError) {
				options.onError(uploadError)
			}

			console.error("File upload error:", uploadError)
			return null
		}
	}

	return {
		uploadFile,
		isUploading: state.isUploading,
		error: state.error,
	}
}
