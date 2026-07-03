import { Shield } from "lucide-react";

export function EmptyRolesState() {
  return (
    <div className="text-center py-12">
      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">No roles in the system yet.</p>
      <p className="text-sm text-muted-foreground mt-2">
        Please create roles before assigning permissions
      </p>
    </div>
  );
}
