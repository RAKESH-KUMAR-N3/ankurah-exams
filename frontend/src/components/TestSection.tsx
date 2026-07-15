import React, { useState, useEffect } from 'react';
import { User, Test, Question, TestAttempt, Subject } from '../types';
import { 
  FileText, Clock, Award, ShieldAlert, CheckCircle, AlertCircle, 
  HelpCircle, ChevronLeft, ChevronRight, Play, Check, Send, X 
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface TestSectionProps {
  user: User;
  tests: Test[];
  questions: Question[];
  attempts: TestAttempt[];
  subjects: Subject[];
  onTestSubmitted: (attempt: TestAttempt) => void;
}

export default function TestSection({
  user,
  tests,
  questions,
  attempts,
  subjects,
  onTestSubmitted
}: TestSectionProps) {
  // Test Taker State
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({}); // qId -> optionIndex
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Completed Test Review State
  const [viewingAttempt, setViewingAttempt] = useState<TestAttempt | null>(null);
  const [viewingTest, setViewingTest] = useState<Test | null>(null);

  // Count down timer
  useEffect(() => {
    if (!activeTest || timeLeft <= 0) {
      if (activeTest && timeLeft === 0) {
        // Auto-submit when time is up
        handleSubmitTest(true);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTest, timeLeft]);

  const handleStartTest = (test: Test) => {
    // Gather questions for this test
    const testQ = questions.filter(q => test.questionIds.includes(q.id));
    
    if (testQ.length === 0) {
      alert("No questions have been mapped to this test yet by the administrator.");
      return;
    }

    setTestQuestions(testQ);
    setActiveTest(test);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeLeft(test.duration * 60);
    setShowConfirmSubmit(false);
    setViewingAttempt(null);
  };

  const handleSelectOption = (qId: string, optIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: optIndex
    }));
  };

  const handleSubmitTest = async (auto = false) => {
    if (!activeTest) return;
    setSubmitting(true);

    // Calculate score
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;

    testQuestions.forEach(q => {
      const selected = answers[q.id];
      if (selected === undefined || selected === -1) {
        unattemptedCount++;
      } else if (selected === q.correctAnswerIndex) {
        correctCount++;
        score += q.marks;
      } else {
        wrongCount++;
        if (activeTest.negativeMarking) {
          score -= q.negativeMarks;
        }
      }
    });

    // Make sure score is not negative
    score = Math.max(0, score);
    const percentage = Math.round((score / activeTest.totalMarks) * 100);
    const attemptedCount = correctCount + wrongCount;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const timeTakenSeconds = (activeTest.duration * 60) - timeLeft;

    const attemptId = `attempt-${Date.now()}-${user.uid}`;
    const newAttempt: TestAttempt = {
      id: attemptId,
      userId: user.uid,
      testId: activeTest.id,
      answers,
      score,
      percentage,
      accuracy,
      correctCount,
      wrongCount,
      unattemptedCount,
      timeTakenSeconds,
      submittedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'testAttempts', attemptId), newAttempt);
      
      // Update streak
      const updatedUser: User = {
        ...user,
        streak: (user.streak || 1) + 1,
        lastActiveDate: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', user.uid), updatedUser);

      // Successfully submitted
      onTestSubmitted(newAttempt);
      setViewingAttempt(newAttempt);
      setViewingTest(activeTest);
      setActiveTest(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'testAttempts');
    } finally {
      setSubmitting(false);
      setShowConfirmSubmit(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleOpenAttemptReview = (attempt: TestAttempt, test: Test) => {
    setViewingAttempt(attempt);
    setViewingTest(test);
  };

  // View: Active Test taking layout
  if (activeTest) {
    const currentQuestion = testQuestions[currentQuestionIndex];
    return (
      <div className="fixed inset-0 bg-zinc-950 text-white z-50 flex flex-col justify-between font-sans">
        {/* Fullscreen Test Header */}
        <header className="px-6 py-4 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center shrink-0">
          <div>
            <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider">Exam Simulator</span>
            <h2 className="font-bold text-sm text-white">{activeTest.title}</h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-xs font-bold tracking-wider text-emerald-400">
                {formatTime(timeLeft)}
              </span>
            </div>
            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer text-white shadow-geom-sm border border-emerald-500"
            >
              <Send className="w-3.5 h-3.5" /> Submit Exam
            </button>
          </div>
        </header>

        {/* Major Grid Container */}
        <div className="flex-grow overflow-hidden flex flex-col md:flex-row">
          
          {/* Left panel: Active Question details */}
          <main className="flex-grow overflow-y-auto p-6 md:p-12 flex flex-col justify-between bg-zinc-900/20">
            <div className="space-y-6 max-w-2xl w-full mx-auto">
              {/* Question status */}
              <div className="flex justify-between items-center text-[11px] text-zinc-400">
                <span className="font-medium">Question {currentQuestionIndex + 1} of {testQuestions.length}</span>
                <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-850 rounded-sm text-zinc-300 font-bold uppercase tracking-wider">
                  {currentQuestion.difficulty} • {currentQuestion.marks} Marks
                </span>
              </div>

              {/* Question description */}
              <div className="space-y-4">
                <p className="text-base md:text-lg font-bold leading-relaxed text-zinc-100">
                  {currentQuestion.questionText}
                </p>
              </div>

              {/* Option multiple buttons */}
              <div className="space-y-3 pt-4">
                {currentQuestion.options.map((option, index) => {
                  const selected = answers[currentQuestion.id] === index;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectOption(currentQuestion.id, index)}
                      className={`w-full text-left p-4 rounded-md border text-xs font-medium transition-all flex gap-4 items-center cursor-pointer ${
                        selected 
                          ? 'bg-zinc-900 border-emerald-500 text-emerald-300 shadow-geom' 
                          : 'bg-zinc-950/50 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-sm font-bold text-[10px] flex items-center justify-center shrink-0 border ${
                        selected 
                          ? 'bg-emerald-600 border-emerald-500 text-white' 
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Pagination */}
            <div className="max-w-2xl w-full mx-auto pt-8 border-t border-zinc-800/50 flex justify-between shrink-0">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-sm bg-zinc-900 border border-zinc-800 text-xs font-bold hover:bg-zinc-850 transition-all cursor-pointer disabled:opacity-40 text-zinc-300"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              
              <button
                onClick={() => {
                  if (answers[currentQuestion.id] === undefined) {
                    // Mark as explicitly skipped/unattempted for color coding
                    handleSelectOption(currentQuestion.id, -1);
                  }
                  setCurrentQuestionIndex(prev => Math.min(testQuestions.length - 1, prev + 1));
                }}
                disabled={currentQuestionIndex === testQuestions.length - 1}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-sm bg-zinc-900 border border-zinc-800 text-xs font-bold hover:bg-zinc-850 transition-all cursor-pointer disabled:opacity-40 text-zinc-300"
              >
                Skip / Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </main>

          {/* Right index panel: Questions index matrix */}
          <aside className="w-full md:w-80 bg-zinc-950 border-t md:border-t-0 md:border-l border-zinc-800 shrink-0 p-6 overflow-y-auto">
            <h3 className="font-bold text-[10px] uppercase tracking-wider text-zinc-500 mb-4">Exam Navigation</h3>
            
            <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
              {testQuestions.map((q, idx) => {
                const ans = answers[q.id];
                const attempted = ans !== undefined && ans !== -1;
                const skipped = ans === -1;
                const active = currentQuestionIndex === idx;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-9 rounded-sm font-mono font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                      active 
                        ? 'border-2 border-emerald-500 bg-zinc-900 text-white shadow-geom' 
                        : attempted 
                          ? 'bg-emerald-600 border border-emerald-700 text-white' 
                          : skipped 
                            ? 'bg-amber-950/40 text-amber-300 border border-amber-800' 
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800/80'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Explanatory notes */}
            <div className="mt-8 space-y-3 p-4 bg-zinc-900/50 border border-zinc-850 rounded-md text-xs text-zinc-400">
              <span className="font-bold text-zinc-300 uppercase text-[9px] tracking-wider block">Color Legend:</span>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-emerald-600 rounded-sm"></span>
                <span className="text-[11px] font-semibold text-zinc-400">Attempted</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-zinc-900 border border-zinc-800 rounded-sm"></span>
                <span className="text-[11px] font-semibold text-zinc-400">Unattempted</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-emerald-500 bg-zinc-900 rounded-sm"></span>
                <span className="text-[11px] font-semibold text-zinc-300">Current Selected</span>
              </div>
            </div>
          </aside>
        </div>

        {/* Submit Confirm Dialog Modal */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-lg max-w-sm w-full space-y-5 shadow-geom">
              <div className="text-center">
                <div className="w-11 h-11 bg-zinc-900 border border-zinc-800 rounded-md flex items-center justify-center text-emerald-400 mx-auto mb-3">
                  <Play className="w-5 h-5 rotate-90" />
                </div>
                <h3 className="font-bold text-white text-base">Confirm Exam Submission</h3>
                <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
                  You have completed <span className="text-white font-bold">{Object.keys(answers).filter(k => answers[k] !== -1).length}</span> out of <span className="text-white font-bold">{testQuestions.length}</span> questions. Ready to submit and calculate analytics?
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-850 text-white rounded-sm text-xs font-bold transition-all cursor-pointer border border-zinc-800"
                >
                  Back to Exam
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitTest(false)}
                  disabled={submitting}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border border-emerald-500"
                >
                  {submitting ? 'Submitting...' : 'Yes, Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // View: Detailed Review of Completed Attempt
  if (viewingAttempt && viewingTest) {
    const attemptQ = questions.filter(q => viewingTest.questionIds.includes(q.id));
    return (
      <div className="space-y-6 font-sans">
        <button
          onClick={() => { setViewingAttempt(null); setViewingTest(null); }}
          className="flex items-center gap-1 text-zinc-500 hover:text-zinc-800 text-[10px] font-bold uppercase tracking-wider cursor-pointer pb-2 transition-all"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Test Center
        </button>

        {/* score card summary */}
        <div className="bg-white rounded-lg border border-geom-border p-6 shadow-geom flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="px-2 py-0.5 bg-zinc-900 text-white border border-zinc-800 font-bold text-[9px] rounded-sm uppercase tracking-wider">
              {viewingTest.type} test report
            </span>
            <h2 className="text-lg font-extrabold text-zinc-900">{viewingTest.title}</h2>
            <p className="text-xs text-zinc-400 font-medium">Submitted on {new Date(viewingAttempt.submittedAt).toLocaleString()}</p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="px-4 py-3 bg-zinc-50 border border-geom-border rounded-md text-center min-w-[90px]">
              <span className="text-lg font-bold font-mono block text-zinc-900">{viewingAttempt.score}/{viewingTest.totalMarks}</span>
              <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">Total Score</span>
            </div>
            <div className="px-4 py-3 bg-zinc-50 border border-geom-border rounded-md text-center min-w-[90px]">
              <span className="text-lg font-bold font-mono block text-zinc-900">{viewingAttempt.percentage}%</span>
              <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">Percentile</span>
            </div>
            <div className="px-4 py-3 bg-zinc-50 border border-geom-border rounded-md text-center min-w-[90px]">
              <span className="text-lg font-bold font-mono block text-zinc-900">{viewingAttempt.accuracy}%</span>
              <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">Accuracy</span>
            </div>
          </div>
        </div>

        {/* Breakdown detail matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-50 border border-geom-border p-4 rounded-md text-zinc-900 text-xs flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <div>
              <span className="font-bold block text-sm">{viewingAttempt.correctCount} Correct</span>
              <span className="text-zinc-500 text-[11px]">Successfully mastered marks</span>
            </div>
          </div>

          <div className="bg-zinc-50 border border-geom-border p-4 rounded-md text-zinc-900 text-xs flex items-center gap-3">
            <X className="w-5 h-5 text-red-500" />
            <div>
              <span className="font-bold block text-sm">{viewingAttempt.wrongCount} Wrong</span>
              <span className="text-zinc-500 text-[11px]">Incorrect option selections</span>
            </div>
          </div>

          <div className="bg-zinc-50 border border-geom-border p-4 rounded-md text-zinc-900 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-zinc-400" />
            <div>
              <span className="font-bold block text-sm">{viewingAttempt.unattemptedCount} Skipped</span>
              <span className="text-zinc-500 text-[11px]">Unanswered questions</span>
            </div>
          </div>
        </div>

        {/* Explanations detail */}
        <div className="bg-white rounded-lg border border-geom-border p-6 shadow-geom space-y-6">
          <h3 className="font-bold text-zinc-900 text-base border-b border-geom-border pb-4">
            Question Explanations & Key Review
          </h3>

          <div className="space-y-6">
            {attemptQ.map((q, idx) => {
              const selected = viewingAttempt.answers[q.id];
              const isCorrect = selected === q.correctAnswerIndex;
              const skipped = selected === undefined || selected === -1;

              return (
                <div key={q.id} className="p-5 rounded-md border border-geom-border bg-zinc-50/50 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-zinc-800">Question {idx + 1}</span>
                    <span className={`px-2 py-0.5 rounded-sm font-bold text-[9px] border ${
                      isCorrect 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-850' 
                        : skipped 
                          ? 'bg-zinc-100 border-zinc-200 text-zinc-650' 
                          : 'bg-red-50 border-red-200 text-red-850'
                    }`}>
                      {isCorrect ? 'Correct (+4 Marks)' : skipped ? 'Skipped (0 Marks)' : 'Incorrect (-1 Marks)'}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-zinc-900 leading-relaxed">
                    {q.questionText}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                    {q.options.map((opt, oIdx) => {
                      const isOptionSelected = selected === oIdx;
                      const isCorrectOption = q.correctAnswerIndex === oIdx;

                      return (
                        <div 
                          key={oIdx} 
                          className={`p-3 rounded-md border text-xs font-semibold flex items-center gap-3 ${
                            isCorrectOption 
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                              : isOptionSelected 
                                ? 'bg-red-50 border-red-300 text-red-800' 
                                : 'bg-white border-geom-border text-zinc-600'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center font-bold font-mono text-[10px] ${
                            isCorrectOption 
                              ? 'bg-emerald-600 text-white' 
                              : isOptionSelected 
                                ? 'bg-red-500 text-white' 
                                : 'bg-zinc-100 border border-geom-border text-zinc-500'
                          }`}>
                            {String.fromCharCode(65 + oIdx)}
                          </div>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="mt-3 p-4 bg-zinc-100/50 rounded-md border border-geom-border text-xs">
                      <span className="font-bold text-zinc-900 block mb-1 uppercase text-[9px] tracking-wider">Detailed Explanation:</span>
                      <p className="text-zinc-600 leading-relaxed font-semibold">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // View: General Tests Center Lists
  return (
    <div id="test_section" className="space-y-6 font-sans">
      
      {/* Header title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Award className="w-6 h-6 text-zinc-900" />
          Academic Testing Center
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Simulate full-length entrance mock examinations and review detailed scorecard analytics.
        </p>
      </div>

      {/* Grid: Left: Available, Right: Taken */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Available Tests */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-geom-border p-6 shadow-geom">
            <h3 className="font-bold text-zinc-900 text-base mb-4 flex items-center gap-2.5 border-b border-geom-border pb-3">
              <FileText className="w-5 h-5 text-zinc-800" />
              Available Practice Mock Exams
            </h3>

            {tests.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 text-xs font-semibold bg-zinc-50 rounded-md border border-geom-border">
                No active exams have been loaded yet.
              </div>
            ) : (
              <div className="space-y-4">
                {tests.map(test => {
                  const attempted = attempts.find(a => a.testId === test.id);
                  return (
                    <div key={test.id} className="p-4 rounded-md border border-geom-border hover:border-zinc-350 transition-all bg-zinc-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-zinc-900 text-white font-bold text-[9px] rounded-sm uppercase tracking-wider border border-zinc-800">
                            {test.type}
                          </span>
                          <span className="text-xs text-zinc-400 font-semibold">• {test.duration} minutes • {test.totalMarks} Marks</span>
                          {attempted && (
                            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-800 border border-geom-border font-bold text-[9px] rounded-sm uppercase">
                              Score: {attempted.percentage}%
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-zinc-900 text-sm">{test.title}</h4>
                        <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2">{test.description}</p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2.5">
                        {attempted ? (
                          <button
                            onClick={() => handleOpenAttemptReview(attempted, test)}
                            className="py-1.5 px-3.5 rounded-sm text-xs font-bold border border-geom-border bg-white hover:bg-zinc-50 text-zinc-700 cursor-pointer transition-all shadow-geom-sm"
                          >
                            Review Report
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartTest(test)}
                            className="py-1.5 px-3.5 rounded-sm text-xs font-bold bg-zinc-900 hover:bg-zinc-850 text-white flex items-center gap-1 cursor-pointer transition-all border border-zinc-800"
                          >
                            <Play className="w-3 h-3 fill-white" /> Start Mock
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Your Scorecards */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-geom-border p-6 shadow-geom">
            <h3 className="font-bold text-zinc-900 text-base mb-4 flex items-center gap-2 border-b border-geom-border pb-3">
              <CheckCircle className="w-5 h-5 text-zinc-800" />
              Completed Scorecards
            </h3>

            {attempts.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 text-xs font-semibold bg-zinc-50 rounded-md border border-geom-border">
                No mock exam records completed yet. Take your first exam to see visual stats!
              </div>
            ) : (
              <div className="space-y-3">
                {attempts.map(attempt => {
                  const test = tests.find(t => t.id === attempt.testId);
                  if (!test) return null;

                  return (
                    <div 
                      key={attempt.id}
                      onClick={() => handleOpenAttemptReview(attempt, test)}
                      className="p-3.5 rounded-md border border-geom-border hover:border-zinc-350 transition-all bg-white shadow-geom-sm flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="font-bold text-zinc-800 text-xs leading-tight line-clamp-1 group-hover:text-zinc-950 transition-colors">
                          {test.title}
                        </h4>
                        <span className="text-[9px] text-zinc-400 block font-mono font-bold uppercase tracking-wider">
                          {new Date(attempt.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="block font-mono font-extrabold text-zinc-900 text-xs">
                          {attempt.percentage}%
                        </span>
                        <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-extrabold block">
                          Accuracy: {attempt.accuracy}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
