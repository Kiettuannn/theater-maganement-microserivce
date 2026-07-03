import type { ComboItem } from "../../../lib/types"
import { Minus, Plus, ShoppingBag } from "lucide-react"

interface MiniComboPanelProps {
  combos: ComboItem[]
  selectedCombos: ComboItem[]
  onSelectCombos: (combos: ComboItem[]) => void
  loading: boolean
}

export default function MiniComboPanel({
  combos,
  selectedCombos,
  onSelectCombos,
  loading,
}: MiniComboPanelProps) {
  const handleSelectCombo = (combo: ComboItem) => {
    const existing = selectedCombos.find((c) => c.id === combo.id)
    if (existing) {
      onSelectCombos(selectedCombos.filter((c) => c.id !== combo.id))
    } else {
      onSelectCombos([...selectedCombos, { ...combo, quantity: 1 }])
    }
  }

  const handleQuantityChange = (comboId: string, delta: number) => {
    const existing = selectedCombos.find((c) => c.id === comboId)
    if (!existing) return
    const newQty = (existing.quantity || 1) + delta
    if (newQty <= 0) {
      onSelectCombos(selectedCombos.filter((c) => c.id !== comboId))
    } else {
      onSelectCombos(
        selectedCombos.map((c) => (c.id === comboId ? { ...c, quantity: newQty } : c))
      )
    }
  }

  const comboTotal = selectedCombos.reduce(
    (sum, c) => sum + c.price * (c.quantity || 1),
    0
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <ShoppingBag className="w-4 h-4 text-purple-600" />
        <h3 className="font-semibold text-sm text-gray-800">Add Combos</h3>
        <span className="text-xs text-gray-400">(Optional)</span>
      </div>

      {/* Combo list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ maxHeight: 340 }}>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : combos.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No combos available</p>
        ) : (
          combos.map((combo) => {
            const sel = selectedCombos.find((c) => c.id === combo.id)
            const isSelected = !!sel

            return (
              <div
                key={combo.id}
                className={`rounded-lg border p-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-purple-400 bg-purple-50"
                    : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                }`}
                onClick={() => !isSelected && handleSelectCombo(combo)}
              >
                <div className="flex items-center gap-2">
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-md overflow-hidden bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shrink-0">
                    {combo.imageUrl ? (
                      <img
                        src={combo.imageUrl}
                        alt={combo.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = "none" }}
                      />
                    ) : (
                      <span className="text-lg">🍿</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{combo.name}</p>
                    <p className="text-xs text-purple-600 font-bold">
                      {combo.price.toLocaleString()} VND
                    </p>
                  </div>

                  {/* Quantity control or Add button */}
                  {isSelected ? (
                    <div
                      className="flex items-center gap-1 bg-white border border-purple-300 rounded-md px-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors"
                        onClick={() => handleQuantityChange(combo.id, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-gray-800">
                        {sel?.quantity || 1}
                      </span>
                      <button
                        className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-green-500 transition-colors"
                        onClick={() => handleQuantityChange(combo.id, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-md transition-colors shrink-0"
                      onClick={(e) => { e.stopPropagation(); handleSelectCombo(combo) }}
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Selected summary */}
      {selectedCombos.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="space-y-1 mb-2">
            {selectedCombos.map((c) => (
              <div key={c.id} className="flex justify-between text-xs text-gray-600">
                <span className="truncate max-w-[120px]">{c.name} ×{c.quantity || 1}</span>
                <span className="font-semibold text-gray-800 shrink-0">
                  {(c.price * (c.quantity || 1)).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs font-bold text-purple-700 border-t pt-1">
            <span>Combo total</span>
            <span>{comboTotal.toLocaleString()} VND</span>
          </div>
        </div>
      )}
    </div>
  )
}
