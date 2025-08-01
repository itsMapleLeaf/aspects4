import { type } from "arktype"

export const AssetDropData = type("string.json.parse").to({
	assetId: "string",
})
