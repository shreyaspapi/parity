/**
 * Utility functions for formatting data
 */

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format disk size intelligently - handles both KB and byte inputs from the API
 * The Unraid API documentation says size is in KB, but some versions return bytes
 * This function auto-detects based on the magnitude of the value
 *
 * Heuristic:
 * - If value > 10^12 (1 trillion), assume it's already in bytes (typical for TB disks in bytes)
 * - Otherwise, assume it's in KB and multiply by 1024
 *
 * For reference:
 * - 1 TB in bytes = ~1,000,000,000,000 (10^12)
 * - 1 TB in KB = ~1,000,000,000 (10^9)
 */
export function formatDiskSize(sizeValue: number | string | null | undefined, decimals: number = 2): string {
  if (sizeValue === null || sizeValue === undefined) return '0 Bytes';

  const size = typeof sizeValue === 'string' ? Number(sizeValue) : sizeValue;

  if (isNaN(size) || size === 0) return '0 Bytes';

  // Threshold: values above 10^12 are likely already in bytes
  // (A 1TB disk would be 1,000,000,000,000 bytes or 1,000,000,000 KB)
  const BYTE_THRESHOLD = 1e12;

  // If value is very large, it's probably already in bytes
  // If smaller, it's probably in KB (as documented) and needs conversion
  const bytes = size >= BYTE_THRESHOLD ? size : size * 1024;

  return formatBytes(bytes, decimals);
}

/**
 * Format capacity from the array capacity object
 * The kilobytes capacity uses KB as the unit
 */
export function formatCapacityKB(kbValue: number | string | null | undefined, decimals: number = 2): string {
  if (kbValue === null || kbValue === undefined) return '0 Bytes';

  const kb = typeof kbValue === 'string' ? Number(kbValue) : kbValue;

  if (isNaN(kb) || kb === 0) return '0 Bytes';

  // capacity.kilobytes is always in KB
  return formatBytes(kb * 1024, decimals);
}

/**
 * Format uptime in seconds to human-readable format
 * Can handle both seconds (number) and ISO date strings
 */
export function formatUptime(input: number | string): string {
  let seconds: number;
  
  // If input is a string (ISO date), calculate seconds from now
  if (typeof input === 'string') {
    const bootTime = new Date(input).getTime();
    const now = Date.now();
    seconds = Math.floor((now - bootTime) / 1000);
  } else {
    seconds = input;
  }

  // Handle invalid values
  if (isNaN(seconds) || seconds < 0) {
    return '0m';
  }

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.length > 0 ? parts.join(' ') : '0m';
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate percentage from used and total
 */
export function calculatePercentage(used: number, total: number): number {
  if (total === 0) return 0;
  return (used / total) * 100;
}

