import { useEffect, useRef, useState } from "react";

export type CheckStatus =
  | "idle"
  | "checking"
  | "available"
  | "exists"
  | "error";

interface CheckResult {
  available: boolean;
}

export function useAvailabilityCheck(
  value: string | undefined,
  enabled: boolean,
  checkFn: (value: string) => Promise<CheckResult>,
  options?: {
    minLength?: number;
    checkingMessage?: string;
    availableMessage?: string;
    existsMessage?: string;
    errorMessage?: string;
  }
) {
  const [status, setStatus] =
    useState<CheckStatus>("idle");

  const [message, setMessage] =
    useState<string | null>(null);

  const timeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const latestValueRef = useRef("");

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!enabled) {
      setStatus("idle");
      setMessage(null);
      return;
    }

    const trimmed = value?.trim() ?? "";

    const minLength = options?.minLength ?? 3;

    if (trimmed.length < minLength) {
      setStatus("idle");
      setMessage(null);
      return;
    }

    setStatus("checking");
    setMessage(
      options?.checkingMessage ??
        "Checking..."
    );

    timeoutRef.current = setTimeout(() => {
      latestValueRef.current = trimmed;

      checkFn(trimmed)
        .then((result) => {
          if (
            latestValueRef.current !== trimmed
          ) {
            return;
          }

          if (result.available) {
            setStatus("available");
            setMessage(
              options?.availableMessage ??
                "Available"
            );
          } else {
            setStatus("exists");
            setMessage(
              options?.existsMessage ??
                "Already exists"
            );
          }
        })
        .catch(() => {
          setStatus("error");
          setMessage(
            options?.errorMessage ??
              "Check failed"
          );
        });
    }, 400);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, enabled, checkFn]);

  const reset = () => {
    setStatus("idle");
    setMessage(null);
  };

  return {
    status,
    message,
    reset,
  };
}