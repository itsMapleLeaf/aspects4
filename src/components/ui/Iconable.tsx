import type { ReactElement } from "react"
import { Icon } from "./Icon.tsx"

export type Iconable = string | ReactElement

export function renderIconable(iconable: Iconable) {
	return typeof iconable === "string" ?
			<Icon icon={iconable} aria-hidden />
		:	iconable
}
