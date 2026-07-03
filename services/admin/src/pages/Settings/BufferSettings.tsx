import { useState, useEffect } from "react";
import { 
  getCinemasForBufferManagement, 
  updateCinemaBuffer 
} from "@/services/cinemaService";
import type { Cinema } from "@/types/CinemaType/cinemaType";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Building2, Save, X, Edit2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export function BufferSettings() {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCinemas();
  }, []);

  const fetchCinemas = async () => {
    try {
      setLoading(true);
      const data = await getCinemasForBufferManagement();
      console.log('Fetched cinemas with buffer:', data);
      setCinemas(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load cinemas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cinema: Cinema) => {
    setEditingId(cinema.id);
    setEditBuffer(cinema.buffer ?? null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditBuffer(null);
  };

  const handleSave = async (cinemaId: string) => {
    try {
      setSaving(true);
      await updateCinemaBuffer(cinemaId, editBuffer);
      
      // Update local state
      setCinemas(cinemas.map(c => 
        c.id === cinemaId ? { ...c, buffer: editBuffer } : c
      ));

      toast({
        title: "Success",
        description: "Buffer updated successfully",
      });

      setEditingId(null);
      setEditBuffer(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update buffer",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Buffer Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage buffer time between screenings for each cinema
          </p>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Cinema
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Buffer (minutes)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {cinemas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No cinemas available
                  </td>
                </tr>
              ) : (
                cinemas.map((cinema) => {
                  const isEditing = editingId === cinema.id;

                  return (
                    <tr key={cinema.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {cinema.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {cinema.city}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center gap-2 max-w-xs">
                            <Input
                              type="number"
                              min="0"
                              value={editBuffer ?? ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setEditBuffer(value === "" ? null : parseInt(value));
                              }}
                              placeholder="Enter minutes"
                              className="w-32"
                              disabled={saving}
                            />
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-foreground">
                            {cinema.buffer !== null && cinema.buffer !== undefined
                              ? `${cinema.buffer} minutes`
                              : <span className="text-muted-foreground">N/A</span>
                            }
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSave(cinema.id)}
                              disabled={saving}
                              className="gap-1.5"
                            >
                              <Save className="h-3.5 w-3.5" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                              disabled={saving}
                              className="gap-1.5"
                            >
                              <X className="h-3.5 w-3.5" />
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(cinema)}
                            className="gap-1.5"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {cinemas.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {cinemas.length} cinema{cinemas.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
