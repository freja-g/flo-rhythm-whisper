import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, getDaysBetween } from '../utils/dateUtils';
import { Cycle } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const DoctorAdviceRenderer: React.FC<{ advice: string[] }> = ({ advice }) => (
  <div className="space-y-2">
    {advice.length ? (
      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800">
        {advice.map((a, i) => (
          <li key={i}>{a}. Consider consulting a healthcare professional.</li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-gray-600">No urgent recommendations based on your data.</p>
    )}
  </div>
);

const HealthReportsScreen: React.FC = () => {
  const { cycles, symptoms, setCurrentScreen } = useApp();
  const { user } = useAuth();
  const [trendData, setTrendData] = useState<{ name: string; cycles: number; periods: number; }[]>([]);
  const [averageStats, setAverageStats] = useState({
    avgCycleLength: 0,
    avgPeriodLength: 0,
    cycleVariability: 0
  });

  const sortedCycles = cycles
    .filter(cycle => cycle.userId === user?.id)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const calculateTrends = useCallback(() => {
    const trends = sortedCycles.map((cycle, index) => {
      const cycleNumber = index + 1;
      let actualCycleLength = cycle.length;

      // Calculate actual cycle length between consecutive cycles
      if (index < sortedCycles.length - 1) {
        const nextCycle = sortedCycles[index + 1];
        actualCycleLength = getDaysBetween(cycle.startDate, nextCycle.startDate);
      }

      return {
        cycleNumber,
        cycleLength: actualCycleLength,
        periodLength: cycle.periodLength || 5, // Using stored period length
        date: formatDate(cycle.startDate),
        month: new Date(cycle.startDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      };
    });

    setTrendData(trends);
  }, [sortedCycles]);

  const calculateStats = useCallback(() => {
    if (sortedCycles.length < 2) return;

    // Calculate cycle lengths between consecutive cycles
    const cycleLengths: number[] = [];
    for (let i = 0; i < sortedCycles.length - 1; i++) {
      const length = getDaysBetween(sortedCycles[i].startDate, sortedCycles[i + 1].startDate);
      cycleLengths.push(length);
    }

    const avgCycleLength = cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length;
    const avgPeriodLength = sortedCycles.reduce((sum, cycle) => sum + (cycle.periodLength || 0), 0) / sortedCycles.length;

    // Calculate variability (standard deviation)
    const variance = cycleLengths.reduce((sum, length) => sum + Math.pow(length - avgCycleLength, 2), 0) / cycleLengths.length;
    const cycleVariability = Math.sqrt(variance);

    setAverageStats({
      avgCycleLength: Math.round(avgCycleLength * 10) / 10,
      avgPeriodLength: Math.round(avgPeriodLength * 10) / 10,
      cycleVariability: Math.round(cycleVariability * 10) / 10
    });
  }, [sortedCycles]);

  useEffect(() => {
    if (sortedCycles.length >= 5) {
      calculateTrends();
      calculateStats();
    }
  }, [calculateTrends, calculateStats, sortedCycles.length]);

  // SEO: title and meta description
  useEffect(() => {
    document.title = 'Health Reports: Expert Analysis';
    const desc = 'Expert menstrual health insights, trends, and specialist contact.';
    const metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (metaDesc) {
      metaDesc.setAttribute('content', desc);
    } else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = desc;
      document.head.appendChild(m);
    }
  }, []);

  const getHealthInsights = () => {
    if (sortedCycles.length < 5) return [];

    const insights = [];

    // Cycle regularity insight
    if (averageStats.cycleVariability <= 2) {
      insights.push({
        type: 'positive',
        title: 'Regular Cycles',
        description: 'Your cycles are very regular! This indicates good hormonal health.'
      });
    } else if (averageStats.cycleVariability <= 5) {
      insights.push({
        type: 'neutral',
        title: 'Moderately Regular',
        description: 'Your cycles show some variation, which is normal for most women.'
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Irregular Cycles',
        description: 'Consider tracking lifestyle factors that might affect your cycle regularity.'
      });
    }

    // Cycle length insight
    if (averageStats.avgCycleLength >= 21 && averageStats.avgCycleLength <= 35) {
      insights.push({
        type: 'positive',
        title: 'Normal Cycle Length',
        description: `Your average cycle length of ${averageStats.avgCycleLength} days is within the healthy range.`
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Cycle Length Notice',
        description: 'Your cycle length is outside the typical 21-35 day range. Consider consulting a healthcare provider.'
      });
    }

    return insights;
  };

  const chartConfig = {
    cycleLength: {
      label: "Cycle Length",
      color: "#8b5cf6", // Modern purple
    },
    periodLength: {
      label: "Period Length",
      color: "#ec4899", // Modern pink
    },
  };

  if (sortedCycles.length < 5) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentScreen('dashboard')}
              className="text-white text-xl"
            >
              ←
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Health Reports</h1>
              <p className="text-white/90">Track your cycle trends</p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Not Enough Data</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              You need at least 5 recorded cycles to view health trends and insights.
            </p>
            <p className="text-sm sm:text-base text-gray-500 mb-6">
              Current cycles: {sortedCycles.length}/5
            </p>
            <button
              onClick={() => setCurrentScreen('cycles')}
              className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
            >
              Add More Cycles
            </button>
          </div>
        </div>
      </div>
    );
  }

  const insights = getHealthInsights();

  // Advanced statistics for expert analysis
  const consecutiveCycleLengths: number[] = [];
  for (let i = 0; i < sortedCycles.length - 1; i++) {
    consecutiveCycleLengths.push(
      getDaysBetween(sortedCycles[i].startDate, sortedCycles[i + 1].startDate)
    );
  }

  const sortedLengths = [...consecutiveCycleLengths].sort((a, b) => a - b);
  const shortestCycle = sortedLengths.length ? sortedLengths[0] : 0;
  const longestCycle = sortedLengths.length ? sortedLengths[sortedLengths.length - 1] : 0;
  const medianCycleLength = sortedLengths.length
    ? (sortedLengths.length % 2 === 1
        ? sortedLengths[(sortedLengths.length - 1) / 2]
        : (sortedLengths[sortedLengths.length / 2 - 1] + sortedLengths[sortedLengths.length / 2]) / 2)
    : 0;

  const absDeviations = consecutiveCycleLengths.map((l) => Math.abs(l - medianCycleLength));
  const sortedAbsDev = absDeviations.sort((a, b) => a - b);
  const mad = sortedAbsDev.length
    ? (sortedAbsDev.length % 2 === 1
        ? sortedAbsDev[(sortedAbsDev.length - 1) / 2]
        : (sortedAbsDev[sortedAbsDev.length / 2 - 1] + sortedAbsDev[sortedAbsDev.length / 2]) / 2)
    : 0;

  const coefVar = averageStats.avgCycleLength
    ? (averageStats.cycleVariability / averageStats.avgCycleLength) * 100
    : 0;

  // Prediction based on last cycle start and average length
  const lastStart = sortedCycles[sortedCycles.length - 1]?.startDate;
  const predictedNextDate = lastStart
    ? new Date(new Date(lastStart).getTime() + averageStats.avgCycleLength * 24 * 60 * 60 * 1000)
    : null;
  const daysUntilNext = predictedNextDate ? getDaysBetween(new Date(), predictedNextDate) : null;

  // Symptom patterns
  const userSymptoms = (symptoms || []).filter((s) => s.userId === user?.id);
  const symptomCounts: Record<string, number> = {};
  userSymptoms.forEach((s) => {
    (s.symptoms || []).forEach((name) => {
      symptomCounts[name] = (symptomCounts[name] || 0) + 1;
    });
  });
  const topSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const moodCounts: Record<string, number> = {};
  userSymptoms.forEach((s) => {
    if (s.mood) moodCounts[s.mood] = (moodCounts[s.mood] || 0) + 1;
  });

  // Anomaly detection
  const anomalies: string[] = [];
  consecutiveCycleLengths.forEach((len, idx) => {
    if (len < 21 || len > 35) anomalies.push(`Cycle ${idx + 1}→${idx + 2}: length ${len} days`);
  });
  const longPeriods = sortedCycles.filter((c) => (c.periodLength || 0) > 7).length;
  if (longPeriods > 0) anomalies.push(`${longPeriods} cycle(s) with period length > 7 days`);
  if (consecutiveCycleLengths.some((len) => len >= 90)) anomalies.push('One or more cycles ≥ 90 days');

  // Doctor advice generation
  const doctorAdvice: string[] = [];
  if (averageStats.cycleVariability > 7) {
    doctorAdvice.push('High cycle variability detected');
  }
  if (averageStats.avgCycleLength < 21 || averageStats.avgCycleLength > 35) {
    doctorAdvice.push('Cycle length outside normal range');
  }
  if (longPeriods > sortedCycles.length * 0.3) {
    doctorAdvice.push('Frequent long periods observed');
  }
  if (consecutiveCycleLengths.some(len => len < 21)) {
    doctorAdvice.push('Short cycles detected');
  }
  if (consecutiveCycleLengths.some(len => len > 45)) {
    doctorAdvice.push('Very long cycles detected');
  }

  const report = [
    'Health Report Summary',
    `Average cycle length: ${averageStats.avgCycleLength} days`,
    `Average period length: ${averageStats.avgPeriodLength} days`,
    `Variability (SD): ${averageStats.cycleVariability} days (CV ${coefVar.toFixed(1)}%)`,
    `Median cycle length: ${Math.round(medianCycleLength * 10) / 10} days` ,
    `Shortest/Longest: ${shortestCycle}/${longestCycle} days`,
    predictedNextDate ? `Predicted next start: ${formatDate(predictedNextDate)} (${daysUntilNext} days)` : '',
    anomalies.length ? `Anomalies: ${anomalies.join('; ')}` : 'Anomalies: none',
    topSymptoms.length ? `Top symptoms: ${topSymptoms.map(([n, c]) => `${n} (${c})`).join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Health Reports - Expert Analysis',
    description: 'Expert analysis of menstrual cycle trends and health insights.',
    author: user?.email || 'user',
    datePublished: new Date().toISOString(),
    articleSection: ['Cycle statistics', 'Insights', 'Anomalies', 'Doctor advice'],
    keywords: ['menstrual cycle', 'health report', 'period tracking', 'women health'],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary p-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className="text-white text-xl"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">Health Reports
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/20 text-white/90">
                {/* Regularity badge will be set below */}
              </span>
            </h1>
            <p className="text-white/90">Your cycle trends & insights</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 pb-24">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-lg text-center">
            <div className="text-xl sm:text-2xl font-bold text-primary">{averageStats.avgCycleLength}</div>
            <div className="text-xs sm:text-sm text-gray-600">Avg Cycle</div>
            <div className="text-xs text-gray-500">days</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-lg text-center">
            <div className="text-xl sm:text-2xl font-bold text-secondary-foreground">{averageStats.avgPeriodLength}</div>
            <div className="text-xs sm:text-sm text-gray-600">Avg Period</div>
            <div className="text-xs text-gray-500">days</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-lg text-center">
            <div className="text-xl sm:text-2xl font-bold text-accent-foreground">{averageStats.cycleVariability}</div>
            <div className="text-xs sm:text-sm text-gray-600">Variability</div>
            <div className="text-xs text-gray-500">days</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-lg text-center col-span-2 lg:col-span-1">
            <div className="text-lg sm:text-xl font-bold text-primary">{predictedNextDate ? formatDate(predictedNextDate) : '—'}</div>
            <div className="text-xs sm:text-sm text-gray-600">Next Period</div>
            <div className="text-xs text-gray-500">{typeof daysUntilNext === 'number' ? `${daysUntilNext} days` : ''}</div>
          </div>
        </div>

        {/* Cycle Length Trend Chart */}
        <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg border border-purple-100 mb-6">
          <div className="flex items-center mb-3 sm:mb-4">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full mr-3"></div>
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800">Cycle Length Trends</h3>
          </div>
          <div className="overflow-x-auto">
            <ChartContainer config={chartConfig} className="h-56 sm:h-64 md:h-72 min-w-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 15, left: 5, bottom: 65 }}>
                  <defs>
                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="month"
                    fontSize={8}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 9, fill: '#6b7280' }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  />
                  <YAxis
                    domain={[20, 40]}
                    fontSize={8}
                    width={35}
                    tick={{ fontSize: 9, fill: '#6b7280' }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="cycleLength"
                    stroke="url(#purpleGradient)"
                    strokeWidth={3}
                    dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4, stroke: "#ffffff" }}
                    activeDot={{ r: 6, fill: "#8b5cf6", stroke: "#ffffff", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        {/* Period Length Chart */}
        <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg border border-pink-100 mb-6">
          <div className="flex items-center mb-3 sm:mb-4">
            <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full mr-3"></div>
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800">Period Length Comparison</h3>
          </div>
          <div className="overflow-x-auto">
            <ChartContainer config={chartConfig} className="h-56 sm:h-64 md:h-72 min-w-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 5, right: 15, left: 5, bottom: 65 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    fontSize={8}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 9 }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    fontSize={8}
                    width={35}
                    tick={{ fontSize: 9 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="periodLength"
                    fill="var(--color-periodLength)"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        {/* Health Insights */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Health Insights</h3>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                insight.type === 'positive' ? 'bg-green-50 border-green-400' :
                insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                'bg-blue-50 border-blue-400'
              }`}>
                <h4 className={`font-medium mb-1 ${
                  insight.type === 'positive' ? 'text-green-800' :
                  insight.type === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {insight.title}
                </h4>
                <p className={`text-sm ${
                  insight.type === 'positive' ? 'text-green-700' :
                  insight.type === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>
                  {insight.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Expert Analysis */}
        <section className="bg-white rounded-2xl p-6 shadow-lg mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Expert Analysis</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500">Median Cycle</div>
              <div className="text-xl font-semibold">{Math.round(medianCycleLength * 10) / 10} days</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500">Shortest / Longest</div>
              <div className="text-xl font-semibold">{shortestCycle} / {longestCycle} days</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500">MAD (robust variability)</div>
              <div className="text-xl font-semibold">{Math.round(mad * 10) / 10} days</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500">Coefficient of Variation</div>
              <div className="text-xl font-semibold">{coefVar.toFixed(1)}%</div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500">Predicted next start</div>
              <div className="text-xl font-semibold">
                {predictedNextDate ? `${formatDate(predictedNextDate)}${typeof daysUntilNext === 'number' ? ` (${daysUntilNext} days)` : ''}` : '—'}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500">Anomalies</div>
              <div className="text-sm text-gray-800">
                {anomalies.length ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {anomalies.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-green-700">None detected</span>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-2">Top symptoms</div>
              {topSymptoms.length ? (
                <div className="flex flex-wrap gap-2">
                  {topSymptoms.map(([name, count]) => (
                    <span key={name} className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                      {name} · {count}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-gray-500">No symptom patterns yet</span>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-2">Mood distribution</div>
              {Object.keys(moodCounts).length ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(moodCounts).map(([mood, count]) => (
                    <span key={mood} className="px-2 py-1 rounded-full text-xs bg-secondary/10 text-secondary-foreground">
                      {mood}: {count}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-gray-500">No mood data yet</span>
              )}
            </div>
          </div>
        </section>

        {/* When to See a Doctor */}
        <section className="bg-white rounded-2xl p-6 shadow-lg mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">When to See a Doctor</h3>
          <DoctorAdviceRenderer advice={doctorAdvice} />
        </section>

        {/* Detailed Health Analysis */}
        <section className="bg-white rounded-2xl p-6 shadow-lg mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Health Analysis</h3>

          {/* Cycle Regularity Analysis */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-3">Cycle Regularity Assessment</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Regularity Score</div>
                  <div className="text-lg font-semibold">
                    {averageStats.cycleVariability <= 2 ? '🟢 Excellent' :
                     averageStats.cycleVariability <= 5 ? '🟡 Good' :
                     averageStats.cycleVariability <= 8 ? '🟠 Fair' : '🔴 Irregular'}
                  </div>
                  <div className="text-xs text-gray-500">Variability: ±{averageStats.cycleVariability} days</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Consistency Rating</div>
                  <div className="text-lg font-semibold">
                    {coefVar < 5 ? 'Very Consistent' :
                     coefVar < 10 ? 'Consistent' :
                     coefVar < 15 ? 'Moderately Variable' : 'Highly Variable'}
                  </div>
                  <div className="text-xs text-gray-500">CV: {coefVar.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Period Flow Analysis */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-3">Period Flow Analysis</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {userSymptoms.filter(s => s.menstrualFlow === 'light').length}
                  </div>
                  <div className="text-xs text-gray-600">Light Flow Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {userSymptoms.filter(s => s.menstrualFlow === 'medium').length}
                  </div>
                  <div className="text-xs text-gray-600">Medium Flow Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {userSymptoms.filter(s => s.menstrualFlow === 'heavy').length}
                  </div>
                  <div className="text-xs text-gray-600">Heavy Flow Days</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hormonal Health Indicators */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-3">Hormonal Health Indicators</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Luteal Phase Length</span>
                <span className="font-medium">
                  {averageStats.avgCycleLength - 14 > 10 ?
                    `~${Math.round(averageStats.avgCycleLength - 14)} days 🟢` :
                    `~${Math.round(averageStats.avgCycleLength - 14)} days ⚠️`
                  }
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Ovulation Regularity</span>
                <span className="font-medium">
                  {averageStats.cycleVariability <= 3 ? 'Likely Regular 🟢' :
                   averageStats.cycleVariability <= 7 ? 'Moderately Regular 🟡' : 'Irregular ⚠️'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Cycle Health Score</span>
                <span className="font-medium">
                  {(function() {
                    let score = 100;
                    if (averageStats.avgCycleLength < 21 || averageStats.avgCycleLength > 35) score -= 20;
                    if (averageStats.cycleVariability > 5) score -= 15;
                    if (averageStats.avgPeriodLength > 7) score -= 10;
                    if (anomalies.length > 0) score -= 15;
                    return score;
                  })()}/100 {(function() {
                    const score = (function() {
                      let s = 100;
                      if (averageStats.avgCycleLength < 21 || averageStats.avgCycleLength > 35) s -= 20;
                      if (averageStats.cycleVariability > 5) s -= 15;
                      if (averageStats.avgPeriodLength > 7) s -= 10;
                      if (anomalies.length > 0) s -= 15;
                      return s;
                    })();
                    return score >= 85 ? '🟢' : score >= 70 ? '🟡' : score >= 50 ? '🟠' : '🔴';
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Personalized Recommendations</h4>
            <div className="space-y-2">
              {averageStats.cycleVariability > 7 && (
                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm text-blue-800">📊 Track stress levels and sleep patterns - high variability may be linked to lifestyle factors</p>
                </div>
              )}
              {averageStats.avgPeriodLength > 7 && (
                <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                  <p className="text-sm text-yellow-800">⏰ Consider tracking flow intensity - periods longer than 7 days may need medical evaluation</p>
                </div>
              )}
              {averageStats.avgCycleLength < 21 && (
                <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                  <p className="text-sm text-orange-800">🔄 Short cycles may indicate hormonal imbalances - consider nutrition and exercise tracking</p>
                </div>
              )}
              {averageStats.avgCycleLength > 35 && (
                <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                  <p className="text-sm text-red-800">📅 Long cycles may suggest PCOS or other conditions - medical consultation recommended</p>
                </div>
              )}
              {anomalies.length === 0 && averageStats.cycleVariability <= 3 && (
                <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                  <p className="text-sm text-green-800">✨ Excellent cycle health! Continue current lifestyle and tracking habits</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Contact a Specialist */}
        <section className="bg-white rounded-2xl p-6 shadow-lg mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact a Specialist</h3>
          <p className="text-sm text-gray-600 mb-4">This report is informational and not a diagnosis. If you have concerns or notice persistent anomalies, consider consulting a qualified healthcare professional.</p>
          <div className="flex gap-3">
            <a
              href="https://my1health.com/search/providers/conditions/menstrual-irregularities/kenya"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-lg hover:shadow-md transition-all"
            >
              Contact Specialist
            </a>
          </div>
        </section>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex justify-around">
          <button 
            onClick={() => setCurrentScreen('dashboard')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-xl">🏠</span>
            <span className="text-xs text-gray-400">Home</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('cycles')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-xl">📅</span>
            <span className="text-xs text-gray-400">Cycles</span>
          </button>
          <button className="flex flex-col items-center space-y-1">
            <span className="text-primary text-xl">🩺</span>
            <span className="text-xs text-primary font-medium">Reports</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('symptoms')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-xl">📝</span>
            <span className="text-xs text-gray-400">Symptoms</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('profile')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-xl">👩</span>
            <span className="text-xs text-gray-400">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthReportsScreen;
