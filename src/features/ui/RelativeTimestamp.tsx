import { formatDistanceToNow, type FormatDistanceToNowOptions } from "date-fns"

export function RelativeTimestamp({
	timestamp,
	options,
}: {
	timestamp: string | number | Date
	options?: FormatDistanceToNowOptions
}) {
	const text = formatDistanceToNow(timestamp, { addSuffix: true, ...options })
	return <time dateTime={new Date(timestamp).toISOString()}>{text}</time>
}
