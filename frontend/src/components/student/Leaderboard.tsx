import React, { useEffect, useState } from 'react';
import { fetchLeaderboard } from '../../lib/api';
import { Trophy, Medal, TrendingUp, User as UserIcon, RefreshCw, Award, CheckCircle2 } from 'lucide-react';
import { LeaderboardEntry } from '../../types';

interface LeaderboardProps {
  currentUserId?: string;
  compact?: boolean; // for dashboard widget mode
}

export default function Leaderboard({ currentUserId, compact = false }: LeaderboardProps) {
  const [data, setData] = useState<{ leaderboard: LeaderboardEntry[]; myRank: LeaderboardEntry | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchLeaderboard();
      setData(res);
    } catch (e: any) {
      setError(e.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 font-mono font-black text-xs flex items-center justify-center shadow-xs">
          🥇 1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-8 h-8 rounded-xl bg-slate-200 text-slate-800 border border-slate-300 font-mono font-black text-xs flex items-center justify-center shadow-xs">
          🥈 2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 border border-amber-400 font-mono font-black text-xs flex items-center justify-center shadow-xs">
          🥉 3
        </span>
      );
    }
    return (
      <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 font-mono font-black text-xs flex items-center justify-center">
        #{rank}
      </span>
    );
  };

  const entries = compact ? (data?.leaderboard || []).slice(0, 5) : (data?.leaderboard || []);

  if (loading) return (
    <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
      <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
      <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Loading Live Student Leaderboard...</p>
    </div>
  );

  if (error) return (
    <div className="p-6 text-center bg-white rounded-2xl border border-rose-200 text-rose-800 space-y-3">
      <p className="text-xs font-bold">{error}</p>
      <button 
        onClick={load}
        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
      >
        Retry Loading
      </button>
    </div>
  );

  return (
    <div id="leaderboard_container" className="space-y-5 font-sans">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
            <Trophy className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {compact ? 'Top Performers' : 'Overall Academic Leaderboard'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">Real-time student rankings based on total test scores.</p>
          </div>
        </div>

        {!compact && (
          <button 
            onClick={load}
            className="px-3.5 py-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        )}
      </div>

      {/* My Rank Summary Highlight Banner (when not compact) */}
      {!compact && data?.myRank && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/10 via-teal-950/10 to-slate-900/10 border-2 border-emerald-500/60 backdrop-blur-md shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> YOUR RANK
            </span>
            <span className="text-2xl font-black text-emerald-700 font-mono">#{data.myRank.rank}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-wider block">TOTAL SCORE</span>
            <span className="text-xl font-black text-slate-900 font-mono">{data.myRank.totalScore} pts</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-wider block">AVG ACCURACY</span>
            <span className="text-xl font-black text-slate-900 font-mono">{Math.round(data.myRank.percentage)}%</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-wider block">TESTS TAKEN</span>
            <span className="text-xl font-black text-slate-900 font-mono">{data.myRank.attemptCount} Tests</span>
          </div>
        </div>
      )}

      {/* Leaderboard Entries List */}
      {entries.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
          <Trophy className="w-10 h-10 text-slate-400 mx-auto opacity-60" />
          <p className="text-xs font-black text-slate-700">No test attempts recorded yet.</p>
          <p className="text-xs text-slate-500 font-medium">Attempt mock tests to secure your spot on the leaderboard!</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {entries.map((entry) => {
            const isMe = entry.studentId === currentUserId;

            return (
              <div
                key={entry.studentId}
                id={`leaderboard-rank-${entry.rank}`}
                className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 shadow-xs ${
                  isMe 
                    ? 'bg-emerald-50/90 border-2 border-emerald-500 shadow-md' 
                    : 'bg-white border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Rank Badge + Avatar + Student Name */}
                <div className="flex items-center gap-3.5">
                  {getRankBadge(entry.rank)}

                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full font-black text-sm flex items-center justify-center shrink-0 border ${
                      isMe 
                        ? 'bg-emerald-600 text-white border-emerald-400' 
                        : 'bg-slate-900 text-white border-slate-800'
                    }`}>
                      {entry.name?.charAt(0)?.toUpperCase() || <UserIcon className="w-4 h-4" />}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                          {entry.name || 'Anonymous Student'}
                        </span>
                        {isMe && (
                          <span className="px-2 py-0.5 bg-emerald-600 text-white font-mono text-[9px] font-black uppercase rounded-md shadow-xs">
                            YOU
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-500">
                        Accuracy: <span className="font-mono text-slate-900">{Math.round(entry.percentage)}%</span> • {entry.attemptCount} Tests
                      </p>
                    </div>
                  </div>
                </div>

                {/* Score Pill */}
                <div className="text-right shrink-0">
                  <span className="text-base sm:text-lg font-black text-emerald-700 font-mono block leading-tight">
                    {entry.totalScore} pts
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Secured Score
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {compact && data && data.leaderboard.length > 5 && (
        <div className="pt-1 text-center">
          <span className="text-xs font-bold text-slate-500">
            +{data.leaderboard.length - 5} more students on the leaderboard
          </span>
        </div>
      )}
    </div>
  );
}
