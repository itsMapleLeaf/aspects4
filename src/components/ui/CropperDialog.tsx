import { useCallback, useState } from "react"
import Cropper, { Area } from "react-easy-crop"
import { Button } from "./Button.tsx"
import { Icon } from "./Icon.tsx"

/**
 * Avatar cropping dialog using react-easy-crop
 *
 * Usage pattern:
 *
 * ```tsx
 * const [imageToCrop, setImageToCrop] = useState<string | null>(null)
 *
 * const handleFileSelect = (
 * 	event: React.ChangeEvent<HTMLInputElement>,
 * ) => {
 * 	const file = event.target.files?.[0]
 * 	if (!file) return
 * 	setImageToCrop(URL.createObjectURL(file))
 * }
 *
 * const handleCropComplete = async (croppedBlob: Blob) => {
 * 	const storageId = await uploadFile(croppedBlob)
 * 	await updateAvatar({ storageId })
 * 	setImageToCrop(null)
 * }
 *
 * const handleCropCancel = () => {
 * 	if (imageToCrop) {
 * 		URL.revokeObjectURL(imageToCrop)
 * 	}
 * 	setImageToCrop(null)
 * }
 * ```
 */

export interface CropperDialogProps {
	imageSrc: string
	onCropComplete: (croppedImageBlob: Blob) => void
	onCancel: () => void
	aspectRatio?: number
}

export function CropperDialog({
	imageSrc,
	onCropComplete,
	onCancel,
	aspectRatio = 1,
}: CropperDialogProps) {
	const [crop, setCrop] = useState({ x: 0, y: 0 })
	const [zoom, setZoom] = useState(1)
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

	const onCropCompleteCallback = useCallback(
		(_croppedArea: Area, croppedAreaPixels: Area) => {
			setCroppedAreaPixels(croppedAreaPixels)
		},
		[],
	)

	const handleSave = useCallback(async () => {
		if (!croppedAreaPixels) return

		try {
			const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
			onCropComplete(croppedImage)
		} catch (error) {
			console.error("Failed to crop image:", error)
		}
	}, [croppedAreaPixels, imageSrc, onCropComplete])

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
			<div className="flex h-full w-full max-w-2xl flex-col bg-gray-900 p-6">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-xl font-light text-white">Crop Avatar</h2>
					<Button
						appearance="ghost"
						icon={<Icon icon="mingcute:close-fill" />}
						onClick={onCancel}
					/>
				</div>

				<div className="relative flex-1 bg-black">
					<Cropper
						image={imageSrc}
						crop={crop}
						zoom={zoom}
						aspect={aspectRatio}
						onCropChange={setCrop}
						onCropComplete={onCropCompleteCallback}
						onZoomChange={setZoom}
						showGrid={false}
						cropShape="round"
					/>
				</div>

				<div className="mt-4 flex items-center gap-4">
					<label className="flex items-center gap-2 text-white">
						<span className="text-sm">Zoom:</span>
						<input
							type="range"
							value={zoom}
							min={1}
							max={3}
							step={0.1}
							onChange={(e) => setZoom(Number(e.target.value))}
							className="flex-1"
						/>
					</label>
				</div>

				<div className="mt-6 flex justify-end gap-2">
					<Button appearance="ghost" onClick={onCancel}>
						Cancel
					</Button>
					<Button
						icon={<Icon icon="mingcute:check-fill" />}
						onClick={handleSave}
						disabled={!croppedAreaPixels}
					>
						Save
					</Button>
				</div>
			</div>
		</div>
	)
}

// Helper function to create cropped image
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
	const image = new Image()
	image.src = imageSrc

	await new Promise((resolve) => {
		image.onload = resolve
	})

	const canvas = document.createElement("canvas")
	const ctx = canvas.getContext("2d")

	if (!ctx) {
		throw new Error("No 2d context")
	}

	canvas.width = pixelCrop.width
	canvas.height = pixelCrop.height

	ctx.drawImage(
		image,
		pixelCrop.x,
		pixelCrop.y,
		pixelCrop.width,
		pixelCrop.height,
		0,
		0,
		pixelCrop.width,
		pixelCrop.height,
	)

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) {
					resolve(blob)
				} else {
					reject(new Error("Canvas is empty"))
				}
			},
			"image/jpeg",
			0.95,
		)
	})
}
