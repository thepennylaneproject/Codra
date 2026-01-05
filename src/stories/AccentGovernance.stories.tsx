import type { Meta, StoryObj } from '@storybook/react-vite';
import { Check, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * ACCENT COLOR GOVERNANCE SHOWCASE
 * 
 * This story documents and demonstrates the strict governance rules
 * for coral accent color usage in Codra.
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
        <h1 className="text-xl font-semibold tracking-tight mb-4">Permitted Accent Uses</h1>
        <p className="text-base text-text-secondary">
          These are the <strong>ONLY</strong> scenarios where coral accent is permitted.
        </p>
      </div>

      {/* 1. Primary CTA */}
      <Section
        title="1. Primary CTA Button"
        description="The ONE action you want users to take on a screen. Maximum one per viewport."
      >
        <Button className="px-8 py-4 bg-zinc-600 hover:bg-[#FF5252] text-white rounded-2xl font-semibold text-xs transition-all shadow-xl">
          Start Project
        </Button>
        <p className="text-sm text-text-soft mt-4 italic">
          ✅ Coral background on the ONE primary action
        </p>
      </Section>

      {/* 2. Active Tab */}
      <Section
        title="2. Active Tab Indicator"
        description="2px coral underline on the currently active tab only."
      >
        <div className="inline-flex gap-6 border-b border-[#1A1A1A]/10 pb-4">
          <Button className="text-sm font-semibold text-text-primary border-b-2 border-zinc-400 pb-4 -mb-4">
            Write
          </Button>
          <Button className="text-sm font-medium text-text-soft pb-4 -mb-4 hover:text-text-primary">
            Research
          </Button>
          <Button className="text-sm font-medium text-text-soft pb-4 -mb-4 hover:text-text-primary">
            Revise
          </Button>
        </div>
        <p className="text-sm text-text-soft mt-4 italic">
          ✅ 2px coral bottom border on active tab
        </p>
      </Section>

      {/* 3. Progress Indicator */}
      <Section
        title="3. Progress Indicator (Active)"
        description="Coral dot or spinner when a task is actively executing."
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-zinc-600 animate-pulse" />
          <span className="text-sm font-medium">Generating content...</span>
        </div>
        <p className="text-sm text-text-soft mt-4 italic">
          ✅ Pulsing coral dot during execution
        </p>
      </Section>

      {/* 4. Success State */}
      <Section
        title="4. Success State"
        description="Coral checkmark or border on successful completion."
      >
        <div className="p-4 border border-zinc-300/60 bg-zinc-200/40 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-600 flex items-center justify-center">
            <Check size={16} strokeWidth={3} className="text-white" />
          </div>
          <span className="text-sm font-medium">Export completed successfully</span>
        </div>
        <p className="text-sm text-text-soft mt-4 italic">
          ✅ Coral checkmark and subtle border on success
        </p>
      </Section>

      {/* 5. Selected Output */}
      <Section
        title="5. Selected Output Item"
        description="2px coral left border on the currently selected output."
      >
        <div className="space-y-2">
          <div className="p-4 bg-white rounded-xl border-l-2 border-zinc-400 shadow-sm">
            <p className="text-sm font-semibold">Brand Strategy v2.3</p>
            <p className="text-xs text-text-soft">Selected output</p>
          </div>
          <div className="p-4 bg-white rounded-xl border-l-2 border-transparent hover:border-[#1A1A1A]/10">
            <p className="text-sm font-medium text-text-secondary">Brand Strategy v2.2</p>
            <p className="text-xs text-text-soft">Previous version</p>
          </div>
        </div>
        <p className="text-sm text-text-soft mt-4 italic">
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
          className="px-4 py-3 bg-white border border-[#1A1A1A]/10 rounded-xl focus:outline-none focus:border-zinc-400 transition-all w-full max-w-md"
        />
        <p className="text-sm text-text-soft mt-4 italic">
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
        <h1 className="text-xl font-semibold tracking-tight mb-4">Prohibited Accent Uses</h1>
        <p className="text-base text-text-secondary">
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
            <p className="text-xs font-semibold text-state-error mb-3">❌ WRONG</p>
            <span className="bg-zinc-600 text-white text-xs font-semibold px-4 py-1 rounded-full shadow-lg">
              MOST POPULAR
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-state-success mb-3">✅ CORRECT</p>
            <span className="border border-white/20 bg-white/5 text-text-primary/80 text-xs font-semibold px-4 py-1 rounded-full">
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
            <p className="text-xs font-semibold text-state-error mb-3">❌ WRONG</p>
            <div className="flex gap-3">
              <Button className="px-6 py-3 bg-zinc-600 text-white rounded-xl font-semibold text-sm">
                Save Draft
              </Button>
              <Button className="px-6 py-3 bg-zinc-600 text-white rounded-xl font-semibold text-sm">
                Publish Now
              </Button>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-state-success mb-3">✅ CORRECT</p>
            <div className="flex gap-3">
              <Button className="px-6 py-3 bg-white border border-[#1A1A1A]/10 text-text-primary rounded-xl font-semibold text-sm hover:border-[#1A1A1A]/20">
                Save Draft
              </Button>
              <Button className="px-6 py-3 bg-zinc-600 text-white rounded-xl font-semibold text-sm">
                Publish Now
              </Button>
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
            <p className="text-xs font-semibold text-state-error mb-3">❌ WRONG</p>
            <Button className="p-3 bg-white border border-[#1A1A1A]/5 rounded-xl hover:bg-zinc-600 hover:text-white transition-all">
              ← Back
            </Button>
          </div>
          <div>
            <p className="text-xs font-semibold text-state-success mb-3">✅ CORRECT</p>
            <Button className="p-3 bg-white border border-[#1A1A1A]/5 rounded-xl hover:opacity-70 transition-opacity">
              ← Back
            </Button>
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
            <p className="text-xs font-semibold text-state-error mb-3">❌ WRONG</p>
            <div className="flex gap-6">
              <Zap size={32} className="text-zinc-500" />
              <Sparkles size={32} className="text-zinc-500" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-state-success mb-3">✅ CORRECT</p>
            <div className="flex gap-6">
              <Zap size={32} className="text-text-primary/60" />
              <Sparkles size={32} className="text-text-primary/60" />
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
            <p className="text-xs font-semibold text-state-error mb-3">❌ WRONG</p>
            <div className="flex items-center gap-3">
              <div className="p-0 rounded-full bg-zinc-200/50">
                <Check size={12} strokeWidth={4} className="text-zinc-500" />
              </div>
              <span className="text-sm">Unlimited projects</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-state-success mb-3">✅ CORRECT</p>
            <div className="flex items-center gap-3">
              <div className="p-0 rounded-full bg-[#10B981]/10">
                <Check size={12} strokeWidth={4} className="text-state-success" />
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
            <p className="text-xs font-semibold text-state-error mb-3">❌ WRONG</p>
            <div className="p-6 bg-white rounded-2xl border border-[#1A1A1A]/5">
              <h3 className="text-xl font-semibold hover:text-zinc-500 transition-colors cursor-pointer">
                Product Launch Strategy
              </h3>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-state-success mb-3">✅ CORRECT</p>
            <div className="p-6 bg-white rounded-2xl border border-[#1A1A1A]/5 hover:border-[#1A1A1A]/20 transition-colors cursor-pointer">
              <h3 className="text-xl font-semibold">
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
          <h1 className="text-xl font-semibold tracking-tight mb-4">Violation Dashboard</h1>
          <p className="text-base text-text-secondary">
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
            <h2 className="text-base font-semibold">Active Violations</h2>
          </div>
          <div className="divide-y divide-[#1A1A1A]/5">
            {violations.map((violation, idx) => (
              <div key={idx} className="px-6 py-4 flex items-start gap-4 hover:bg-[#1A1A1A]/5 transition-colors">
                <SeverityBadge severity={violation.severity} />
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">
                    {violation.file}:{violation.line}
                  </p>
                  <p className="text-sm text-text-secondary">{violation.issue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Target State */}
        <div className="mt-12 p-8 bg-[#10B981]/10 border border-[#10B981]/20 rounded-2xl">
          <h3 className="text-xl font-semibold mb-2">Target State</h3>
          <p className="text-base text-text-secondary">
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
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-sm text-text-secondary">{description}</p>
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
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-sm text-text-secondary">{description}</p>
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
      <p className="text-xs font-semibold text-text-soft mb-2">{label}</p>
      <p className={`text-xl font-semibold ${textColor}`}>{value}</p>
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
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[severity]}`}>
      {severity}
    </span>
  );
}
