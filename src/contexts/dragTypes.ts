export type DragState = {
  isDragging: boolean
  assetData: {
    id: string
    name: string
    type: string
    url: string
  } | null
}

export type DragContextType = {
  dragState: DragState
  setDragState: (state: DragState) => void
  startAssetDrag: (assetData: DragState["assetData"]) => void
  endAssetDrag: () => void
}

export const initialDragState: DragState = {
  isDragging: false,
  assetData: null
}
