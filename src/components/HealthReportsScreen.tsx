import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, getDaysBetween } from '../utils/dateUtils';
import { Cycle } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const HealthReportsScreen: React.FC = () => {
  const { cycles, setCurrentScreen } = useApp();
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