import { useEffect, useRef } from "react";
import { useTabVisibility } from "./useTabVisibility";

interface UseAutoRefreshOptions {
  /**
   * Callback function to execute on each refresh
   */
  onRefresh: () => void | Promise<void>;
  
  /**
   * Interval in milliseconds (default: 60000 - 1 minute)
   */
  interval?: number;
  
  /**
   * Whether to enable auto-refresh (default: true)
   */
  enabled?: boolean;
  
  /**
   * Whether to sync refresh to exact minute marks (e.g., 15:00:00, 15:01:00)
   * (default: true)
   */
  syncToMinute?: boolean;
}

/**
 * Custom hook for auto-refreshing data at regular intervals
 * - Only refreshes when tab is visible
 * - Can sync to exact minute marks for consistent timing
 * - Automatically cleans up on unmount
 */
export const useAutoRefresh = ({
  onRefresh,
  interval = 60000, // 1 minute default
  enabled = true,
  syncToMinute = true,
}: UseAutoRefreshOptions) => {
  const isTabVisible = useTabVisibility();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timers
    const clearTimers = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (initialTimeoutRef.current) {
        clearTimeout(initialTimeoutRef.current);
        initialTimeoutRef.current = null;
      }
    };

    // Don't start polling if disabled or tab not visible
    if (!enabled || !isTabVisible) {
      clearTimers();
      return;
    }

    const startPolling = () => {
      // Clear existing interval before starting new one
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Start regular interval
      intervalRef.current = setInterval(() => {
        onRefresh();
      }, interval);
    };

    if (syncToMinute) {
      // Calculate milliseconds until next exact minute
      const now = new Date();
      const seconds = now.getSeconds();
      const milliseconds = now.getMilliseconds();
      const msUntilNextMinute = (60 - seconds) * 1000 - milliseconds;
      
      // Add 2 seconds delay after minute mark to ensure backend scheduler has committed
      // Backend scheduler runs at second 0, so we wait until second 2
      const delayAfterMinute = 2000;

      // Wait until next minute mark + 2 seconds, then start regular interval
      initialTimeoutRef.current = setTimeout(() => {
        onRefresh(); // Refresh at minute + 2 seconds
        startPolling(); // Then start regular interval
      }, msUntilNextMinute + delayAfterMinute);
    } else {
      // Start polling immediately without sync
      startPolling();
    }

    // Cleanup on unmount or when dependencies change
    return clearTimers;
  }, [onRefresh, interval, enabled, isTabVisible, syncToMinute]);
};
