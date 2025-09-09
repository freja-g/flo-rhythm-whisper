import { addDays, differenceInDays, format, parseISO, isAfter, isBefore } from 'date-fns';

export interface PredictionData {
  nextPeriodDate: Date;
  confidence: number;
  averageCycleLength: number;
  cycleVariability: number;
  predictedPeriodLength: number;
  fertileWindow: {
    start: Date;
    end: Date;
  };
  ovulationDate: Date;
}

export interface CycleData {
  start_date: string;
  end_date?: string;
  cycle_length: number;
  period_length: number;
}

export interface UserProfile {
  last_period_date?: string;
  cycle_length?: number;
  period_length?: number;
}

/**
 * Calculate period prediction using historical cycle data and user profile
 */
export function calculatePeriodPrediction(
  cycles: CycleData[],
  profile: UserProfile
): PredictionData | null {
  try {
    // If no cycles or profile data, return null
    if (!profile.last_period_date) {
      return null;
    }

    const lastPeriodDate = parseISO(profile.last_period_date);
    
    // Use historical data if available, otherwise fallback to profile defaults
    let averageCycleLength = profile.cycle_length || 28;
    let averagePeriodLength = profile.period_length || 5;
    let cycleVariability = 0;
    let confidence = 50; // Base confidence

    if (cycles.length > 0) {
      // Calculate average cycle length from historical data
      const cycleLengths = cycles.map(cycle => cycle.cycle_length);
      averageCycleLength = Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length);
      
      // Calculate average period length
      const periodLengths = cycles.map(cycle => cycle.period_length);
      averagePeriodLength = Math.round(periodLengths.reduce((sum, length) => sum + length, 0) / periodLengths.length);
      
      // Calculate cycle variability (standard deviation)
      const meanCycleLength = averageCycleLength;
      const variance = cycleLengths.reduce((sum, length) => sum + Math.pow(length - meanCycleLength, 2), 0) / cycleLengths.length;
      cycleVariability = Math.sqrt(variance);
      
      // Adjust confidence based on data quality
      confidence = calculateConfidence(cycles, cycleVariability);
    }

    // Calculate next period date
    const nextPeriodDate = addDays(lastPeriodDate, averageCycleLength);
    
    // Calculate ovulation date (typically 14 days before next period)
    const ovulationDate = addDays(nextPeriodDate, -14);
    
    // Calculate fertile window (5 days before to 1 day after ovulation)
    const fertileWindow = {
      start: addDays(ovulationDate, -5),
      end: addDays(ovulationDate, 1)
    };

    return {
      nextPeriodDate,
      confidence,
      averageCycleLength,
      cycleVariability,
      predictedPeriodLength: averagePeriodLength,
      fertileWindow,
      ovulationDate
    };
  } catch (error) {
    console.error('Error calculating period prediction:', error);
    return null;
  }
}

/**
 * Calculate confidence score based on cycle data consistency
 */
function calculateConfidence(cycles: CycleData[], variability: number): number {
  if (cycles.length === 0) return 30;
  
  let confidence = 50; // Base confidence
  
  // More data = higher confidence
  if (cycles.length >= 3) confidence += 20;
  if (cycles.length >= 6) confidence += 15;
  if (cycles.length >= 12) confidence += 10;
  
  // Lower variability = higher confidence
  if (variability <= 2) confidence += 15;
  else if (variability <= 4) confidence += 10;
  else if (variability <= 6) confidence += 5;
  else confidence -= 10;
  
  // Recent data is more reliable
  const recentCycles = cycles.filter(cycle => {
    const cycleDate = parseISO(cycle.start_date);
    const sixMonthsAgo = addDays(new Date(), -180);
    return isAfter(cycleDate, sixMonthsAgo);
  });
  
  if (recentCycles.length >= 3) confidence += 10;
  
  return Math.min(Math.max(confidence, 10), 95); // Cap between 10-95%
}

/**
 * Get prediction text based on confidence level
 */
export function getPredictionText(confidence: number): string {
  if (confidence >= 80) return "High confidence";
  if (confidence >= 60) return "Good confidence";
  if (confidence >= 40) return "Moderate confidence";
  return "Low confidence - need more data";
}

/**
 * Get days until next period
 */
export function getDaysUntilNextPeriod(nextPeriodDate: Date): number {
  return differenceInDays(nextPeriodDate, new Date());
}

/**
 * Check if currently in fertile window
 */
export function isInFertileWindow(fertileWindow: { start: Date; end: Date }): boolean {
  const today = new Date();
  return isAfter(today, fertileWindow.start) && isBefore(today, fertileWindow.end);
}

/**
 * Format prediction for display
 */
export function formatPredictionSummary(prediction: PredictionData): string {
  const daysUntil = getDaysUntilNextPeriod(prediction.nextPeriodDate);
  const dateStr = format(prediction.nextPeriodDate, 'MMM dd');
  
  if (daysUntil < 0) {
    return `Period was expected ${Math.abs(daysUntil)} days ago`;
  } else if (daysUntil === 0) {
    return "Period expected today";
  } else if (daysUntil === 1) {
    return "Period expected tomorrow";
  } else {
    return `Period expected in ${daysUntil} days (${dateStr})`;
  }
}