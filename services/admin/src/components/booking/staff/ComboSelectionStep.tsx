import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { ComboItem } from "../../../lib/types"
import { Minus, Plus } from "lucide-react"

interface ComboSelectionStepProps {
  combos: ComboItem[]
  selectedCombos: ComboItem[]
  onSelectCombos: (combos: ComboItem[]) => void
  loading: boolean
}

export default function ComboSelectionStep({
  combos,
  selectedCombos,
  onSelectCombos,
  loading,
}: ComboSelectionStepProps) {
  const handleSelectCombo = (combo: ComboItem) => {
    const existing = selectedCombos.find((c) => c.id === combo.id)
    if (existing) {
      onSelectCombos(selectedCombos.filter((c) => c.id !== combo.id))
    } else {
      onSelectCombos([...selectedCombos, { ...combo, quantity: 1 }])
    }
  }

  const handleQuantityChange = (comboId: string, quantity: number) => {
    if (quantity <= 0) {
      onSelectCombos(selectedCombos.filter((c) => c.id !== comboId))
    } else {
      onSelectCombos(
        selectedCombos.map((c) =>
          c.id === comboId ? { ...c, quantity } : c
        )
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading combos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Select Combos (Optional)</h2>
      </div>

      {combos.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No combos available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {combos.map((combo) => {
            const selectedCombo = selectedCombos.find((c) => c.id === combo.id)
            const isSelected = !!selectedCombo

            return (
              <Card
                key={combo.id}
                className={`p-4 cursor-pointer transition-all flex gap-4 ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "hover:shadow-lg"
                }`}
                onClick={() => !isSelected && handleSelectCombo(combo)}
              >
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-purple-700/10 flex items-center justify-center shrink-0">
                  {combo.imageUrl ? (
                    <img
                      src={combo.imageUrl}
                      alt={combo.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  ) : (
                    <span className="text-3xl">🍿</span>
                  )}
                </div>

                <div className="space-y-3 flex-1">
                  <div>
                    <h3 className="font-bold">{combo.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {combo.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="font-bold text-lg text-blue-600">
                      {combo.price.toLocaleString()} VND
                    </span>

                    {isSelected ? (
                      <div className="flex items-center gap-2 bg-white rounded border">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleQuantityChange(
                              combo.id,
                              (selectedCombo?.quantity || 1) - 1
                            )
                          }}
                          className="p-1 hover:bg-gray-100"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={selectedCombo?.quantity || 1}
                          onChange={(e) => {
                            e.stopPropagation()
                            const qty = parseInt(e.target.value) || 1
                            handleQuantityChange(combo.id, qty)
                          }}
                          className="w-10 text-center border-0 focus:ring-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleQuantityChange(
                              combo.id,
                              (selectedCombo?.quantity || 1) + 1
                            )
                          }}
                          className="p-1 hover:bg-gray-100"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectCombo(combo)
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {selectedCombos.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold mb-3">Selected Combos:</h3>
          <div className="space-y-2">
            {selectedCombos.map((combo) => (
              <div key={combo.id} className="flex justify-between items-center text-sm">
                <span>{combo.name} × {combo.quantity}</span>
                <span className="font-semibold">
                  {(combo.price * (combo.quantity || 1)).toLocaleString()} VND
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
