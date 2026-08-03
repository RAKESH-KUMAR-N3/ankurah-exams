import React, { useState, useEffect } from "react";
import { Plan } from "../../types";
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  GraduationCap,
  Trophy,
  ShieldCheck,
  Zap,
  Check,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchPlans,
  createPaymentOrder,
  verifyPaymentOrder,
} from "../../lib/api";

interface PlanStoreProps {
  user: any;
  onPurchaseSuccess: () => void;
}

export default function PlanStore({ user, onPurchaseSuccess }: PlanStoreProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "entrance" | "competitive">("all");
  const [viewTab, setViewTab] = useState<"active" | "browse">("active");
  const [selectedPlanModal, setSelectedPlanModal] = useState<Plan | null>(null);
  const [mockPaymentState, setMockPaymentState] = useState<
    "idle" | "processing" | "success"
  >("idle");
  const [mockPaymentPlan, setMockPaymentPlan] = useState<Plan | null>(null);

  useEffect(() => {
    fetchPlans({ limit: "1000" })
      .then((plansRes: any) => {
        const allPlans = plansRes.data || plansRes || [];
        setPlans(allPlans);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load store data:", err);
        setLoading(false);
      });
  }, []);

  const handleBuyClick = async (plan: Plan) => {
    try {
      setSelectedPlanModal(null);
      const order = await createPaymentOrder(plan._id);

      if (order.mock) {
        setMockPaymentPlan(plan);
        setMockPaymentState("processing");

        setTimeout(async () => {
          try {
            await verifyPaymentOrder({
              planId: plan._id,
              razorpay_order_id: order.id,
            });
            setMockPaymentState("success");
          } catch (e) {
            console.error("Mock payment failed", e);
            setMockPaymentState("idle");
          }
        }, 1500);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "your_test_key_id_here",
        amount: order.amount,
        currency: order.currency,
        name: "Ankurah Exams",
        description: `Purchase ${plan.name}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            await verifyPaymentOrder({
              planId: plan._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            alert(`Payment successful for ${plan.name}`);
            onPurchaseSuccess();
          } catch (err) {
            console.error("Payment verification failed:", err);
            alert(
              "Payment verification failed. Please contact support if amount was deducted.",
            );
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#10b981",
        },
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response.error);
        alert(`Payment failed: ${response.error.description}`);
      });
      rzp1.open();
    } catch (err) {
      console.error("Purchase initiation failed:", err);
      alert("Failed to initiate purchase. Please try again.");
    }
  };

  const isPlanActive = (plan: Plan) => {
    const examObj = typeof plan.examId === "object" ? plan.examId : null;
    const targetPlanId = (plan._id || (plan as any).id || "").toString();
    const targetExamId = (examObj?._id || examObj?.id || plan.examId || "").toString();

    return (
      (user?.purchasedPlans || []).some((p: any) => {
        if (p.isActive === false) return false;
        const pPlanId = (p.planId?._id || p.planId || "").toString();
        const pExamId = (p.examId?._id || p.examId || "").toString();
        return (
          (pPlanId && pPlanId === targetPlanId) ||
          (pExamId && targetExamId && pExamId === targetExamId)
        );
      }) ||
      (user?.exams || []).some((ex: any) => {
        const exId = (ex?._id || ex?.id || ex || "").toString();
        return exId && targetExamId && exId === targetExamId;
      })
    );
  };

  const activePlansList = plans.filter(isPlanActive);
  const hasActivePlan = activePlansList.length > 0;

  useEffect(() => {
    if (hasActivePlan) {
      setViewTab("active");
    } else {
      setViewTab("browse");
    }
  }, [hasActivePlan]);

  const entrancePlans = plans.filter((p) => {
    const ex = typeof p.examId === "object" ? p.examId : null;
    const isCompetitive = ex?.type === "competitive" || ex?.categoryId?.name === "Competitive Exams";
    return !isCompetitive;
  });

  const competitivePlans = plans.filter((p) => {
    const ex = typeof p.examId === "object" ? p.examId : null;
    return ex?.type === "competitive" || ex?.categoryId?.name === "Competitive Exams";
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 font-sans pb-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 animate-spin" style={{ animationDuration: '8s' }} /> 
            Official Course Plans
          </h1>
          <p className="text-slate-600 text-[11px] sm:text-xs font-bold mt-0.5">
            {hasActivePlan 
              ? "Viewing your active course subscription. Switch tabs to explore other available plans." 
              : "Subscribe to an official plan to unlock chapter tests, daily timetables, and performance analytics."}
          </p>
        </div>

        <div className="flex items-center p-1 bg-slate-200/70 backdrop-blur-md rounded-xl border border-slate-300/80 shrink-0 self-start sm:self-auto shadow-xs w-full sm:w-auto justify-stretch">
          {hasActivePlan && (
            <button
              onClick={() => setViewTab("active")}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                viewTab === "active"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-700 hover:text-emerald-700"
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300 shrink-0" /> Active Plan ({activePlansList.length})
            </button>
          )}

          <button
            onClick={() => setViewTab("browse")}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              viewTab === "browse" || !hasActivePlan
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-700 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 shrink-0" /> All Plans ({plans.length})
          </button>
        </div>
      </div>

      {viewTab === "active" && hasActivePlan && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl mx-auto space-y-4 pt-1"
        >
          <motion.div 
            animate={{ boxShadow: ['0 0 0px rgba(16,185,129,0)', '0 0 25px rgba(16,185,129,0.3)', '0 0 0px rgba(16,185,129,0)'] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
            className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-950/20 via-teal-950/10 to-slate-900/40 backdrop-blur-md border-2 border-emerald-500 shadow-xl relative overflow-hidden space-y-4"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 font-mono font-black text-[10px] sm:text-xs rounded-lg uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-500 animate-pulse shrink-0" />
                ⚡ CURRENTLY ACTIVE ENROLLED PLAN
              </span>

              <span className="px-2.5 py-1 bg-emerald-600 text-white font-mono font-black text-[10px] sm:text-xs rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-200 shrink-0" /> Full Access Active
              </span>
            </div>

            <div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {typeof (activePlansList[0] as any)?.planId === "object"
                  ? (activePlansList[0] as any).planId?.name
                  : typeof activePlansList[0]?.examId === "object"
                  ? activePlansList[0].examId?.name
                  : activePlansList[0]?.name || "Enrolled Course Plan"}
              </h2>
              <p className="text-slate-600 text-xs font-bold mt-1 leading-relaxed">
                {(typeof (activePlansList[0] as any)?.planId === "object" ? (activePlansList[0] as any).planId?.description : activePlansList[0]?.description) || "Full academic year subscription. Access all chapter mock tests, daily timetables, study materials & doubts."}
              </p>
            </div>

            <div className="flex items-baseline gap-2 pt-2 border-t border-slate-200/80">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
                ₹{typeof (activePlansList[0] as any)?.planId === "object" ? (activePlansList[0] as any).planId?.price : (activePlansList[0]?.price || "2,500")}
              </span>
              <span className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider">/ 1 Full Year Validity</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-1">
              <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-extrabold text-slate-900">Unlimited Chapter Mock Tests</span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-teal-500/10 border border-teal-400/30 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="text-xs font-extrabold text-slate-900">Daily Timetables & Schedules</span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-blue-500/10 border border-blue-400/30 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-extrabold text-slate-900">Complete Syllabus Coverage</span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs font-extrabold text-slate-900">24/7 Doubt Clearance Support</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200/80 flex-wrap">
              <span className="text-xs font-extrabold text-slate-600 flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald-600" /> Active Plan Registered
              </span>

              <button
                onClick={() => setViewTab("browse")}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                Browse / Upgrade Other Plans <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {(viewTab === "browse" || !hasActivePlan) && (
        <div className="space-y-4 sm:space-y-6">
          
          {/* Filter Header — Fixed for Mobile to prevent vertical text stacking */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200/80 pb-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" /> Click Any Plan Card for Full Details
            </h3>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                  selectedCategory === "all"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All ({plans.length})
              </button>
              <button
                onClick={() => setSelectedCategory("entrance")}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                  selectedCategory === "entrance"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                }`}
              >
                Entrance ({entrancePlans.length})
              </button>
              {competitivePlans.length > 0 && (
                <button
                  onClick={() => setSelectedCategory("competitive")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                    selectedCategory === "competitive"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-blue-50 text-blue-800 hover:bg-blue-100"
                  }`}
                >
                  Competitive ({competitivePlans.length})
                </button>
              )}
            </div>
          </div>

          {(selectedCategory === "all" || selectedCategory === "entrance") && entrancePlans.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <h2 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" /> Entrance & Academic Plans
                </h2>
                <span className="text-[9px] sm:text-[10px] font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-md">
                  Inter • NEET • EAPCET • JEE
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
                {entrancePlans.map((plan) => {
                  const examObj = typeof plan.examId === "object" ? plan.examId : null;
                  const courseName = examObj?.name || plan.name || "Academic Course";
                  const isPurchased = isPlanActive(plan);

                  return (
                    <motion.div
                      key={plan._id}
                      whileHover={{ y: -4, scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedPlanModal(plan)}
                      className={`rounded-xl p-3 border backdrop-blur-md cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden group shadow-none min-h-[135px] ${
                        isPurchased
                          ? "bg-emerald-950/20 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                          : "bg-slate-900/10 dark:bg-slate-900/40 border-slate-300/80 hover:border-emerald-500"
                      }`}
                    >
                      {isPurchased ? (
                        <span className="self-start px-2 py-0.5 bg-emerald-600 text-white font-mono font-black text-[8px] uppercase rounded-md tracking-wider flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 fill-amber-300 text-amber-300" /> Active
                        </span>
                      ) : (
                        <span className="self-start px-1.5 py-0.5 bg-emerald-100/90 text-emerald-800 border border-emerald-300 font-mono font-black text-[8px] uppercase rounded-md">
                          Entrance
                        </span>
                      )}

                      <div className="my-1.5 space-y-1">
                        <h3 className="text-xs font-black text-slate-900 tracking-tight leading-snug line-clamp-2">
                          {courseName}
                        </h3>
                        <div className="text-base sm:text-lg font-black text-emerald-600 font-mono">
                          ₹{plan.price}
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[10px] font-extrabold text-slate-600">
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {(selectedCategory === "all" || selectedCategory === "competitive") && competitivePlans.length > 0 && (
            <div className="space-y-2.5 pt-3 border-t border-slate-200/80">
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <h2 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <Trophy className="w-4 h-4 text-blue-600 shrink-0" /> Competitive Exam Plans
                </h2>
                <span className="text-[9px] sm:text-[10px] font-extrabold text-blue-800 bg-blue-100/90 border border-blue-300 px-2 py-0.5 rounded-md">
                  Govt Exams • RRB • SSC • Banking
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
                {competitivePlans.map((plan) => {
                  const examObj = typeof plan.examId === "object" ? plan.examId : null;
                  const courseName = examObj?.name || plan.name || "Competitive Course";
                  const isPurchased = isPlanActive(plan);

                  return (
                    <motion.div
                      key={plan._id}
                      whileHover={{ y: -4, scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedPlanModal(plan)}
                      className={`rounded-xl p-3 border backdrop-blur-md cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden group shadow-none min-h-[135px] ${
                        isPurchased
                          ? "bg-blue-950/20 border-2 border-blue-500 shadow-md ring-2 ring-blue-500/20"
                          : "bg-slate-900/10 dark:bg-slate-900/40 border-slate-300/80 hover:border-blue-500"
                      }`}
                    >
                      {isPurchased ? (
                        <span className="self-start px-2 py-0.5 bg-blue-600 text-white font-mono font-black text-[8px] uppercase rounded-md tracking-wider flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 fill-amber-300 text-amber-300" /> Active
                        </span>
                      ) : (
                        <span className="self-start px-1.5 py-0.5 bg-blue-100/90 text-blue-800 border border-blue-300 font-mono font-black text-[8px] uppercase rounded-md">
                          Competitive
                        </span>
                      )}

                      <div className="my-1.5 space-y-1">
                        <h3 className="text-xs font-black text-slate-900 tracking-tight leading-snug line-clamp-2">
                          {courseName}
                        </h3>
                        <div className="text-base sm:text-lg font-black text-blue-600 font-mono">
                          ₹{plan.price}
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[10px] font-extrabold text-slate-600">
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3 text-blue-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {selectedPlanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 text-left shadow-2xl space-y-5 relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 text-emerald-800 dark:text-emerald-400 font-mono font-extrabold text-[10px] rounded-md uppercase tracking-wider">
                    {typeof selectedPlanModal.examId === "object" ? selectedPlanModal.examId?.type || "Academic" : "Academic"} Course Plan
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                    {typeof selectedPlanModal.examId === "object" ? selectedPlanModal.examId?.name : selectedPlanModal.name}
                  </h3>
                </div>

                <button 
                  onClick={() => setSelectedPlanModal(null)}
                  className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-emerald-600">₹{selectedPlanModal.price}</span>
                <span className="text-xs font-extrabold text-slate-500 uppercase">/ 1 Full Year Subscription</span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                {selectedPlanModal.description || "Full access subscription. Access chapter notes, mock tests, schedules & 24/7 doubt resolution."}
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Plan Highlights & Benefits</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">1 Full Year Validity</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">Chapter Tests & Mocks</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">Daily Timetable Schedules</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">Detailed Performance AI</span>
                  </div>
                </div>
              </div>

              <div className="pt-3">
                {isPlanActive(selectedPlanModal) ? (
                  <div className="w-full py-3 bg-emerald-600 text-white font-black rounded-xl text-xs flex justify-center items-center gap-2 uppercase tracking-wider shadow-md">
                    <ShieldCheck className="w-4 h-4 text-emerald-200" /> Active Subscribed Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleBuyClick(selectedPlanModal)}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    Buy Plan Now (₹{selectedPlanModal.price}) <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {mockPaymentState !== "idle" && mockPaymentPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 text-center shadow-2xl animate-fade-in-up">
            {mockPaymentState === "processing" ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Processing Payment...
                </h3>
                <p className="text-slate-500 text-sm">
                  Please wait while we securely process your payment for{" "}
                  {mockPaymentPlan.name}.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Payment Successful!
                </h3>
                <p className="text-slate-500 text-sm mb-8">
                  You have successfully subscribed to the{" "}
                  <span className="font-semibold text-slate-700">
                    {mockPaymentPlan.name}
                  </span>{" "}
                  plan.
                </p>
                <button
                  onClick={() => {
                    setMockPaymentState("idle");
                    onPurchaseSuccess();
                  }}
                  className="w-full py-3 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Continue to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
