import React, { useEffect, useState } from 'react';
import { fetchLeaderboard } from '../../lib/api';
import { Trophy, Medal, TrendingUp, User as UserIcon, RefreshCw } from 'lucide-react';
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

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={18} className="text-yellow-400" />;
    if (rank === 2) return <Medal size={18} className="text-gray-300" />;
    if (rank === 3) return <Medal size={18} className="text-amber-600" />;
    return <span className="rank-number">#{rank}</span>;
  };

  const entries = compact ? (data?.leaderboard || []).slice(0, 5) : (data?.leaderboard || []);

  if (loading) return (
    <div className="leaderboard-loading">
      <RefreshCw size={20} className="spin" /> Loading leaderboard...
    </div>
  );

  if (error) return (
    <div className="leaderboard-error">
      <p>{error}</p>
      <button onClick={load}>Retry</button>
    </div>
  );

  return (
    <div className={`leaderboard-container ${compact ? 'leaderboard-compact' : ''}`}>
      {/* Header */}
      <div className="leaderboard-header">
        <div className="leaderboard-title">
          <Trophy size={compact ? 18 : 24} className="text-yellow-400" />
          <h2>{compact ? 'Top Students' : 'Overall Leaderboard'}</h2>
        </div>
        {!compact && (
          <button className="leaderboard-refresh" onClick={load}>
            <RefreshCw size={16} /> Refresh
          </button>
        )}
      </div>

      {/* My Rank Card (when not compact) */}
      {!compact && data?.myRank && (
        <div className="my-rank-card">
          <TrendingUp size={20} className="text-emerald-400" />
          <div>
            <span className="my-rank-label">Your Rank</span>
            <span className="my-rank-value">#{data.myRank.rank}</span>
          </div>
          <div>
            <span className="my-rank-label">Total Score</span>
            <span className="my-rank-value">{data.myRank.totalScore}</span>
          </div>
          <div>
            <span className="my-rank-label">Avg Score</span>
            <span className="my-rank-value">{Math.round(data.myRank.percentage)}%</span>
          </div>
          <div>
            <span className="my-rank-label">Tests Taken</span>
            <span className="my-rank-value">{data.myRank.attemptCount}</span>
          </div>
        </div>
      )}

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="leaderboard-empty">
          <Trophy size={32} className="text-gray-500" />
          <p>No results yet. Be the first to take a test!</p>
        </div>
      ) : (
        <div className="leaderboard-list">
          {entries.map((entry) => {
            const isMe = entry.studentId === currentUserId;
            return (
              <div
                key={entry.studentId}
                id={`leaderboard-rank-${entry.rank}`}
                className={`leaderboard-row ${isMe ? 'my-row' : ''} ${entry.rank <= 3 ? `top-${entry.rank}` : ''}`}
              >
                {/* Rank */}
                <div className="lb-rank">{getRankIcon(entry.rank)}</div>

                {/* Avatar + Name */}
                <div className="lb-student">
                  <div className={`lb-avatar ${isMe ? 'lb-avatar-me' : ''}`}>
                    {entry.name?.charAt(0)?.toUpperCase() || <UserIcon size={14} />}
                  </div>
                  <div className="lb-name-wrap">
                    <span className="lb-name">{entry.name || 'Anonymous'}</span>
                    {isMe && <span className="lb-you-badge">You</span>}
                  </div>
                </div>

                {/* Stats */}
                <div className="lb-stats">
                  <span className="lb-score">{entry.totalScore} pts</span>
                  {!compact && (
                    <>
                      <span className="lb-pct">{Math.round(entry.percentage)}%</span>
                      <span className="lb-attempts">{entry.attemptCount} tests</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {compact && data && data.leaderboard.length > 5 && (
        <div className="lb-see-all">
          <span>+{data.leaderboard.length - 5} more students</span>
        </div>
      )}
    </div>
  );
}
