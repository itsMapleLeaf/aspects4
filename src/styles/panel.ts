import { ClassNameValue, twMerge } from "tailwind-merge"

export const panel = (...classes: ClassNameValue[]) =>
	twMerge(
		"rounded-md border overflow-clip border-gray-800 bg-gray-900 p-3 shadow-md shadow-black/50",
		...classes,
	)
