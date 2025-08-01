import { createContext, ReactNode, use, useState } from "react"
import { DragContextType, DragState, initialDragState } from "./dragTypes.ts"

const DragContext = createContext<DragContextType | undefined>(undefined)

export function DragProvider({ children }: { children: ReactNode }) {
	const [dragState, setDragState] = useState<DragState>(initialDragState)

	const startAssetDrag = (assetData: DragState["assetData"]) => {
		setDragState({
			isDragging: true,
			assetData,
		})
	}

	const endAssetDrag = () => {
		setDragState(initialDragState)
	}

	return (
		<DragContext
			value={{ dragState, setDragState, startAssetDrag, endAssetDrag }}
		>
			{children}
		</DragContext>
	)
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDrag() {
	const context = use(DragContext)
	if (context === undefined) {
		throw new Error("useDrag must be used within a DragProvider")
	}
	return context
}
