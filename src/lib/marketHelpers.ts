export function isCutoffPassed(cutoffTime: string): boolean {
  const now = new Date();
  const [hour, minute] = cutoffTime.split(':').map(Number);
  const cutoff = new Date();
  cutoff.setHours(hour, minute, 0, 0);
  return now >= cutoff;
}

export function getNextAvailableDate(cutoffTime: string, deliveryDays: string[]): Date {
  const now = new Date();
  const [hour, minute] = cutoffTime.split(':').map(Number);
  
  let nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + 1);
  
  // If past cutoff today, start from tomorrow
  const cutoff = new Date();
  cutoff.setHours(hour, minute, 0, 0);
  if (now < cutoff) {
    nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + 1);
  } else {
    // Start from day after tomorrow if past cutoff
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  // Find next available delivery day
  while (!deliveryDays.includes(getDayName(nextDate))) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  return nextDate;
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}
