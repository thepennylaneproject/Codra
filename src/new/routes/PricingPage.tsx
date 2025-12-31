import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles, Zap, Shield, Globe } from 'lucide-react';
import { PRICING_PLANS, PricingPlan } from '../../domain/pricing';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { analytics } from '../../lib/analytics';

/**
 * Utility for Tailwind class merging
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * PRICING PAGE
 * High-fidelity, editorial-style pricing layout.
 */
export function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    analytics.track('pricing_page_viewed');
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFAF0] text-[#1A1A1A] font-sans selection:bg-[#FF4D4D]/20 pb-32">
      {/* Header Section */}
      <header className="pt-32 pb-24 px-8 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF4D4D]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8A8A8A]">
              Monetization Strategy
            </span>
          </div>
          <h1 className="text-[80px] font-black tracking-tighter leading-[0.85] mb-8">
            The Production <br />
            <span className="italic font-serif font-light text-[#FF4D4D]">Tiers</span>
          </h1>
          <p className="text-xl text-[#5A5A5A] max-w-xl mx-auto font-medium leading-relaxed italic">
            "Professional-grade AI execution, scaled to your production throughput."
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div 
          className="mt-16 inline-flex items-center p-1 bg-white border border-[#1A1A1A]/5 rounded-2xl shadow-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              "px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
              billingCycle === 'monthly' ? "bg-[#1A1A1A] text-white shadow-xl" : "text-[#8A8A8A] hover:text-[#1A1A1A]"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={cn(
              "px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all relative",
              billingCycle === 'yearly' ? "bg-[#1A1A1A] text-white shadow-xl" : "text-[#8A8A8A] hover:text-[#1A1A1A]"
            )}
          >
            Yearly
            <span className="absolute -top-3 -right-2 bg-[#FF4D4D] text-white text-[8px] font-black px-2 py-0.5 rounded-full">
              -17%
            </span>
          </button>
        </motion.div>
      </header>

      {/* Pricing Grid */}
      <main className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_PLANS.map((plan, idx) => (
            <PricingCard 
              key={plan.id} 
              plan={plan} 
              billingCycle={billingCycle} 
              delay={idx * 0.1}
            />
          ))}
        </div>

        {/* Value Props Section */}
        <section className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-[#1A1A1A]/5 pt-24">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#1A1A1A]/5 flex items-center justify-center shadow-sm">
              <Zap size={24} className="text-[#FF4D4D]" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Real-Time Execution</h3>
            <p className="text-sm text-[#5A5A5A] leading-relaxed">
              No more mocked delays. Experience true streaming AI output across 50+ specialized desks.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#1A1A1A]/5 flex items-center justify-center shadow-sm">
              <Shield size={24} className="text-[#FF4D4D]" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Enterprise Guardrails</h3>
            <p className="text-sm text-[#5A5A5A] leading-relaxed">
              Integrated budget management and role-based permissions to prevent AI hallucination and overspend.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#1A1A1A]/5 flex items-center justify-center shadow-sm">
              <Globe size={24} className="text-[#FF4D4D]" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Context-Aware Memory</h3>
            <p className="text-sm text-[#5A5A5A] leading-relaxed">
              Your Project Brief gives every AI task context about your brand voice and project goals.
            </p>
          </div>
        </section>
      </main>

      {/* Final CTA */}
      <section className="mt-32 px-8">
        <div className="max-w-5xl mx-auto bg-[#1A1A1A] rounded-[40px] p-16 text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#FF4D4D]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-8 relative z-10">
            Ready to initiate <br />
            full-scale production?
          </h2>
          <button className="px-12 py-5 bg-white text-[#1A1A1A] rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#FF4D4D] hover:text-white transition-all transform hover:scale-105 active:scale-95 relative z-10 flex items-center gap-4 mx-auto shadow-2xl">
            Start Your Journey
            <ArrowRight size={16} strokeWidth={3} />
          </button>
        </div>
      </section>
    </div>
  );
}

function PricingCard({ 
  plan, 
  billingCycle,
  delay
}: { 
  plan: PricingPlan; 
  billingCycle: 'monthly' | 'yearly';
  delay: number;
}) {
  const price = billingCycle === 'yearly' && plan.yearlyPrice 
    ? Math.floor(plan.yearlyPrice / 12) 
    : plan.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={cn(
        "relative flex flex-col p-8 bg-white border transition-all duration-500 rounded-[32px] group",
        plan.highlighted 
          ? "border-[#FF4D4D] shadow-[0_32px_64px_-16px_rgba(255,77,77,0.15)] z-10 scale-105 hover:scale-[1.07]" 
          : "border-[#1A1A1A]/5 hover:border-[#1A1A1A]/20 hover:shadow-2xl hover:shadow-[#1A1A1A]/5"
      )}
    >
      {plan.highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF4D4D] text-white text-[10px] font-black px-6 py-1.5 rounded-full shadow-lg shadow-[#FF4D4D]/20">
          MOST POPULAR
        </div>
      )}

      {/* Icon/Visual */}
      <div className="mb-10 text-[#FF4D4D]">
        {plan.id === 'free' && <Globe size={28} strokeWidth={2.5} className="opacity-40" />}
        {plan.id === 'starter' && <Zap size={28} strokeWidth={2.5} />}
        {plan.id === 'pro' && <Sparkles size={28} strokeWidth={2.5} />}
        {plan.id === 'agency' && <Shield size={28} strokeWidth={2.5} />}
      </div>

      <div className="mb-8">
        <h3 className="text-2xl font-black tracking-tight mb-2 group-hover:text-[#FF4D4D] transition-colors">
          {plan.name}
        </h3>
        <p className="text-xs text-[#8A8A8A] font-bold uppercase tracking-widest leading-relaxed">
          {plan.tagline}
        </p>
      </div>

      <div className="mb-10">
        <div className="flex items-baseline gap-1">
          <span className="text-[56px] font-black tracking-tighter leading-none">${price}</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#8A8A8A]">/mo</span>
        </div>
        {billingCycle === 'yearly' && plan.yearlyPrice && (
          <p className="text-[10px] text-[#FF4D4D] font-black mt-2 uppercase tracking-widest">
            Billed ${plan.yearlyPrice}/year
          </p>
        )}
      </div>

      <button
        onClick={() => {
          analytics.track('plan_cta_clicked', { planId: plan.id, billingCycle });
        }}
        className={cn(
          "w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all transform active:scale-95 mb-10",
          plan.highlighted
            ? "bg-[#FF4D4D] text-white hover:bg-[#1A1A1A] shadow-xl shadow-[#FF4D4D]/20"
            : "bg-[#1A1A1A] text-white hover:bg-[#FF4D4D]"
        )}
      >
        {plan.cta}
      </button>

      <div className="flex-1 space-y-6">
        <div className="h-[1px] bg-[#1A1A1A]/5 px-0" />
        <ul className="space-y-4">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="p-0.5 rounded-full bg-[#FF4D4D]/10 mt-0.5">
                <Check size={12} strokeWidth={4} className="text-[#FF4D4D]" />
              </div>
              <span className="text-[13px] text-[#5A5A5A] font-medium leading-tight">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Subtle Bottom Accent */}
      <div className="mt-10 pt-6 border-t border-[#1A1A1A]/5">
        <p className="text-[9px] font-bold text-[#8A8A8A] uppercase tracking-widest">
          {plan.limits.projects === 'unlimited' ? 'Unlimited' : `${plan.limits.projects} active`} Projects
        </p>
      </div>
    </motion.div>
  );
}
