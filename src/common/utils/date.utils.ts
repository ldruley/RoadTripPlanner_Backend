/**
 * Utility functions for date and time manipulation
 */
export class DateUtils {
  /**
   * Add minutes to a date and return a new date object
   * @param date The original date
   * @param minutes Number of minutes to add (can be negative to subtract)
   * @returns A new Date object with the minutes added
   */
  static addMinutes(date: Date, minutes: number): Date {
    const newDate = new Date(date.getTime());
    newDate.setMinutes(newDate.getMinutes() + minutes);
    return newDate;
  }

  static formatDateToIso(date?: Date | null): string | null {
    if (!date) return null;
    return date.toISOString();
  }

  /**
   * Add hours to a date and return a new date object
   * @param date The original date
   * @param hours Number of hours to add (can be negative to subtract)
   * @returns A new Date object with the hours added
   */
  static addHours(date: Date, hours: number): Date {
    const newDate = new Date(date.getTime());
    newDate.setHours(newDate.getHours() + hours);
    return newDate;
  }

  /**
   * Add days to a date and return a new date object
   * @param date The original date
   * @param days Number of days to add (can be negative to subtract)
   * @returns A new Date object with the days added
   */
  static addDays(date: Date, days: number): Date {
    const newDate = new Date(date.getTime());
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  }

  /**
   * Calculate the difference between two dates in minutes
   * @param startDate The start date
   * @param endDate The end date
   * @returns The difference in minutes
   */
  static getDifferenceInMinutes(startDate: Date, endDate: Date): number {
    return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  }

  /**
   * Format a duration in minutes to a human-readable string
   * @param minutes The duration in minutes
   * @returns A human-readable string (e.g., "2h 30m", "45m", "3d 4h")
   */
  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours < 24) {
      if (remainingMinutes === 0) {
        return `${hours}h`;
      }
      return `${hours}h ${remainingMinutes}m`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (remainingHours === 0 && remainingMinutes === 0) {
      return `${days}d`;
    }

    if (remainingMinutes === 0) {
      return `${days}d ${remainingHours}h`;
    }

    return `${days}d ${remainingHours}h ${remainingMinutes}m`;
  }

  /**
   * Check if two dates are on the same day
   * @param date1 First date
   * @param date2 Second date
   * @returns true if the dates are on the same day
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Create a date object from a date string and a time string
   * @param dateStr Date string in YYYY-MM-DD format
   * @param timeStr Time string in HH:mm format
   * @returns A Date object
   */
  static combineDateAndTime(dateStr: string, timeStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes);
  }
}
