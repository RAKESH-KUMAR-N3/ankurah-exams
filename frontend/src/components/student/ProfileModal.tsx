import React from 'react';
import { User, StudentType } from '../../types';
import { X, User as UserIcon, Mail, Shield, Calendar, Sparkles, CheckCircle2, Award } from 'lucide-react';

interface ProfileModalProps {
  user: User;
  studentTypes: StudentType[];
  allPlans: any[];
  isOpen: boolean;
  onClose: () => void;
  onNavigateToStore?: () => void;
}

export default function ProfileModal({
  user,
  studentTypes,
  allPlans,
  isOpen,
  onClose,
  onNavigateToStore
}: ProfileModalProps) {
  if (!isOpen) return null;

  // Identify Student Group Name
  const userGroupObj = studentTypes.find(st => (st.id || (st as any)._id) === (user as any).studentTypeId || st.name === user.studentType);
  const groupName = userGroupObj ? userGroupObj.name : (user.studentType || 'Not Assigned');

  // Identify Active Purchased Plans
  const purchasedPlans = user.purchasedPlans || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 text-emerald-950 font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white/30 uppercase">
              {user.name ? user.name.substring(0, 2) : 'ST'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black">{user.name}</h2>
                <span className="px-2.5 py-0.5 bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-[10px] font-extrabold uppercase rounded-full tracking-wider">
                  {user.role}
                </span>
              </div>
              <p className="text-emerald-100/80 text-xs font-medium mt-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Group & Track Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Student Group</span>
              <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                {groupName}
              </span>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Registered Date</span>
              <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Student'}
              </span>
            </div>
          </div>

          {/* Active Subscription Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" /> Purchased Plans & Active Subscriptions
              </h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {purchasedPlans.length > 0 ? `${purchasedPlans.length} Active Plan(s)` : 'Yearly Active'}
              </span>
            </div>

            {purchasedPlans.length > 0 ? (
              <div className="space-y-3">
                {purchasedPlans.map((plan: any, idx: number) => {
                  const matchingPlan = allPlans.find(p => p._id === plan.planId || p.id === plan.planId);
                  const planName = matchingPlan ? matchingPlan.name : (plan.name || 'Academic Course Plan');
                  return (
                    <div key={idx} className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">{planName}</h4>
                          <p className="text-xs text-slate-500 font-medium">
                            Enrolled on: {plan.purchasedAt ? new Date(plan.purchasedAt).toLocaleDateString() : 'Active'}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-lg tracking-wider">
                        ACTIVE
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Fallback active plan or Default Subscription */
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {user.studyPlan ? `${user.studyPlan.replace('_', ' ').toUpperCase()} PLAN` : 'Yearly Academic Plan'}
                    </h4>
                    <p className="text-xs text-emerald-800 font-medium">Full Access to Questions, Tests & Materials</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-lg tracking-wider">
                  ACTIVE
                </span>
              </div>
            )}
          </div>

          {/* Store CTA */}
          {onNavigateToStore && (
            <div className="pt-2">
              <button
                onClick={() => { onClose(); onNavigateToStore(); }}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" /> Explore & Buy Additional Course Plans
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
