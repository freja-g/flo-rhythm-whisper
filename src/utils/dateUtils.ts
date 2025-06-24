
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export const addDays = (date: Date | string, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const getDaysBetween = (date1: Date | string, date2: Date | string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const timeDiff = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

export const getPredictedPeriodDate = (lastPeriodDate: string, cycleLength: number): Date => {
  return addDays(lastPeriodDate, cycleLength);
};

export const getDaysUntilPeriod = (lastPeriodDate: string, cycleLength: number): number => {
  const predictedDate = getPredictedPeriodDate(lastPeriodDate, cycleLength);
  const today = new Date();
  const daysUntil = getDaysBetween(today, predictedDate);
  
  // If predicted date has passed, calculate for next cycle
  if (predictedDate < today) {
    const nextPredictedDate = addDays(predictedDate, cycleLength);
    return getDaysBetween(today, nextPredictedDate);
  }
  
  return daysUntil;
};
