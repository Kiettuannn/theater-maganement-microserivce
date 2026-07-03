import { ShieldAlert } from "lucide-react";
import { ErrorPageActions } from "@/components/ErrorPageActions";

export function Forbidden() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <ShieldAlert className="h-16 w-16 text-destructive" />
          </div>
        </div>

        <h1 className="mb-4 text-4xl font-bold text-foreground">403</h1>

        <h2 className="mb-4 text-2xl font-semibold text-foreground">
          Access Denied
        </h2>

        <p className="mb-8 text-muted-foreground">
          Sorry, you don't have permission to access this page. Please contact
          your administrator if you believe this is an error.
        </p>

        <ErrorPageActions />
      </div>
    </div>
  );
}
