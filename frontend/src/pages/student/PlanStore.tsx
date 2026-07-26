import React, { useState, useEffect } from "react";
import { Plan, StudentType } from "../../types";
import {
  Sparkles,
  CheckCircle2,
  Shield,
  X,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  fetchPlans,
  fetchStudentTypes,
  createPaymentOrder,
  verifyPaymentOrder,
} from "../../lib/api";

interface PlanStoreProps {
  user: any;
  onPurchaseSuccess: () => void;
}

export default function PlanStore({ user, onPurchaseSuccess }: PlanStoreProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [studentTypes, setStudentTypes] = useState<StudentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [mockPaymentState, setMockPaymentState] = useState<
    "idle" | "processing" | "success"
  >("idle");
  const [mockPaymentPlan, setMockPaymentPlan] = useState<Plan | null>(null);

  // Group selection modal state before purchase
  const [groupModalPlan, setGroupModalPlan] = useState<Plan | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  useEffect(() => {
    Promise.all([
      fetchPlans({ limit: "1000" }),
      fetchStudentTypes({ limit: "1000" }).catch(() => []),
    ])
      .then(([plansRes, stRes]: [any, any]) => {
        const allPlans = plansRes.data || plansRes || [];
        setPlans(allPlans);
        const stList = Array.isArray(stRes) ? stRes : stRes?.data || [];
        setStudentTypes(
          stList.map((st: any) => ({ id: st._id || st.id, name: st.name })),
        );
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load store data:", err);
        setLoading(false);
      });
  }, []);

  const handleBuyClick = (plan: Plan) => {
    setGroupModalPlan(plan);
    const examObj = typeof plan.examId === "object" ? plan.examId : null;
    const allowed = examObj?.allowedStudentTypes || [];
    if (allowed.length > 0) {
      const firstId =
        typeof allowed[0] === "string"
          ? allowed[0]
          : allowed[0]._id || allowed[0].id;
      setSelectedGroupId(firstId || "");
    } else {
      setSelectedGroupId("");
    }
  };

  const handleProceedToPayment = async () => {
    if (!groupModalPlan) return;
    const plan = groupModalPlan;
    setGroupModalPlan(null);

    try {
      const order = await createPaymentOrder(plan._id);

      if (order.mock) {
        setMockPaymentPlan(plan);
        setMockPaymentState("processing");

        setTimeout(async () => {
          try {
            await verifyPaymentOrder({
              planId: plan._id,
              razorpay_order_id: order.id,
              studentTypeId: selectedGroupId,
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
              studentTypeId: selectedGroupId,
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
          name: user.name,
          email: user.email,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-900 to-teal-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-black mb-4 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-yellow-400" /> Choose Your Path
          </h2>
          <p className="text-emerald-100/90 text-lg mb-6">
            Unlock premium content, personalized timetables, and expert doubt
            clearance by subscribing to our full-year plans.
          </p>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-48 h-48" />
        </div>
      </div>

      <div className="space-y-12">
        {/* Entrance Plans */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-2xl font-black text-slate-800">
              Entrance Exam Plans
            </h3>
            {user?.state && user.state !== "Both" && (
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${user.state === "AP" ? "bg-orange-100 text-orange-700" : "bg-pink-100 text-pink-700"}`}
              >
                {user.state} Region
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans
              .filter((p) => {
                const ex = typeof p.examId === "object" ? p.examId : null;
                const isCompetitive =
                  ex?.type === "competitive" ||
                  ex?.categoryId?.name === "Competitive Exams";
                if (isCompetitive) return false;

                const planState = ex?.state || "Both";
                const userState = user?.state || "Both";
                if (userState === "Both" || planState === "Both") return true;
                return userState === planState;
              })
              .map((plan) => {
                const examObj =
                  typeof plan.examId === "object" ? plan.examId : null;
                const courseName =
                  examObj?.name || plan.name || "Academic Course";

                const targetPlanId = (
                  plan._id ||
                  (plan as any).id ||
                  ""
                ).toString();
                const targetExamId = (
                  examObj?._id ||
                  examObj?.id ||
                  plan.examId ||
                  ""
                ).toString();

                const isPurchased =
                  (user?.purchasedPlans || []).some((p: any) => {
                    if (p.isActive === false) return false;
                    const pPlanId = (
                      p.planId?._id ||
                      p.planId ||
                      ""
                    ).toString();
                    const pExamId = (
                      p.examId?._id ||
                      p.examId ||
                      ""
                    ).toString();
                    return (
                      (pPlanId && pPlanId === targetPlanId) ||
                      (pExamId && targetExamId && pExamId === targetExamId)
                    );
                  }) ||
                  (user?.exams || []).some((ex: any) => {
                    const exId = (ex?._id || ex?.id || ex || "").toString();
                    return exId && targetExamId && exId === targetExamId;
                  });

                return (
                  <div
                    key={plan._id}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>

                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        {courseName}
                      </h3>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg tracking-wider">
                        {plan.name}
                      </span>
                    </div>

                    <div className="text-3xl font-black text-emerald-600 mb-3">
                      ₹{plan.price}
                    </div>
                    <p className="text-sm text-slate-600 mb-6 flex-grow font-medium leading-relaxed">
                      {plan.description}
                    </p>

                    <ul className="space-y-2 mb-6">
                      <li className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{" "}
                        Full year validity
                      </li>
                      <li className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{" "}
                        Study materials & Tests
                      </li>
                      <li className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{" "}
                        Doubt clearance
                      </li>
                    </ul>

                    {isPurchased ? (
                      <button
                        disabled
                        className="w-full py-3 bg-emerald-100 text-emerald-700 font-bold rounded-xl flex justify-center items-center gap-2 cursor-default"
                      >
                        <CheckCircle2 className="w-5 h-5" /> Active Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyClick(plan)}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Buy Now
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Competitive Plans */}
        {plans.filter((p) => {
          const ex = typeof p.examId === "object" ? p.examId : null;
          return (
            ex?.type === "competitive" ||
            ex?.categoryId?.name === "Competitive Exams"
          );
        }).length > 0 && (
          <div className="pt-8 border-t border-slate-200/60">
            <h3 className="text-2xl font-black text-slate-800 mb-6">
              Competitive Exam Plans
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans
                .filter((p) => {
                  const ex = typeof p.examId === "object" ? p.examId : null;
                  return (
                    ex?.type === "competitive" ||
                    ex?.categoryId?.name === "Competitive Exams"
                  );
                })
                .map((plan) => {
                  const examObj =
                    typeof plan.examId === "object" ? plan.examId : null;
                  const courseName =
                    examObj?.name || plan.name || "Academic Course";

                  const targetPlanId = (
                    plan._id ||
                    (plan as any).id ||
                    ""
                  ).toString();
                  const targetExamId = (
                    examObj?._id ||
                    examObj?.id ||
                    plan.examId ||
                    ""
                  ).toString();

                  const isPurchased =
                    (user?.purchasedPlans || []).some((p: any) => {
                      if (p.isActive === false) return false;
                      const pPlanId = (
                        p.planId?._id ||
                        p.planId ||
                        ""
                      ).toString();
                      const pExamId = (
                        p.examId?._id ||
                        p.examId ||
                        ""
                      ).toString();
                      return (
                        (pPlanId && pPlanId === targetPlanId) ||
                        (pExamId && targetExamId && pExamId === targetExamId)
                      );
                    }) ||
                    (user?.exams || []).some((ex: any) => {
                      const exId = (ex?._id || ex?.id || ex || "").toString();
                      return exId && targetExamId && exId === targetExamId;
                    });

                  return (
                    <div
                      key={plan._id}
                      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden group"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>

                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">
                          {courseName}
                        </h3>
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg tracking-wider">
                          {plan.name}
                        </span>
                      </div>

                      <div className="text-3xl font-black text-blue-600 mb-3">
                        ₹{plan.price}
                      </div>
                      <p className="text-sm text-slate-600 mb-6 flex-grow font-medium leading-relaxed">
                        {plan.description}
                      </p>

                      <ul className="space-y-2 mb-6">
                        <li className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />{" "}
                          Full year validity
                        </li>
                        <li className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />{" "}
                          Comprehensive Mocks
                        </li>
                        <li className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />{" "}
                          Detailed Analytics
                        </li>
                      </ul>

                      {isPurchased ? (
                        <button
                          disabled
                          className="w-full py-3 bg-blue-100 text-blue-700 font-bold rounded-xl flex justify-center items-center gap-2 cursor-default"
                        >
                          <CheckCircle2 className="w-5 h-5" /> Active Plan
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuyClick(plan)}
                          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Buy Now
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Select Student Group Modal Before Payment */}
      {groupModalPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in duration-200">
            <button
              onClick={() => setGroupModalPlan(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-black mb-2 border border-emerald-200">
                <Shield className="w-3.5 h-3.5" /> Select Student Group
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {(typeof groupModalPlan.examId === "object" &&
                  groupModalPlan.examId?.name) ||
                  "Course Plan"}
              </h3>
              <p className="text-slate-500 text-xs font-medium mt-1">
                Select your student group to map your exact study timetable,
                tests, and materials.
              </p>
            </div>

            {/* Allowed Groups Radio List */}
            {(() => {
              const examObj =
                typeof groupModalPlan.examId === "object"
                  ? groupModalPlan.examId
                  : null;
              const allowedGroups = examObj?.allowedStudentTypes || [];

              if (allowedGroups.length === 0) {
                return (
                  <p className="text-xs text-slate-400 p-4 bg-slate-50 rounded-xl border">
                    No specific groups restricted. Proceed to purchase.
                  </p>
                );
              }

              return (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {allowedGroups.map((st: any) => {
                    const stId = typeof st === "string" ? st : st._id || st.id;
                    const stObjName =
                      typeof st === "object" && st !== null && st.name
                        ? st.name
                        : null;
                    const fallbackName = studentTypes.find(
                      (s) => s.id === stId,
                    )?.name;
                    const stName = stObjName || fallbackName || stId;
                    const isSelected = selectedGroupId === stId;

                    return (
                      <div
                        key={stId}
                        onClick={() => setSelectedGroupId(stId)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-emerald-50 border-emerald-600 text-emerald-950 font-bold shadow-xs"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span className="text-xs font-bold">{stName}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <button
              onClick={handleProceedToPayment}
              disabled={
                !selectedGroupId &&
                ((typeof groupModalPlan.examId === "object" &&
                  groupModalPlan.examId?.allowedStudentTypes?.length) ||
                  0) > 0
              }
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase tracking-wider text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed to Pay ₹{groupModalPlan.price}{" "}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mock Payment Modal */}
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
