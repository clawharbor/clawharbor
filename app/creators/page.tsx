'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CreatorsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'pipeline' | 'stats'>('overview');

  const stats = {
    totalOutreach: 85,
    activeDeals: 12,
    monthlyRevenue: 47000,
    avgROI: 1780,
  };

  const topCreators = [
    { name: '@mr_1ines', roi: 3675, revenue: 12678, icon: '🥇' },
    { name: '@texttalespro', roi: 1952, revenue: 7578, icon: '🥈' },
    { name: '@zermeee', roi: 596, revenue: 15635, icon: '🥉' },
  ];

  const pipeline = [
    { stage: 'Qualified', count: 25, color: '#3b82f6' },
    { stage: 'Contacted', count: 16, color: '#8b5cf6' },
    { stage: 'Negotiating', count: 5, color: '#f59e0b' },
    { stage: 'Closed', count: 12, color: '#10b981' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <span className="text-lg">←</span>
            <span className="font-medium">Back to Office</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <div>
              <div className="font-bold text-slate-900 dark:text-white">Scout Agent</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Creator Outreach</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
            AI-Powered Creator Outreach
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Watch Scout agent manage influencer partnerships end-to-end — from research to contracts to $47K+ monthly revenue
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 justify-center">
          {(['overview', 'pipeline', 'stats'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {tab === 'overview' && '📊 Overview'}
              {tab === 'pipeline' && '🔄 Pipeline'}
              {tab === 'stats' && '📈 Stats'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-indigo-200 dark:border-indigo-800">
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalOutreach}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Creators Contacted</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.activeDeals}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Active Deals</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">${(stats.monthlyRevenue / 1000).toFixed(0)}K</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Monthly Revenue</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-orange-200 dark:border-orange-800">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.avgROI}%</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Avg ROI</div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">🏆 Top Performing Creators</h2>
              <div className="space-y-3">
                {topCreators.map((creator, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{creator.icon}</span>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{creator.name}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{creator.roi}% ROI</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600 dark:text-green-400">${creator.revenue.toLocaleString()}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What Scout Does */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">🤖 What Scout Agent Does</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex gap-3">
                  <span className="text-2xl">🔍</span>
                  <div>
                    <div className="font-semibold mb-1">Research & Qualify</div>
                    <div className="text-sm opacity-90">Analyzes 100s of TikTok creators, checks engagement rates, audience quality</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-2xl">✉️</span>
                  <div>
                    <div className="font-semibold mb-1">Personalized Outreach</div>
                    <div className="text-sm opacity-90">Crafts custom emails with ROI calculations, follows up automatically</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <div className="font-semibold mb-1">Deal Negotiation</div>
                    <div className="text-sm opacity-90">Structures performance-based contracts, handles objections</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <div className="font-semibold mb-1">Performance Tracking</div>
                    <div className="text-sm opacity-90">Monitors conversion rates, identifies top performers, recommends scale</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border-2 border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Creator Pipeline</h2>
            <div className="space-y-4">
              {pipeline.map((stage, idx) => (
                <div key={idx} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900 dark:text-white">{stage.stage}</span>
                    <span className="text-2xl font-bold" style={{ color: stage.color }}>{stage.count}</span>
                  </div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        backgroundColor: stage.color,
                        width: `${(stage.count / 25) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <strong className="text-slate-900 dark:text-white">Total Creators:</strong> {pipeline.reduce((sum, s) => sum + s.count, 0)}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                <strong className="text-slate-900 dark:text-white">Conversion Rate:</strong> {((12 / 85) * 100).toFixed(1)}% (Qualified → Closed)
              </div>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">📈 Performance Metrics</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded">
                  <span className="text-slate-600 dark:text-slate-400">Response Rate</span>
                  <span className="font-bold text-slate-900 dark:text-white">18.7%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded">
                  <span className="text-slate-600 dark:text-slate-400">Close Rate</span>
                  <span className="font-bold text-slate-900 dark:text-white">14.1%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded">
                  <span className="text-slate-600 dark:text-slate-400">Avg Deal Value</span>
                  <span className="font-bold text-slate-900 dark:text-white">$3,917/mo</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded">
                  <span className="text-slate-600 dark:text-slate-400">Time to Close</span>
                  <span className="font-bold text-slate-900 dark:text-white">8.4 days</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-2">$47K Monthly Revenue</h3>
              <p className="opacity-90 mb-4">Generated from 12 active creator partnerships</p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-3xl font-bold">1,780%</div>
                  <div className="text-sm opacity-90">Average ROI</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">35K+</div>
                  <div className="text-sm opacity-90">Total Downloads</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 bg-white dark:bg-slate-800 rounded-xl p-8 border-2 border-indigo-200 dark:border-indigo-800 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            Want an AI agent managing YOUR outreach?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
            clawharbor lets you build specialized agents like Scout that handle complex workflows autonomously. Install in 2 minutes.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => router.push('/install')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
            >
              Install clawharbor
            </button>
            <button
              onClick={() => router.push('/docs/YOUR-FIRST-5-MINUTES.md')}
              className="px-6 py-3 bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
              Read the Docs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
