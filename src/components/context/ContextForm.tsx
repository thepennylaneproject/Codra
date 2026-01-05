import type { ProjectContextFormState } from '@/lib/validation/projectBrief';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface ContextFormProps {
  value: ProjectContextFormState;
  onChange: (value: ProjectContextFormState) => void;
  errors?: Record<string, string>;
}

const splitLines = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const joinLines = (values?: string[]) => (values && values.length > 0 ? values.join('\n') : '');

export function ContextForm({ value, onChange, errors = {} }: ContextFormProps) {
  return (
    <div className="space-y-6">
      <section>
        <SectionHeader title="Audience" meta="Who this work is for." className="mt-0" />
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-text-soft">Primary audience</label>
            <input
              type="text"
              value={value.audience.primary}
              onChange={(e) => onChange({ ...value, audience: { ...value.audience, primary: e.target.value } })}
              className="mt-2 w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 focus-standard"
            />
            {errors.audience && <p className="text-xs text-rose-500 mt-1">{errors.audience}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-soft">Segment</label>
              <input
                type="text"
                value={value.audience.context?.segment || ''}
                onChange={(e) =>
                  onChange({
                    ...value,
                    audience: {
                      ...value.audience,
                      context: { ...value.audience.context, segment: e.target.value },
                    },
                  })
                }
                className="mt-2 w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 focus-standard"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-soft">Sophistication</label>
              <input
                type="text"
                value={value.audience.context?.sophistication || ''}
                onChange={(e) =>
                  onChange({
                    ...value,
                    audience: {
                      ...value.audience,
                      context: { ...value.audience.context, sophistication: e.target.value },
                    },
                  })
                }
                className="mt-2 w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 focus-standard"
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Brand voice" meta="Tone, style, and constraints." />
        <div>
          <label className="text-xs font-semibold text-text-soft">Voice guidelines</label>
          <textarea
            value={value.brand.voiceGuidelines || ''}
            onChange={(e) =>
              onChange({
                ...value,
                brand: { ...value.brand, voiceGuidelines: e.target.value },
              })
            }
            className="mt-2 w-full min-h-[120px] px-3 py-2 text-sm rounded-lg border border-zinc-200 focus-standard"
          />
          {errors.brand && <p className="text-xs text-rose-500 mt-1">{errors.brand}</p>}
        </div>
      </section>

      <section>
        <SectionHeader title="Success criteria" meta="Definition of done." />
        <div>
          <label className="text-xs font-semibold text-text-soft">Key outcomes (one per line)</label>
          <textarea
            value={joinLines(value.success.definitionOfDone)}
            onChange={(e) =>
              onChange({
                ...value,
                success: { ...value.success, definitionOfDone: splitLines(e.target.value) },
              })
            }
            className="mt-2 w-full min-h-[120px] px-3 py-2 text-sm rounded-lg border border-zinc-200 focus-standard"
          />
          {errors.success && <p className="text-xs text-rose-500 mt-1">{errors.success}</p>}
        </div>
      </section>

      <section>
        <SectionHeader title="Guardrails" meta="Constraints and exclusions." />
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-soft">Must avoid (one per line)</label>
            <textarea
              value={joinLines(value.guardrails.mustAvoid)}
              onChange={(e) =>
                onChange({
                  ...value,
                  guardrails: { ...value.guardrails, mustAvoid: splitLines(e.target.value) },
                })
              }
              className="mt-2 w-full min-h-[100px] px-3 py-2 text-sm rounded-lg border border-zinc-200 focus-standard"
            />
            {errors.guardrails && <p className="text-xs text-rose-500 mt-1">{errors.guardrails}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-text-soft">Competitors (optional)</label>
            <textarea
              value={joinLines(value.guardrails.competitors)}
              onChange={(e) =>
                onChange({
                  ...value,
                  guardrails: { ...value.guardrails, competitors: splitLines(e.target.value) },
                })
              }
              className="mt-2 w-full min-h-[80px] px-3 py-2 text-sm rounded-lg border border-zinc-200 focus-standard"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
