/**
 * Formats a date string (ISO or partial) into a readable 12-hour time format.
 * Example: '2024-04-15T14:30' -> '02:30 PM'
 * Example: '14:30' -> '02:30 PM'
 */
export function formatTime12h(dateString: string | undefined | null): string {
  if (!dateString) return "N/A";

  try {
    // If it's just a time string like "14:30"
    if (dateString.includes(':') && !dateString.includes('T') && !dateString.includes('-')) {
      const [hours, minutes] = dateString.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    }

    // Try parsing as a full date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Last resort: check if it's a simple T-split time
      if (dateString.includes('T')) {
        const timePart = dateString.split('T')[1];
        if (timePart) return formatTime12h(timePart);
      }
      return dateString; // Return original if parsing fails
    }

    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * Formats a full date and time string into 12-hour format.
 * Example: '2024-04-15T14:30' -> 'Apr 15, 2024, 02:30 PM'
 */
export function formatDateTime12h(dateString: string | undefined | null): string {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return formatTime12h(dateString);

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return dateString;
  }
}
