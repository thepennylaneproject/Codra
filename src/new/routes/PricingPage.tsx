import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles, Zap, Shield, Globe } from 'lucide-react';
import { PRICING_PLANS, PricingPlan } from '../../domain/pricing';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { analytics } from '@/lib/analytics';

import { Heading, Text, Label } from '../../new/components';
import { Button } from '@/components/ui/Button';

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
    <div className="min-h-screen bg-[var(--ui-bg)] text-text-primary font-sans pb-12">
      {/* Header Section */}
      <header className="pt-12 pb-12 px-8 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <Label variant="muted" className="">
              Monetization Strategy
            </Label>
          </div>
          <Heading size="xl" className="leading-[0.85] mb-8">
            The Production <br />
            <span className="italic font-serif font-normal text-text-soft">Tiers</span>
          </Heading>
          <p className="text-xl text-text-secondary max-w-xl mx-auto font-medium leading-relaxed italic">
            &quot;Professional-grade AI execution, scaled to your production throughput.&quot;
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div 
          className="mt-12 inline-flex items-center p-1 bg-white border border-[var(--ui-border)] rounded-2xl shadow-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant={billingCycle === 'monthly' ? "primary" : "ghost"}
            onClick={() => setBillingCycle('monthly')}
            className="px-8"
            size="lg"
          >
            Monthly
          </Button>
          <Button
            variant={billingCycle === 'yearly' ? "primary" : "ghost"}
            onClick={() => setBillingCycle('yearly')}
            className="px-8 relative"
            size="lg"
          >
            Yearly
            <span className="absolute -top-3 -right-2 bg-emerald-500 text-white text-xs font-semibold px-2 py-0 rounded-full">
              Save 17%
            </span>
          </Button>
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
        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-[var(--ui-border)] pt-12">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[var(--ui-border)] flex items-center justify-center shadow-sm">
              <Zap size={24} className="text-text-soft" />
            </div>
            <Heading size="lg" className="tracking-tight">Real-Time Execution</Heading>
            <Text variant="muted" size="sm">
              No more mocked delays. Experience true streaming AI output across 50+ specialized desks.
            </Text>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[var(--ui-border)] flex items-center justify-center shadow-sm">
              <Shield size={24} className="text-text-soft" />
            </div>
            <Heading size="lg" className="tracking-tight">Enterprise Guardrails</Heading>
            <Text variant="muted" size="sm">
              Integrated budget management and role-based permissions to prevent AI hallucination and overspend.
            </Text>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[var(--ui-border)] flex items-center justify-center shadow-sm">
              <Globe size={24} className="text-text-soft" />
            </div>
            <Heading size="lg" className="tracking-tight">Context-Aware Memory</Heading>
            <Text variant="muted" size="sm">
              Your Project Brief gives every AI task context about your brand voice and project goals.
            </Text>
          </div>
        </section>
      </main>

      {/* Final CTA */}
      <section className="mt-12 px-8">
        <div className="max-w-5xl mx-auto bg-[var(--brand-ink)] rounded-[40px] p-12 text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full bg-zinc-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <Heading size="xl" className="text-white tracking-tighter mb-8 relative z-10">
            Full-scale production initiation<br />
          </Heading>
          <Button
            variant="secondary"
            className="px-12 py-8 relative z-10 flex items-center gap-4 mx-auto shadow-2xl hover:scale-105 active:scale-95"
            disabled
          >
            <div className="flex items-center gap-4">
              Unavailable
              <ArrowRight size={16} strokeWidth={3} />
            </div>
          </Button>
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
          ? "border-zinc-400 shadow-[0_32px_64px_-16px_rgba(255,107,107,0.15)] z-10 scale-105 hover:scale-[1.07]" 
          : "border-[var(--ui-border)] hover:border-[var(--brand-ink)]/20 hover:shadow-2xl hover:shadow-[var(--brand-ink)]/5"
      )}
    >
      {plan.highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 border border-white/20 bg-white/5 text-text-soft text-xs font-semibold px-6 py-1 rounded-full">
          Most popular
        </div>
      )}

      {/* Icon/Visual */}
      <div className="mb-8 text-brand-ink/60">
        {plan.id === 'free' && <Globe size={28} strokeWidth={2.5} className="opacity-40" />}
        {plan.id === 'starter' && <Zap size={28} strokeWidth={2.5} />}
        {plan.id === 'pro' && <Sparkles size={28} strokeWidth={2.5} />}
        {plan.id === 'agency' && <Shield size={28} strokeWidth={2.5} />}
      </div>

      <div className="mb-8">
        <Heading size="lg" className="tracking-tight mb-2">
          {plan.name}
        </Heading>
        <Label className="leading-relaxed">{plan.tagline}</Label>
      </div>
      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-semibold tracking-tighter leading-none">${price}</span>
          <Label variant="muted">/mo</Label>
        </div>
        {billingCycle === 'yearly' && plan.yearlyPrice && (
          <Label variant="muted" className="mt-2 block font-semibold">
            Billed ${plan.yearlyPrice}/year
          </Label>
        )}
      </div>

      <Button
        variant={plan.highlighted ? "primary" : "secondary"}
        onClick={() => {
          analytics.track('plan_cta_clicked', { planId: plan.id, billingCycle });
        }}
        className="w-full py-6 mb-8"
        size="lg"
      >
        {plan.cta}
      </Button>

      <div className="flex-1 space-y-6">
        <div className="h-[1px] bg-[var(--ui-border)] px-0" />
        <ul className="space-y-4">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="p-0 rounded-full bg-emerald-500/10 mt-0">
                <Check size={12} strokeWidth={4} className="text-emerald-500" />
              </div>
              <Text variant="muted" size="sm" className="font-medium leading-tight">
                {feature}
              </Text>
            </li>
          ))}
        </ul>
      </div>

      {/* Subtle Bottom Accent */}
      <div className="mt-8 pt-6 border-t border-[var(--ui-border)]">
        <Label variant="muted" className="font-semibold">
          {plan.limits.projects === 'unlimited' ? 'Unlimited' : `${plan.limits.projects} active`} Projects
        </Label>
      </div>
    </motion.div>
  );
}
