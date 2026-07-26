import React, { useState } from 'react';
import { User, StudentType } from '../../types';
import {
  User as UserIcon, Mail, Phone, Shield, Key, Award, Calendar,
  CheckCircle2, Sparkles, AlertCircle, ArrowRight, Eye, EyeOff, Lock
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface StudentProfilePageProps {
  user: User;
  studentTypes: StudentType[];
  allPlans: any[];
  onNavigateToStore: () => void;
}

export default function StudentProfilePage({
  user,
  studentTypes,
  allPlans,
  onNavigateToStore
}: StudentProfilePageProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Determine student group name
  const groupObj = studentTypes.find(
    st => (st.id || (st as any)._id) === (user as any).studentTypeId || st.name === user.studentType
  );
  const groupName = groupObj ? groupObj.name : (typeof user.studentType === 'object' ? (user.studentType as any)?.name : user.studentType) || 'General Student Group';

  const purchasedPlans = user.purchasedPlans || [];

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
    <div className="space-y-8 font-sans max-w-5xl mx-auto pb-12">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-emerald-700/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 text-emerald-950 font-black text-3xl flex items-center justify-center shadow-lg border-2 border-white/20 uppercase shrink-0">
              {user.name ? user.name.substring(0, 2) : 'ST'}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black text-white">{user.name}</h1>
                <span className="px-3 py-1 bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-black uppercase rounded-full tracking-wider">
                  {user.role} Account
                </span>
              </div>
              <p className="text-emerald-100/90 text-sm font-medium mt-1 flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-300" /> {user.email}
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center gap-3 shrink-0">
            <Shield className="w-6 h-6 text-emerald-300" />
            <div>
              <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider block">Assigned Group</span>
              <span className="text-sm font-black text-white">{groupName}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left 2 Cols: Personal Details & Change Password */}
        <div className="lg:col-span-2 space-y-8">

          {/* Personal Information */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">Personal Account Details</h2>
                <p className="text-xs text-slate-500 font-medium">Your account profile and identity information.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</span>
                <span className="font-extrabold text-slate-900 text-sm">{user.name}</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</span>
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" /> {user.email}
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mobile / Phone</span>
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" /> {(user as any).phone || 'Not Provided'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Registered Since</span>
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Member'}
                </span>
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">Security & Change Password</h2>
                <p className="text-xs text-slate-500 font-medium">Update your account password for security.</p>
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 ${
                message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Current Password *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">New Password *</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Confirm New Password *</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>

        </div>

        {/* Right 1 Col: Active Subscriptions & Purchased Plans */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-black text-slate-800">My Subscriptions</h2>
              </div>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                purchasedPlans.length > 0 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {purchasedPlans.length > 0 ? 'Active' : 'No Active Plan'}
              </span>
            </div>

            {purchasedPlans.length > 0 ? (
              <div className="space-y-3">
                {purchasedPlans.map((plan: any, idx: number) => {
                  const matchingPlan = allPlans.find(p => p._id === plan.planId || p.id === plan.planId);
                  const planName = matchingPlan ? matchingPlan.name : (plan.name || 'Academic Course Plan');
                  return (
                    <div key={idx} className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-slate-900 text-sm">{planName}</h4>
                        <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black uppercase rounded-md">
                          ACTIVE
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        Enrolled on: {plan.purchasedAt ? new Date(plan.purchasedAt).toLocaleDateString() : 'Active Member'}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-center">
                <p className="text-xs font-bold text-slate-600">No active plan subscriptions found.</p>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Explore and purchase a course plan to unlock full access to tests, practice questions, and study materials.
                </p>
              </div>
            )}

            <button
              onClick={onNavigateToStore}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold uppercase tracking-wider text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" /> Explore & Purchase Plans <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
