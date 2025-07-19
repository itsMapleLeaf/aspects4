import { urlSearchParams } from "./utils.ts"

export function getThumbnailUrl(url: string, width: number, height = width) {
	return (
		`/.netlify/images?` +
		urlSearchParams({
			url,
			w: width,
			h: height,
			quality: 100,
		})
	)
}
