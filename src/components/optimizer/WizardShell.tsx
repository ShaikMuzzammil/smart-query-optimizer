'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import type { OptimizeRequest, WizardStep } from '../../types';
import { useOptimizer } from '../../hooks';
import StepOne           from './StepOne';
import StepTwo           from './StepTwo';
import StepThree         from './StepThree';
import OptimizationLoader from './OptimizationLoader';

const STEPS = [
  { num: 1 as WizardStep, label: 'Configure',  icon: '📝' },
  { num: 2 as WizardStep, label: 'Confirm',    icon: '🚀' },
  { num: 3 as WizardStep, label: 'Results',    icon: '⚡' },
];

export default function WizardShell() {
  const [step, setStep]       = useState<WizardStep>(1);
  const [formData, setFormData] = useState<Partial<OptimizeRequest>>({});
  const { optimize, loading, error, result, reset } = useOptimizer();

  const handleStep1 = useCallback((data: Partial<OptimizeRequest>) => {
    setFormData(data);
    setStep(2);
  }, []);

  const handleStep2 = useCallback(async (opts: OptimizeRequest['options']) => {
    const payload: OptimizeRequest = {
      query:            formData.query || '',
      naturalLanguage:  formData.naturalLanguage,
      dbType:           formData.dbType || 'postgresql',
      dbVersion:        formData.dbVersion,
      optimizationGoal: formData.optimizationGoal || 'balanced',
      schema:           formData.schema,
      options:          opts,
    };
    setStep(3);
    await optimize(payload);
  }, [formData, optimize]);

  const handleReset = useCallback(() => {
    reset();
    setFormData({});
    setStep(1);
  }, [reset]);

  const stepVariants = {
    enter:  (dir: number) => ({ opacity: 0, x: dir > 0 ?  40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit:   (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 :  40 }),
  };

  const showLoader = step === 3 && loading;
  const showResult = step === 3 && !loading && result;
  const showError  = step === 3 && !loading && error;

  return (
    <div className="max-w-3xl mx-auto">

      {/* Progress bar header */}
      <div className="mb-10">
        <div className="flex items-center justify-between relative">
          {/* Connector lines */}
          <div className="absolute left-0 right-0 top-5 h-0.5 bg-[rgba(0,212,255,0.08)] mx-16 z-0" />
          <div
            className="absolute left-0 top-5 h-0.5 z-0 mx-16 transition-all duration-700"
            style={{
              right: step === 1 ? '100%' : step === 2 ? '50%' : '0%',
              background: 'linear-gradient(90deg, #00d4ff, #0080ff)',
              boxShadow: '0 0 8px rgba(0,212,255,0.5)',
            }}
          />

          {STEPS.map((s, i) => {
            const isDone    = step > s.num;
            const isActive  = step === s.num;
            const isPending = step < s.num;

            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
                <motion.div
                  animate={{
                    background: isDone   ? '#00ff88' :
                                isActive ? 'linear-gradient(135deg, #00d4ff, #0080ff)' :
                                           'rgba(255,255,255,0.06)',
                    boxShadow: isActive  ? '0 0 20px rgba(0,212,255,0.5)' : 'none',
                  }}
                  transition={{ duration: 0.4 }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ color: isPending ? '#445566' : '#000' }}
                >
                  {isDone ? '✓' : s.icon}
                </motion.div>
                <span className={`text-xs font-semibold transition-colors ${
                  isActive  ? 'text-[#00d4ff]' :
                  isDone    ? 'text-[#00ff88]'  :
                              'text-[#445566]'
                }`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card wrapper */}
      <div className="relative cyber-card glass-card rounded-2xl overflow-hidden">
        {/* Top accent line */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent opacity-30" />

        <div className="p-6 md:p-10">
          <AnimatePresence mode="wait" custom={step}>
            {/* ── Step 1 ── */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={1}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-7">
                  <h2 className="text-2xl font-display font-bold text-white mb-1">
                    Configure Your Query
                  </h2>
                  <p className="text-[#8899bb] text-sm">
                    Enter your SQL or describe it in plain English. Provide optional schema for more accurate results.
                  </p>
                </div>
                <StepOne onNext={handleStep1} initialData={formData} />
              </motion.div>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={1}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-7">
                  <h2 className="text-2xl font-display font-bold text-white mb-1">
                    Confirm & Launch
                  </h2>
                  <p className="text-[#8899bb] text-sm">
                    Review your settings and fine-tune AI options before launching.
                  </p>
                </div>
                <StepTwo
                  data={formData}
                  onBack={() => setStep(1)}
                  onLaunch={handleStep2}
                />
              </motion.div>
            )}

            {/* ── Step 3: Loading ── */}
            {showLoader && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{   opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <OptimizationLoader dbType={formData.dbType} />
              </motion.div>
            )}

            {/* ── Step 3: Result ── */}
            {showResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0  }}
                exit={{   opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-7">
                  <h2 className="text-2xl font-display font-bold text-white mb-1">
                    Optimization Results
                  </h2>
                  <p className="text-[#8899bb] text-sm">
                    Review the optimized query, performance metrics, and index recommendations.
                  </p>
                </div>
                <StepThree result={result!} onReset={handleReset} />
              </motion.div>
            )}

            {/* ── Step 3: Error ── */}
            {showError && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1   }}
                className="text-center py-10"
              >
                <div className="text-5xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-white mb-3">Optimization Failed</h3>
                <p className="text-[#8899bb] text-sm mb-6 max-w-md mx-auto">{error}</p>
                <div className="flex gap-3 justify-center">
                  <motion.button
                    onClick={() => setStep(2)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-secondary px-6 py-3 text-sm"
                  >
                    Go Back
                  </motion.button>
                  <motion.button
                    onClick={handleReset}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-primary px-6 py-3 text-sm"
                  >
                    Start Over
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
