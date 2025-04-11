import { type } from "arktype"

export type AssetDragData = typeof AssetDragData.inferOut
export const AssetDragData = type({
	id: "string",
	name: "string",
	type: "string",
	url: "string",
})
