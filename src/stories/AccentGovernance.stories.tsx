import type { Meta, StoryObj } from '@storybook/react';
import { Check, Sparkles, Zap } from 'lucide-react';

/**
 * ACCENT COLOR GOVERNANCE SHOWCASE
 * 
 * This story documents and demonstrates the strict governance rules
 * for coral accent color (#FF6B6B) usage in Codra.
 * 
 * **GOVERNANCE PRINCIPLE:**
 * Coral should be reserved ONLY for primary actions and active states.
 * Overuse dilutes its power as a call-to-action signal.
 */

const meta: Meta = {
  title: 'Design System/Accent Governance',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// ============================================================================
// PERMITTED USES - These are the ONLY acceptable uses of coral accent
// ============================================================================

export const PermittedUses: Story = {
  render: () => (
    <div className="max-w-6xl mx-auto p-8 space-y-12 bg-[#FFFAF0]">
      <div className="mb-12">
        <h1 className="text-4xl font-black tracking-tight mb-4">Permitted Accent Uses</h1>
        <p className="text-lg text-[#5A5A5A]">
          These are the <strong>ONLY</strong> scenarios where coral accent (#FF6B6B, var(--color-accent)) is permitted.
        </p>
      </div>

      {/* 1. Primary CTA */}
      <Section
        title="1. Primary CTA Button"
        description="The ONE action you want users to take on a screen. Maximum one per viewport."
      >
        <button className="px-8 py-4 bg-[#FF4D4D] hover:bg-[#FF5252] text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl">
          Start Project
        </button>
        <p className="text-sm text-[#8A8A8A] mt-4 italic">
          ✅ Coral background on the ONE primary action
        </p>
      </Section>

      {/* 2. Active Tab */}
      <Section
        title="2. Active Tab Indicator"
        description="2px coral underline on the currently active tab only."
      >
        <div className="inline-flex gap-6 border-b border-[#1A1A1A]/10 pb-4">
          <button className="text-sm font-bold text-[#1A1A1A] border-b-2 border-[#FF4D4D] pb-4 -mb-4">
            Write
          </button>
          <button className="text-sm font-medium text-[#8A8A8A] pb-4 -mb-4 hover:text-[#1A1A1A]">
            Research
          </button>
          <button className="text-sm font-medium text-[#8A8A8A] pb-4 -mb-4 hover:text-[#1A1A1A]">
            Revise
          </button>
        </div>
        <p className="text-sm text-[#8A8A8A] mt-4 italic">
          ✅ 2px coral bottom border on active tab
        </p>
      </Section>

      {/* 3. Progress Indicator */}
      <Section
        title="3. Progress Indicator (Active)"
        description="Coral dot or spinner when a task is actively executing."
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#FF4D4D] animate-pulse" />
          <span className="text-sm font-medium">Generating content...</span>
        </div>
        <p className="text-sm text-[#8A8A8A] mt-4 italic">
          ✅ Pulsing coral dot during execution
        </p>
      </Section>

      {/* 4. Success State */}
      <Section
        title="4. Success State"
        description="Coral checkmark or border on successful completion."
      >
        <div className="p-4 border border-[#FF4D4D]/30 bg-[#FF4D4D]/5 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FF4D4D] flex items-center justify-center">
            <Check size={16} strokeWidth={3} className="text-white" />
          </div>
          <span className="text-sm font-medium">Export completed successfully</span>
        </div>
        <p className="text-sm text-[#8A8A8A] mt-4 italic">
          ✅ Coral checkmark and subtle border on success
        </p>
      </Section>

      {/* 5. Selected Output */}
      <Section
        title="5. Selected Output Item"
        description="2px coral left border on the currently selected output."
      >
        <div className="space-y-2">
          <div className="p-4 bg-white rounded-xl border-l-2 border-[#FF4D4D] shadow-sm">
            <p className="text-sm font-bold">Brand Strategy v2.3</p>
            <p className="text-xs text-[#8A8A8A]">Selected output</p>
          </div>
          <div className="p-4 bg-white rounded-xl border-l-2 border-transparent hover:border-[#1A1A1A]/10">
            <p className="text-sm font-medium text-[#5A5A5A]">Brand Strategy v2.2</p>
            <p className="text-xs text-[#8A8A8A]">Previous version</p>
          </div>
        </div>
        <p className="text-sm text-[#8A8A8A] mt-4 italic">
          ✅ 2px coral left border on selected item only
        </p>
      </Section>

      {/* 6. Focus States (User Feedback) */}
      <Section
        title="6. Focus States (User Feedback)"
        description="Coral border on focused inputs to signal active interaction."
      >
        <input
          type="text"
          placeholder="Search blueprints..."
          className="px-4 py-3 bg-white border border-[#1A1A1A]/10 rounded-xl focus:outline-none focus:border-[#FF4D4D] transition-all w-full max-w-md"
        />
        <p className="text-sm text-[#8A8A8A] mt-4 italic">
          ✅ Coral border on focus for immediate feedback
        </p>
      </Section>
    </div>
  ),
};

// ============================================================================
// PROHIBITED USES - Common violations and their correct alternatives
// ============================================================================

export const ProhibitedUses: Story = {
  render: () => (
    <div className="max-w-6xl mx-auto p-8 space-y-12 bg-[#FFFAF0]">
      <div className="mb-12">
        <h1 className="text-4xl font-black tracking-tight mb-4">Prohibited Accent Uses</h1>
        <p className="text-lg text-[#5A5A5A]">
          Common violations and their <strong>correct alternatives</strong>.
        </p>
      </div>

      {/* 1. Decorative Badges */}
      <ComparisonSection
        title="❌ Decorative Badges"
        description="Popular/Recommended badges should NOT use coral - they're informational, not actionable."
      >
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#EF4444] mb-3">❌ WRONG</p>
            <span className="bg-[#FF4D4D] text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg">
              MOST POPULAR
            </span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#10B981] mb-3">✅ CORRECT</p>
            <span className="border border-white/20 bg-white/5 text-[#1A1A1A]/80 text-xs font-black px-4 py-1.5 rounded-full">
              MOST POPULAR
            </span>
          </div>
        </div>
      </ComparisonSection>

      {/* 2. Multiple CTAs */}
      <ComparisonSection
        title="❌ Multiple Primary CTAs"
        description="Only ONE coral CTA per viewport. Use secondary styles for other actions."
      >
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#EF4444] mb-3">❌ WRONG</p>
            <div className="flex gap-3">
              <button className="px-6 py-3 bg-[#FF4D4D] text-white rounded-xl font-bold text-sm">
                Save Draft
              </button>
              <button className="px-6 py-3 bg-[#FF4D4D] text-white rounded-xl font-bold text-sm">
                Publish Now
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#10B981] mb-3">✅ CORRECT</p>
            <div className="flex gap-3">
              <button className="px-6 py-3 bg-white border border-[#1A1A1A]/10 text-[#1A1A1A] rounded-xl font-bold text-sm hover:border-[#1A1A1A]/20">
                Save Draft
              </button>
              <button className="px-6 py-3 bg-[#FF4D4D] text-white rounded-xl font-bold text-sm">
                Publish Now
              </button>
            </div>
          </div>
        </div>
      </ComparisonSection>

      {/* 3. Navigation/Chrome */}
      <ComparisonSection
        title="❌ Navigation Chrome"
        description="Back buttons, menu items, and navigation should NOT use coral on hover."
      >
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#EF4444] mb-3">❌ WRONG</p>
            <button className="p-3 bg-white border border-[#1A1A1A]/5 rounded-xl hover:bg-[#FF4D4D] hover:text-white transition-all">
              ← Back
            </button>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#10B981] mb-3">✅ CORRECT</p>
            <button className="p-3 bg-white border border-[#1A1A1A]/5 rounded-xl hover:opacity-70 transition-opacity">
              ← Back
            </button>
          </div>
        </div>
      </ComparisonSection>

      {/* 4. Decorative Icons */}
      <ComparisonSection
        title="❌ Decorative Icons"
        description="Icons in cards, value props, or decorative elements should NOT be coral."
      >
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#EF4444] mb-3">❌ WRONG</p>
            <div className="flex gap-6">
              <Zap size={32} className="text-[#FF4D4D]" />
              <Sparkles size={32} className="text-[#FF4D4D]" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#10B981] mb-3">✅ CORRECT</p>
            <div className="flex gap-6">
              <Zap size={32} className="text-[#1A1A1A]/60" />
              <Sparkles size={32} className="text-[#1A1A1A]/60" />
            </div>
          </div>
        </div>
      </ComparisonSection>

      {/* 5. Feature Checkmarks */}
      <ComparisonSection
        title="❌ Feature Checkmarks"
        description="Use green (success color) for checkmarks, NOT coral."
      >
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#EF4444] mb-3">❌ WRONG</p>
            <div className="flex items-center gap-3">
              <div className="p-0.5 rounded-full bg-[#FF4D4D]/10">
                <Check size={12} strokeWidth={4} className="text-[#FF4D4D]" />
              </div>
              <span className="text-sm">Unlimited projects</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#10B981] mb-3">✅ CORRECT</p>
            <div className="flex items-center gap-3">
              <div className="p-0.5 rounded-full bg-[#10B981]/10">
                <Check size={12} strokeWidth={4} className="text-[#10B981]" />
              </div>
              <span className="text-sm">Unlimited projects</span>
            </div>
          </div>
        </div>
      </ComparisonSection>

      {/* 6. Card Title Hovers */}
      <ComparisonSection
        title="❌ Card Title Hovers"
        description="Decorative hover effects should use opacity, not coral color changes."
      >
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#EF4444] mb-3">❌ WRONG</p>
            <div className="p-6 bg-white rounded-2xl border border-[#1A1A1A]/5">
              <h3 className="text-2xl font-black hover:text-[#FF4D4D] transition-colors cursor-pointer">
                Product Launch Strategy
              </h3>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#10B981] mb-3">✅ CORRECT</p>
            <div className="p-6 bg-white rounded-2xl border border-[#1A1A1A]/5 hover:border-[#1A1A1A]/20 transition-colors cursor-pointer">
              <h3 className="text-2xl font-black">
                Product Launch Strategy
              </h3>
            </div>
          </div>
        </div>
      </ComparisonSection>
    </div>
  ),
};

// ============================================================================
// VIOLATION SUMMARY - Current state of codebase
// ============================================================================

export const ViolationDashboard: Story = {
  render: () => {
    const violations: { file: string; line: number; issue: string; severity: 'high' | 'medium' | 'low' }[] = [
      { file: 'PricingPage.tsx', line: 171, issue: '"Most Popular" badge using coral background', severity: 'high' },
      { file: 'PricingPage.tsx', line: 75, issue: 'Discount badge using coral (should be green)', severity: 'high' },
      { file: 'PricingPage.tsx', line: 224, issue: 'Feature checkmarks using coral (should be green)', severity: 'medium' },
      { file: 'PricingPage.tsx', line: 213, issue: 'Non-primary CTA hover using coral', severity: 'medium' },
      { file: 'PricingPage.tsx', line: 177, issue: 'Decorative icons using coral', severity: 'low' },
      { file: 'BlueprintGalleryPage.tsx', line: 68, issue: 'Back button hover using coral', severity: 'medium' },
      { file: 'BlueprintGalleryPage.tsx', line: 157, issue: 'Card hover border using coral', severity: 'low' },
      { file: 'BlueprintGalleryPage.tsx', line: 179, issue: 'Card title hover using coral', severity: 'low' },
      { file: 'BlueprintGalleryPage.tsx', line: 198, issue: 'Secondary button using coral on hover', severity: 'medium' },
    ];

    const highCount = violations.filter(v => v.severity === 'high').length;
    const mediumCount = violations.filter(v => v.severity === 'medium').length;
    const lowCount = violations.filter(v => v.severity === 'low').length;

    return (
      <div className="max-w-6xl mx-auto p-8 bg-[#FFFAF0]">
        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tight mb-4">Violation Dashboard</h1>
          <p className="text-lg text-[#5A5A5A]">
            Current state of accent color governance violations in the codebase.
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          <MetricCard label="Total Violations" value={violations.length} color="red" />
          <MetricCard label="High Severity" value={highCount} color="red" />
          <MetricCard label="Medium Severity" value={mediumCount} color="amber" />
          <MetricCard label="Low Severity" value={lowCount} color="gray" />
        </div>

        {/* Violations List */}
        <div className="bg-white rounded-2xl border border-[#1A1A1A]/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1A1A1A]/5">
            <h2 className="text-lg font-black">Active Violations</h2>
          </div>
          <div className="divide-y divide-[#1A1A1A]/5">
            {violations.map((violation, idx) => (
              <div key={idx} className="px-6 py-4 flex items-start gap-4 hover:bg-[#1A1A1A]/5 transition-colors">
                <SeverityBadge severity={violation.severity} />
                <div className="flex-1">
                  <p className="font-bold text-sm mb-1">
                    {violation.file}:{violation.line}
                  </p>
                  <p className="text-sm text-[#5A5A5A]">{violation.issue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Target State */}
        <div className="mt-12 p-8 bg-[#10B981]/10 border border-[#10B981]/20 rounded-2xl">
          <h3 className="text-2xl font-black mb-2">🎯 Target State</h3>
          <p className="text-lg text-[#5A5A5A]">
            <strong>0 violations</strong> - All coral usage limited to permitted scenarios only
          </p>
        </div>
      </div>
    );
  },
};

// ============================================================================
// Helper Components
// ============================================================================

function Section({ title, description, children }: { 
  title: string; 
  description: string; 
  children: React.ReactNode;
}) {
  return (
    <div className="p-8 bg-white rounded-2xl border border-[#1A1A1A]/5">
      <div className="mb-6">
        <h2 className="text-2xl font-black mb-2">{title}</h2>
        <p className="text-sm text-[#5A5A5A]">{description}</p>
      </div>
      <div className="p-6 bg-[#FFFAF0] rounded-xl border border-[#1A1A1A]/5">
        {children}
      </div>
    </div>
  );
}

function ComparisonSection({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-8 bg-white rounded-2xl border border-[#1A1A1A]/5">
      <div className="mb-6">
        <h2 className="text-2xl font-black mb-2">{title}</h2>
        <p className="text-sm text-[#5A5A5A]">{description}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        {children}
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number; color: 'red' | 'amber' | 'gray' }) {
  const bgColor = color === 'red' ? 'bg-red-50' : color === 'amber' ? 'bg-amber-50' : 'bg-gray-50';
  const textColor = color === 'red' ? 'text-red-600' : color === 'amber' ? 'text-amber-600' : 'text-gray-600';
  const borderColor = color === 'red' ? 'border-red-100' : color === 'amber' ? 'border-amber-100' : 'border-gray-100';

  return (
    <div className={`p-6 rounded-xl border ${bgColor} ${borderColor}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-[#8A8A8A] mb-2">{label}</p>
      <p className={`text-4xl font-black ${textColor}`}>{value}</p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-red-50 text-red-600 border-red-100',
    medium: 'bg-amber-50 text-amber-600 border-amber-100',
    low: 'bg-gray-50 text-gray-600 border-gray-100',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[severity]}`}>
      {severity}
    </span>
  );
}
