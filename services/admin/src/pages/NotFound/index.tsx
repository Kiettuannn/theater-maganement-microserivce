import { FileQuestion } from "lucide-react";
import { ErrorPageActions } from "@/components/ErrorPageActions";

export function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-primary/10 p-6">
            <FileQuestion className="h-16 w-16 text-primary" />
          </div>
        </div>

        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>

        <h2 className="mb-4 text-2xl font-semibold text-foreground">
          Page Not Found
        </h2>

        <p className="mb-8 text-muted-foreground">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>

        <ErrorPageActions />
      </div>
    </div>
  );
}
