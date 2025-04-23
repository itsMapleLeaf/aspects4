import { Heading, HeadingLevel } from "@ariakit/react"
import { type } from "arktype"
import { useAction, useMutation, useQuery } from "convex/react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useFileUpload } from "~/hooks/useFileUpload.ts"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import type { NormalizedAsset } from "../../convex/assets.ts"
import { Icon } from "./ui/Icon.tsx"
import { Menu, MenuButton, MenuItem, MenuPanel } from "./ui/Menu.tsx"

export function AssetsPanel({ roomId }: { roomId: Id<"rooms"> }) {
	const assets = useQuery(api.assets.list)
	const createAsset = useMutation(api.assets.create)
	const roomAssets = useQuery(api.roomAssets.list, { roomId })

	const roomAssetsByAssetId = new Map(
		roomAssets?.map((asset) => [asset.assetId, asset]) ?? [],
	)

	const [isFileOver, setIsFileOver] = useState(false)
	const { uploadFile } = useFileUpload()

	useEffect(() => {
		const controller = new AbortController()

		window.addEventListener(
			"dragenter",
			(event) => {
				if (event.dataTransfer?.types.includes("Files")) {
					event.preventDefault()
					setIsFileOver(true)
				}
			},
			{ signal: controller.signal },
		)

		window.addEventListener(
			"dragleave",
			(event) => {
				if (event.dataTransfer?.types.includes("Files")) {
					event.preventDefault()
					setIsFileOver(false)
				}
			},
			{ signal: controller.signal },
		)

		window.addEventListener(
			"dragover",
			(event) => {
				if (event.dataTransfer?.types.includes("Files")) {
					event.preventDefault()
					setIsFileOver(true)
				}
			},
			{ signal: controller.signal },
		)

		window.addEventListener(
			"drop",
			async (event) => {
				const isFileType = event.dataTransfer?.types.includes("Files")
				if (!isFileType) return

				event.preventDefault()
				setIsFileOver(false)

				for (const file of event.dataTransfer?.files ?? []) {
					const { width, height } = await createImageBitmap(file)

					const storageId = await uploadFile(file)
					if (!storageId) return

					await createAsset({
						name: file.name,
						type: file.type,
						size: { x: width, y: height },
						storageId,
					})
				}
			},
			{ signal: controller.signal },
		)

		return () => {
			controller.abort()
		}
	})

	return (
		<section className="isolate flex h-full w-64 flex-col gap-4 overflow-y-auto panel p-4">
			<HeadingLevel>
				<header className="sticky -top-4 z-10 -m-4 flex h-16 items-center justify-between bg-gray-900 px-4">
					<Heading className="heading-xl">Assets</Heading>
				</header>

				<ul className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2">
					{assets
						?.filter((asset) => !roomAssetsByAssetId.has(asset._id))
						?.map((asset) => (
							<li key={asset._id}>
								<AssetCard asset={asset} roomId={roomId} />
							</li>
						))}
				</ul>
			</HeadingLevel>

			{createPortal(
				<div
					className="invisible fixed inset-0 flex items-center justify-center bg-black/25 opacity-0 backdrop-blur transition-all data-[visible=true]:visible data-[visible=true]:opacity-100"
					data-visible={isFileOver}
				>
					<p className="heading-4xl text-white">Drop files to import assets</p>
				</div>,
				document.body,
			)}
		</section>
	)
}

export const AssetDropData = type("string.json.parse").to({
	assetId: "string",
})

function AssetCard({
	asset,
	roomId,
}: {
	asset: NormalizedAsset
	roomId: Id<"rooms">
}) {
	const removeAsset = useMutation(api.assets.remove)
	const createRoomAsset = useMutation(api.roomAssets.place)
	const setAsRoomBackground = useAction(api.assets.setAsRoomBackground)
	const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
	return (
		<Menu placement="bottom-start">
			<MenuButton
				className="block w-full overflow-clip panel-dark rounded outline-2 outline-transparent transition select-none hover:border-gray-600"
				draggable
				onPointerDown={(event: React.PointerEvent) => {
					setMenuPosition({ x: event.clientX, y: event.clientY })
				}}
				onDragStart={(event: React.DragEvent) => {
					const data: typeof AssetDropData.inferOut = {
						assetId: asset._id,
					}
					event.dataTransfer.setData("application/json", JSON.stringify(data))
					event.dataTransfer.dropEffect = "move"
				}}
			>
				<img
					src={asset.url || ""}
					alt=""
					className="aspect-square w-full rounded-xs object-cover object-top transition"
					draggable={false}
				/>
				<p className="truncate px-2 py-1 text-center text-xs leading-none font-medium">
					{asset.name}
				</p>
			</MenuButton>
			<MenuPanel gutter={0} getAnchorRect={() => menuPosition}>
				<MenuItem
					onClick={() =>
						createRoomAsset({
							assetId: asset._id,
							roomId,
						})
					}
				>
					<Icon icon="mingcute:classify-add-2-fill" className="size-5" />
					<span>Add to scene</span>
				</MenuItem>
				<MenuItem
					onClick={() =>
						setAsRoomBackground({
							assetId: asset._id,
							roomId,
						})
					}
				>
					<Icon icon="mingcute:pic-fill" className="size-5" />
					<span>Set as background</span>
				</MenuItem>
				<MenuItem onClick={() => removeAsset({ assetIds: [asset._id] })}>
					<Icon icon="mingcute:delete-2-fill" className="size-5" />
					<span>Delete</span>
				</MenuItem>
			</MenuPanel>
		</Menu>
	)
}
