import React, { useState, useEffect } from 'react';
import { User, StudentType } from '../../types';
import {
  User as UserIcon, Mail, Phone, Shield, Key, Award, Calendar,
  CheckCircle2, Sparkles, AlertCircle, ArrowRight, Eye, EyeOff, Lock, LogOut, Package, Check
} from 'lucide-react';

import { getApiUrl, fetchPlans } from '../../lib/api';

const API_URL = getApiUrl();

interface StudentProfilePageProps {
  user: User;
  studentTypes: StudentType[];
  allPlans: any[];
  onNavigateToStore: () => void;
  onSignOut?: () => void;
}

export default function StudentProfilePage({
  user,
  studentTypes,
  allPlans = [],
  onNavigateToStore,
  onSignOut
}: StudentProfilePageProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [fetchedPlans, setFetchedPlans] = useState<any[]>([]);

  useEffect(() => {
    fetchPlans({ limit: '1000' })
      .then((res: any) => {
        const list = res.data || res || [];
        setFetchedPlans(list);
      })
      .catch(err => console.error('Failed to fetch store plans:', err));
  }, []);

  // Helper to extract clean real plan details
  const getCleanPlanDetails = (item: any) => {
    // 1. If planId is a populated object
    if (item?.planId && typeof item.planId === 'object') {
      return {
        id: (item.planId._id || item.planId.id || '').toString(),
        name: item.planId.name || item.planId.title || null,
        price: item.planId.price ?? null,
      };
    }

    // 2. If planId is a string ID, match against fetchedPlans or allPlans
    const pId = (item?.planId || '').toString();
    const matched = fetchedPlans.find(p => (p._id || p.id || '').toString() === pId) ||
      allPlans.find(p => (p._id || p.id || '').toString() === pId);

    if (matched) {
      return {
        id: (matched._id || matched.id || '').toString(),
        name: matched.name,
        price: matched.price ?? null,
      };
    }

    // 3. If examId is a populated object
    if (item?.examId && typeof item.examId === 'object' && item.examId?.name) {
      return {
        id: (item.examId._id || item.examId.id || '').toString(),
        name: `${item.examId.name} Course Plan`,
        price: null,
      };
    }

    // 4. Direct name
    if (item?.name && item.name !== 'Academic Course Subscription' && item.name !== 'Academic Course Plan') {
      return {
        id: pId || 'custom',
        name: item.name,
        price: item.price ?? null,
      };
    }

    return null;
  };

  // Filter ONLY valid active purchased plans, deduplicated by plan ID / name
  const rawPurchased = user.purchasedPlans || [];
  const processedPlans = rawPurchased
    .filter((p: any) => p.isActive !== false)
    .map((p: any) => {
      const details = getCleanPlanDetails(p);
      if (!details || !details.name) return null;
      return {
        ...p,
        realName: details.name,
        realPrice: details.price,
        realId: details.id,
      };
    })
    .filter(Boolean);

  // Deduplicate by realId / realName
  const uniquePurchasedPlans = Array.from(
    new Map(processedPlans.map(item => [item.realId || item.realName, item])).values()
  );

  const hasActivePlan = uniquePurchasedPlans.length > 0;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!currentPassword) {
      setMessage({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/student/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update password.');

      setMessage({ type: 'success', text: '✅ Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="student_profile_page" className="space-y-6 font-sans max-w-6xl mx-auto pb-10">

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserIcon className="w-7 h-7 text-emerald-600" />
            My Account & Profile
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1">
            Manage your registered account details, security credentials, and active course plan subscriptions.
          </p>
        </div>

        <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border shadow-xs self-start sm:self-auto ${
          hasActivePlan 
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
            : 'bg-slate-200 text-slate-700 border-slate-300'
        }`}>
          {hasActivePlan ? `✓ ${uniquePurchasedPlans.length} Active Subscription` : 'Free Explorer Mode'}
        </span>
      </div>

      {/* ─── ROW 1: PERSONAL DETAILS & SECURITY SIDE-BY-SIDE ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. Personal Details Card */}
        <div className="p-6 rounded-2xl border border-slate-300/80 bg-slate-900/10 backdrop-blur-md space-y-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 leading-tight">Personal Details</h2>
                <p className="text-xs text-slate-500 font-medium">Account identity and registered contact information.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-xs">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Full Name</span>
                <span className="font-black text-slate-900 text-xs sm:text-sm">{user.name}</span>
              </div>

              <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-xs">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Email Address</span>
                <span className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {user.email}
                </span>
              </div>

              <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-xs">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Mobile / Phone</span>
                <span className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {(user as any).phone || 'Not Provided'}
                </span>
              </div>

              <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-xs">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Registered Since</span>
                <span className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Active Student'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Security & Password Card */}
        <div className="p-6 rounded-2xl border border-slate-300/80 bg-slate-900/10 backdrop-blur-md space-y-5 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-700 flex items-center justify-center shrink-0 shadow-xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">Security & Password</h2>
              <p className="text-xs text-slate-500 font-medium">Update your password to keep your account safe.</p>
            </div>
          </div>

          {message && (
            <div className={`p-3.5 rounded-xl border text-xs font-extrabold flex items-center gap-2.5 ${
              message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">Current Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-emerald-500 text-xs shadow-xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">New Password *</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-emerald-500 text-xs shadow-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">Confirm New Password *</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-emerald-500 text-xs shadow-xs"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-black uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>

      </div>

      {/* ─── ROW 2: REAL MY SUBSCRIPTIONS CARD (BELOW ROW 1) ───────────────── */}
      <div className="p-6 rounded-2xl border border-slate-300/80 bg-slate-900/10 backdrop-blur-md space-y-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">My Purchased Subscriptions</h2>
              <p className="text-xs text-slate-500 font-medium">Real-time overview of your enrolled course packages & subscription status.</p>
            </div>
          </div>

          <span className={`px-3 py-1 text-xs font-black rounded-lg border uppercase tracking-wider ${
            hasActivePlan 
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
              : 'bg-slate-200 text-slate-700 border-slate-300'
          }`}>
            {hasActivePlan ? `${uniquePurchasedPlans.length} Active Plan Enrolled` : 'No Active Subscriptions'}
          </span>
        </div>

        {hasActivePlan ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {uniquePurchasedPlans.map((plan: any, idx: number) => {
              return (
                <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-black text-slate-900 text-sm truncate">{plan.realName}</h4>
                      <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-mono font-black uppercase rounded-md shrink-0">
                        ACTIVE
                      </span>
                    </div>

                    {plan.realPrice !== null && (
                      <p className="text-xs font-mono font-black text-emerald-700">
                        Price: ₹{plan.realPrice?.toLocaleString('en-IN')}
                      </p>
                    )}

                    <p className="text-xs font-bold text-slate-500">
                      Enrolled: {plan.purchasedAt ? new Date(plan.purchasedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Active Member'}
                    </p>
                  </div>

                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 self-start flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Full Course Access Unlocked
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 bg-white border border-slate-200 rounded-xl text-center space-y-2">
            <Package className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
            <p className="text-sm font-black text-slate-800">No active plan subscriptions found.</p>
            <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
              You haven't subscribed to any paid course plans yet. Visit the Plans store to unlock full entrance exam practice tests & chapter material.
            </p>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={onNavigateToStore}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-black uppercase tracking-wider text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" /> Explore & Purchase Course Plans <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
