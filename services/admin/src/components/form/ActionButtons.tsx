import { Save, Loader2 } from "lucide-react"

interface ActionButtonsProps {
  isEditing: boolean
  isSaving?: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  editLabel?: string
  cancelLabel?: string
  saveLabel?: string
  savingLabel?: string
}

export function ActionButtons({
  isEditing,
  isSaving = false,
  onEdit,
  onCancel,
  onSave,
  editLabel = "Edit",
  cancelLabel = "Cancel",
  saveLabel = "Save Changes",
  savingLabel = "Saving..."
}: ActionButtonsProps) {
  return (
    <div className="flex justify-end mb-6">
      {isEditing ? (
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="cursor-pointer px-4 py-2 rounded-lg border border-border text-foreground hover:bg-accent transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="cursor-pointer px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {savingLabel}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {saveLabel}
              </>
            )}
          </button>
        </div>
      ) : (
        <button
          onClick={onEdit}
          className="cursor-pointer px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {editLabel}
        </button>
      )}
    </div>
  )
}
