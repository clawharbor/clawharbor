'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Accomplishment {
  id?: string;
  icon: string;
  title: string;
  detail?: string;
  who: string;
  timestamp: number;
  xp?: number;
}

interface AgentStats {
  name: string;
  accomplishments: number;
  xp: number;
  level: number;
}

interface DayStats {
  date: string;
  count: number;
  xp: number;
}

export default function StatsPage() {
  const router = useRouter();
  const [accomplishments, setAccomplishments] = useState<Accomplishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  // Calculated stats
  const [totalAccomplishments, setTotalAccomplishments] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [topAgent, setTopAgent] = useState<AgentStats | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [last7Days, setLast7Days] = useState<DayStats[]>([]);
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [busiestDay, setBusiestDay] = useState<DayStats | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/office/actions?type=accomplishments');
      const data = await response.json();
      
      if (data.accomplishments) {
        const accs = data.accomplishments;
        setAccomplishments(accs);
        
        // Calculate total accomplishments and XP
        setTotalAccomplishments(accs.length);
        const xpTotal = accs.reduce((sum: number, a: Accomplishment) => sum + (a.xp || 0), 0);
        setTotalXP(xpTotal);

        // Calculate per-agent stats
        const agentMap = new Map<string, { accomplishments: number; xp: number }>();
        accs.forEach((a: Accomplishment) => {
          const current = agentMap.get(a.who) || { accomplishments: 0, xp: 0 };
          agentMap.set(a.who, {
            accomplishments: current.accomplishments + 1,
            xp: current.xp + (a.xp || 0),
          });
        });

        const agents: AgentStats[] = Array.from(agentMap.entries()).map(([name, stats]) => ({
          name,
          accomplishments: stats.accomplishments,
          xp: stats.xp,
          level: Math.floor(stats.xp / 100) + 1,
        }));

        agents.sort((a, b) => b.xp - a.xp);
        setAgentStats(agents);
        setTopAgent(agents[0] || null);

        // Calculate last 7 days
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        const days: DayStats[] = [];
        
        for (let i = 6; i >= 0; i--) {
          const dayStart = now - (i * dayMs);
          const dayEnd = dayStart + dayMs;
          const dayAccs = accs.filter((a: Accomplishment) => a.timestamp >= dayStart && a.timestamp < dayEnd);
          
          const date = new Date(dayStart);
          const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
          
          days.push({
            date: dayName,
            count: dayAccs.length,
            xp: dayAccs.reduce((sum: number, a: Accomplishment) => sum + (a.xp || 0), 0),
          });
        }
        
        setLast7Days(days);

        // Find busiest day
        const busiest = days.reduce((max, day) => day.count > max.count ? day : max, days[0]);
        setBusiestDay(busiest);

        // Calculate streak (consecutive days with >0 accomplishments)
        let streak = 0;
        for (let i = 0; i < 30; i++) {
          const dayStart = now - (i * dayMs);
          const dayEnd = dayStart + dayMs;
          const dayCount = accs.filter((a: Accomplishment) => a.timestamp >= dayStart && a.timestamp < dayEnd).length;
          
          if (dayCount > 0) {
            streak++;
          } else {
            break;
          }
        }
        setCurrentStreak(streak);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const shareStats = () => {
    setSharing(true);
    const text = `My clawharbor stats:\n\n` +
      `📊 ${totalAccomplishments} accomplishments\n` +
      `⚡ ${totalXP.toLocaleString()} XP earned\n` +
      `🏆 Top agent: ${topAgent?.name || 'N/A'}\n` +
      `🔥 ${currentStreak}-day streak\n\n` +
      `clawharbor.work`;
    
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('Stats copied to clipboard!');
    }
    setSharing(false);
  };

  const maxCount = Math.max(...last7Days.map(d => d.count), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading stats...</p>
        </div>
      </div>
    );
  }

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
          
          <button
            onClick={shareStats}
            disabled={sharing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <span className="text-lg">📤</span>
            Share Stats
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Stats */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-center gap-3">
            <span className="text-5xl">🏆</span>
            Your Office Stats
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track your agents&apos; progress and celebrate wins
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Accomplishments */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-2xl">
                🎯
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalAccomplishments}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Accomplishments</div>
              </div>
            </div>
          </div>

          {/* Total XP */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-yellow-200 dark:border-yellow-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center text-2xl">
                ⚡
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalXP.toLocaleString()}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Total XP</div>
              </div>
            </div>
          </div>

          {/* Current Streak */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-orange-200 dark:border-orange-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-2xl">
                📅
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{currentStreak}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Day Streak {currentStreak > 0 && '🔥'}
                </div>
              </div>
            </div>
          </div>

          {/* Top Agent */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-green-200 dark:border-green-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center text-2xl">
                👑
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900 dark:text-white truncate">{topAgent?.name || 'N/A'}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Top Agent</div>
              </div>
            </div>
          </div>
        </div>

        {/* Last 7 Days Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Last 7 Days Activity</h2>
          
          <div className="flex items-end justify-between gap-2 h-48 px-4">
            {last7Days.map((day, i) => {
              const heightPercent = (day.count / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {day.count > 0 ? day.count : ''}
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-t-lg relative overflow-hidden" style={{ height: '100%' }}>
                    <div
                      className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all duration-500"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-500">{day.date}</div>
                </div>
              );
            })}
          </div>

          {busiestDay && (
            <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
              Busiest day: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{busiestDay.date}</span> ({busiestDay.count} accomplishments)
            </div>
          )}
        </div>

        {/* Agent Leaderboard */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-lg">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Agent Leaderboard</h2>
          
          {agentStats.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No agent activity yet. Start completing tasks!
            </div>
          ) : (
            <div className="space-y-3">
              {agentStats.map((agent, index) => {
                const medals = ['🥇', '🥈', '🥉'];
                const medal = medals[index] || '';
                
                return (
                  <div
                    key={agent.name}
                    className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="text-2xl w-8 text-center">{medal}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 dark:text-white">{agent.name}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Level {agent.level} · {agent.accomplishments} tasks
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{agent.xp.toLocaleString()}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">XP</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Achievements Section (Placeholder) */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-lg">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">🏆 Achievements</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* First 10 Tasks */}
            <div className={`p-4 rounded-lg border-2 ${totalAccomplishments >= 10 ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 opacity-50'}`}>
              <div className="text-2xl mb-2">{totalAccomplishments >= 10 ? '✅' : '⬜'}</div>
              <div className="font-semibold text-slate-900 dark:text-white">First 10 Tasks</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Complete 10 accomplishments</div>
            </div>

            {/* 5-Day Streak */}
            <div className={`p-4 rounded-lg border-2 ${currentStreak >= 5 ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 opacity-50'}`}>
              <div className="text-2xl mb-2">{currentStreak >= 5 ? '✅' : '⬜'}</div>
              <div className="font-semibold text-slate-900 dark:text-white">5-Day Streak 🔥</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Stay active for 5 consecutive days</div>
            </div>

            {/* 1000 XP */}
            <div className={`p-4 rounded-lg border-2 ${totalXP >= 1000 ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 opacity-50'}`}>
              <div className="text-2xl mb-2">{totalXP >= 1000 ? '✅' : '⬜'}</div>
              <div className="font-semibold text-slate-900 dark:text-white">XP Master</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Earn 1,000 total XP</div>
            </div>

            {/* 50 Tasks */}
            <div className={`p-4 rounded-lg border-2 ${totalAccomplishments >= 50 ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 opacity-50'}`}>
              <div className="text-2xl mb-2">{totalAccomplishments >= 50 ? '✅' : '⬜'}</div>
              <div className="font-semibold text-slate-900 dark:text-white">Half Century</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Complete 50 accomplishments</div>
            </div>

            {/* 10-Day Streak */}
            <div className={`p-4 rounded-lg border-2 ${currentStreak >= 10 ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 opacity-50'}`}>
              <div className="text-2xl mb-2">{currentStreak >= 10 ? '✅' : '⬜'}</div>
              <div className="font-semibold text-slate-900 dark:text-white">10-Day Streak 🔥🔥</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Stay active for 10 consecutive days</div>
            </div>

            {/* Team Effort */}
            <div className={`p-4 rounded-lg border-2 ${agentStats.length >= 3 && agentStats.every(a => a.accomplishments >= 5) ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 opacity-50'}`}>
              <div className="text-2xl mb-2">{agentStats.length >= 3 && agentStats.every(a => a.accomplishments >= 5) ? '✅' : '⬜'}</div>
              <div className="font-semibold text-slate-900 dark:text-white">Team Effort</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">3+ agents with 5+ tasks each</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
