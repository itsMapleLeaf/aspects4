import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useDrag } from "../contexts/DragContext.tsx"
import { useLocalAssets } from "../hooks/useLocalAssets.ts"
import { panel } from "../styles/panel.ts"
import { Button } from "./ui/Button.tsx"
import { Icon } from "./ui/Icon.tsx"

export function AssetsPanel() {
	const assets = useLocalAssets()
	const { startAssetDrag, endAssetDrag } = useDrag()
	const [isImporting, setIsImporting] = useState(false)
	const [isDragging, setIsDragging] = useState(false)

	const handleFileSelect = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const files = event.target.files
		if (!files || files.length === 0) return

		try {
			setIsImporting(true)
			for (const file of files) {
				await assets.add(file)
			}
		} catch (err) {
			console.error("Failed to import asset:", err)
		} finally {
			setIsImporting(false)
		}

		event.target.value = ""
	}

	const openFileSelector = () => {
		const fileInput = document.getElementById(
			"asset-file-input",
		) as HTMLInputElement
		if (fileInput) fileInput.click()
	}

	useEffect(() => {
		const handleDragOver = (e: DragEvent) => {
			e.preventDefault()
			e.stopPropagation()

			// Only show drag overlay for file system drags (not for our internal asset drags)
			if (!isDragging && e.dataTransfer?.types.includes("Files")) {
				setIsDragging(true)
			}
		}

		const handleDragLeave = (e: DragEvent) => {
			e.preventDefault()
			e.stopPropagation()

			// Only consider it a leave if we're leaving the window
			if (
				e.clientX <= 0 ||
				e.clientX >= window.innerWidth ||
				e.clientY <= 0 ||
				e.clientY >= window.innerHeight
			) {
				setIsDragging(false)
			}
		}

		const handleDrop = async (e: DragEvent) => {
			e.preventDefault()
			e.stopPropagation()
			setIsDragging(false)

			// Only process file drops, not our internal asset drags
			if (
				!e.dataTransfer?.files.length ||
				!e.dataTransfer.types.includes("Files")
			)
				return

			try {
				setIsImporting(true)

				const filePromises = Array.from(e.dataTransfer.files)
					.filter((file) => file.type.startsWith("image/"))
					.map((file) => assets.add(file))

				await Promise.all(filePromises)
			} catch (err) {
				console.error("Error importing dropped files:", err)
			} finally {
				setIsImporting(false)
			}
		}

		window.addEventListener("dragover", handleDragOver)
		window.addEventListener("dragleave", handleDragLeave)
		window.addEventListener("drop", handleDrop)

		return () => {
			window.removeEventListener("dragover", handleDragOver)
			window.removeEventListener("dragleave", handleDragLeave)
			window.removeEventListener("drop", handleDrop)
		}
	})

	return (
		<>
			{(isDragging || isImporting) &&
				createPortal(
					<div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/70">
						<div className="text-center">
							<h2 className="mb-4 text-4xl font-light text-white">
								{isImporting ? "Importing assets..." : "Add files as assets"}
							</h2>
							{isImporting && (
								<div className="animate-pulse text-xl text-white/80">
									Processing files...
								</div>
							)}
						</div>
					</div>,
					document.body,
				)}

			<div className={panel("flex h-full w-64 flex-col gap-4 p-4")}>
				<h2 className="text-xl font-light">Assets</h2>

				<input
					id="asset-file-input"
					type="file"
					accept="image/*"
					multiple
					onChange={handleFileSelect}
					className="hidden"
				/>

				<Button
					appearance="default"
					size="default"
					icon={<Icon icon="mingcute:file-import-line" />}
					onClick={openFileSelector}
					pending={isImporting}
					className="w-full"
				>
					Import Asset
				</Button>

				{assets.error && (
					<div className="mt-2 text-sm text-red-500">
						{assets.error.message}
					</div>
				)}

				{assets.loading && (
					<div className="flex justify-center py-4">
						<Icon
							icon="mingcute:loading-3-fill"
							className="size-6 animate-spin"
						/>
					</div>
				)}

				<div className="-mx-4 min-h-0 flex-1 overflow-y-auto px-4">
					{assets.list.length === 0 && !assets.loading ?
						<div className="py-4 text-center text-gray-400">
							No assets imported yet
						</div>
					:	<div className="grid grid-cols-2 gap-2">
							{assets.list.map((asset) => (
								<div
									key={asset.id}
									className="group relative cursor-grab active:cursor-grabbing"
									draggable
									onDragStart={async () => {
										startAssetDrag({
											id: asset.id,
											name: asset.name,
											type: asset.type,
											url: asset.url || "",
										})
									}}
									onDragEnd={() => {
										endAssetDrag()
									}}
								>
									<img
										src={asset.url}
										alt={asset.name}
										className="h-24 w-full rounded-md border border-gray-700 object-cover"
									/>
									<div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
										<div className="flex gap-2">
											<button
												onClick={() => assets.remove(asset.id)}
												className="rounded-full bg-red-500 p-1 transition-colors hover:bg-red-600"
												title="Delete asset"
											>
												<Icon icon="mingcute:delete-fill" className="size-4" />
											</button>
											<button
												className="rounded-full bg-blue-500 p-1 transition-colors hover:bg-blue-600"
												title="Drag to add to scene"
											>
												<Icon icon="mingcute:move-fill" className="size-4" />
											</button>
										</div>
									</div>
									<div className="mt-1 truncate text-xs">{asset.name}</div>
								</div>
							))}
						</div>
					}
				</div>
			</div>
		</>
	)
}
