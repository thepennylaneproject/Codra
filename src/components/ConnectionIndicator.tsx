/**
 * CONNECTION INDICATOR
 * src/components/ConnectionIndicator.tsx
 *
 * Global indicator showing online/offline/retrying status.
 * Displayed in the app header/chrome.
 */

import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

/**
 * Compact connection status indicator with colored dot and label
 */
export function ConnectionIndicator() {
  const { connectionState, pendingRequests } = useConnectionStatus();

  // Don't render in online state (unless there are pending requests)
  if (connectionState === 'online' && pendingRequests === 0) {
    return null;
  }

  const config = {
    online: {
      dotColor: 'bg-green-500',
      textColor: 'text-green-600 dark:text-green-400',
      label: 'Online',
      Icon: Wifi,
      animate: false,
    },
    offline: {
      dotColor: 'bg-red-500',
      textColor: 'text-red-600 dark:text-red-400',
      label: 'Offline',
      Icon: WifiOff,
      animate: false,
    },
    retrying: {
      dotColor: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      label: 'Retrying...',
      Icon: RefreshCw,
      animate: true,
    },
  };

  const current = config[connectionState];
  const { dotColor, textColor, label, Icon, animate } = current;

  return (
    <div 
      className={`flex items-center gap-2 px-2 py-1 rounded-full bg-black/5 dark:bg-white/5 ${textColor}`}
      role="status"
      aria-live="polite"
    >
      <div className={`w-2 h-2 rounded-full ${dotColor} ${animate ? 'animate-pulse' : ''}`} />
      <Icon 
        size={14} 
        className={animate ? 'animate-spin' : ''} 
      />
      <span className="text-xs font-medium">
        {label}
        {pendingRequests > 0 && ` (${pendingRequests})`}
      </span>
    </div>
  );
}

/**
 * Minimal version showing just the dot (for space-constrained areas)
 */
export function ConnectionDot() {
  const { connectionState } = useConnectionStatus();

  const dotColor = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    retrying: 'bg-amber-500 animate-pulse',
  }[connectionState];

  return (
    <div 
      className={`w-2 h-2 rounded-full ${dotColor}`}
      role="status"
      aria-label={`Connection status: ${connectionState}`}
    />
  );
}
