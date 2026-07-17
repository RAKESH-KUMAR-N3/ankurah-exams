import React, { useState, useEffect } from 'react';
import { Plan, EntranceExam, CompetitiveExam } from '../types';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

// Since we are mocking API for now or using real API, we need to adapt to what's available
// Assuming we fetch plans from API
export default function PlanStore({ user, onPurchaseSuccess }: { user: any, onPurchaseSuccess: () => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // In a real implementation, we would fetch from /api/plans
    // For now, let's mock it based on the requirement
    setTimeout(() => {
      setPlans([
        {
          _id: 'plan_1',
          examId: 'eamcet_1',
          name: 'EAMCET Full Year',
          price: 999,
          description: 'Complete access to EAMCET study materials, chapter-wise tests, and mock exams.',
          isActive: true
        },
        {
          _id: 'plan_2',
          examId: 'neet_1',
          name: 'NEET Full Year',
          price: 1499,
          description: 'Comprehensive NEET preparation with deep analytics and doubt clearance.',
          isActive: true
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handlePurchase = (plan: Plan) => {
    // We would make an API call here to /api/plans/purchase
    // axios.post('/api/plans/purchase', { planId: plan._id })
    alert(`Dummy Payment Gateway: Confirm purchase for ${plan.name} at ₹${plan.price}`);
    onPurchaseSuccess();
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-900 to-teal-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-black mb-4 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-yellow-400" /> Choose Your Path
          </h2>
          <p className="text-emerald-100/90 text-lg mb-6">
            Unlock premium content, personalized timetables, and expert doubt clearance by subscribing to our full-year plans.
          </p>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-48 h-48" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan._id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden group cursor-pointer">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{plan.name}</h3>
            <div className="text-3xl font-black text-emerald-600 mb-4">₹{plan.price}</div>
            <p className="text-sm text-slate-600 mb-6 flex-grow">{plan.description}</p>
            
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2 text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Full year validity</li>
              <li className="flex items-start gap-2 text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Study materials & Tests</li>
              <li className="flex items-start gap-2 text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Doubt clearance</li>
            </ul>

            <button 
              onClick={() => handlePurchase(plan)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
