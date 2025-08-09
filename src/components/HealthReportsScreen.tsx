import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, getDaysBetween } from '../utils/dateUtils';
import { Cycle } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const HealthReportsScreen: React.FC = () => {
  const { cycles, symptoms, setCurrentScreen } = useApp();
  const { user } = useAuth();
  const [trendData, setTrendData] = useState<any[]>([]);
  const [averageStats, setAverageStats] = useState({
    avgCycleLength: 0,
    avgPeriodLength: 0,
    cycleVariability: 0
  });

  const sortedCycles = cycles
    .filter(cycle => cycle.userId === user?.id)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  useEffect(() => {
    if (sortedCycles.length >= 5) {
      calculateTrends();
      calculateStats();
    }
  }, [cycles]);

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

  const calculateTrends = () => {
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
        periodLength: cycle.length, // Using the stored period length
        date: formatDate(cycle.startDate),
        month: new Date(cycle.startDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      };
    });

    setTrendData(trends);
  };

  const calculateStats = () => {
    if (sortedCycles.length < 2) return;

    // Calculate cycle lengths between consecutive cycles
    const cycleLengths: number[] = [];
    for (let i = 0; i < sortedCycles.length - 1; i++) {
      const length = getDaysBetween(sortedCycles[i].startDate, sortedCycles[i + 1].startDate);
      cycleLengths.push(length);
    }

    const avgCycleLength = cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length;
    const avgPeriodLength = sortedCycles.reduce((sum, cycle) => sum + cycle.length, 0) / sortedCycles.length;
    
    // Calculate variability (standard deviation)
    const variance = cycleLengths.reduce((sum, length) => sum + Math.pow(length - avgCycleLength, 2), 0) / cycleLengths.length;
    const cycleVariability = Math.sqrt(variance);

    setAverageStats({
      avgCycleLength: Math.round(avgCycleLength * 10) / 10,
      avgPeriodLength: Math.round(avgPeriodLength * 10) / 10,
      cycleVariability: Math.round(cycleVariability * 10) / 10
    });
  };

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
      color: "hsl(var(--primary))",
    },
    periodLength: {
      label: "Period Length", 
      color: "hsl(var(--secondary))",
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

        <div className="p-6">
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Not Enough Data</h3>
            <p className="text-gray-600 mb-4">
              You need at least 5 recorded cycles to view health trends and insights.
            </p>
            <p className="text-gray-500 mb-6">
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
  const longPeriods = sortedCycles.filter((c) => c.length > 7).length;
  if (longPeriods > 0) anomalies.push(`${longPeriods} cycle(s) with period length > 7 days`);
  if (consecutiveCycleLengths.some((len) => len >= 90)) anomalies.push('One or more cycles ≥ 90 days');

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
    articleSection: ['Cycle statistics', 'Insights', 'Anomalies'],
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
            <h1 className="text-2xl font-bold text-white">Health Reports</h1>
            <p className="text-white/90">Your cycle trends & insights</p>
          </div>
        </div>
      </div>

      <div className="p-6 pb-24">
        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-lg text-center">
            <div className="text-2xl font-bold text-primary">{averageStats.avgCycleLength}</div>
            <div className="text-xs text-gray-600">Avg Cycle</div>
            <div className="text-xs text-gray-500">days</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg text-center">
            <div className="text-2xl font-bold text-secondary">{averageStats.avgPeriodLength}</div>
            <div className="text-xs text-gray-600">Avg Period</div>
            <div className="text-xs text-gray-500">days</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg text-center">
            <div className="text-2xl font-bold text-accent">{averageStats.cycleVariability}</div>
            <div className="text-xs text-gray-600">Variability</div>
            <div className="text-xs text-gray-500">days</div>
          </div>
        </div>

        {/* Cycle Length Trend Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Cycle Length Trends</h3>
          <ChartContainer config={chartConfig} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  fontSize={12}
                />
                <YAxis 
                  domain={[20, 40]}
                  fontSize={12}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="cycleLength" 
                  stroke="var(--color-cycleLength)"
                  strokeWidth={3}
                  dot={{ fill: "var(--color-cycleLength)", strokeWidth: 2, r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Period Length Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Period Length Comparison</h3>
          <ChartContainer config={chartConfig} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  fontSize={12}
                />
                <YAxis 
                  domain={[0, 10]}
                  fontSize={12}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="periodLength" 
                  fill="var(--color-periodLength)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Health Insights */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Health Insights</h3>
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
          <div className="grid grid-cols-2 gap-4 mb-4">
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
          <div className="grid grid-cols-2 gap-4 mb-4">
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
          <div className="grid grid-cols-2 gap-4">
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
                    <span key={mood} className="px-2 py-1 rounded-full text-xs bg-secondary/10 text-secondary">
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

        {/* Contact a Specialist */}
        <section className="bg-white rounded-2xl p-6 shadow-lg mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact a Specialist</h3>
          <p className="text-sm text-gray-600 mb-4">This report is informational and not a diagnosis. If you have concerns or notice persistent anomalies, consider consulting a qualified healthcare professional.</p>
          <div className="flex gap-3">
            <a
              href={`mailto:?subject=Cycle health report&body=${encodeURIComponent(report)}`}
              className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-lg hover:shadow-md transition-all"
            >
              Email this report
            </a>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(report);
                  alert('Report copied to clipboard');
                } catch (e) {
                  console.error('Copy failed', e);
                }
              }}
              className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all"
            >
              Copy report
            </button>
          </div>
        </section>

        {/* Structured Data */}
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
            <span className="text-primary text-xl">📊</span>
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