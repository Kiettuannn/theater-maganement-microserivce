import {
  useLoadingStore,
  selectIsLoading,
  selectLoadingMessage,
} from "@/stores";

export function LoadingOverlay() {
  const isLoading = useLoadingStore(selectIsLoading);
  const loadingMessage = useLoadingStore(selectLoadingMessage);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-card border border-border shadow-lg">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
        </div>

        {loadingMessage && (
          <p className="text-sm text-muted-foreground">{loadingMessage}</p>
        )}
      </div>
    </div>
  );
}
