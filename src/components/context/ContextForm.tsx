import { useMemo } from 'react';
import type { ProjectContextFormState } from '@/lib/validation/projectBrief';
import { validateField, isFieldValid } from '@/lib/validation/projectBrief';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { ValidatedTextarea } from '@/components/ui/ValidatedTextarea';

interface ContextFormProps {
  value: ProjectContextFormState;
  onChange: (value: ProjectContextFormState) => void;
  errors?: Record<string, string>;
  /** Field errors from real-time validation */
  fieldErrors?: Record<string, string | null>;
  /** Called when a field's validation state changes */
  onFieldValidate?: (fieldName: string, error: string | null) => void;
}

const splitLines = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const joinLines = (values?: string[]) => (values && values.length > 0 ? values.join('\n') : '');

export function ContextForm({ 
  value, 
  onChange, 
  errors = {},
  fieldErrors = {},
  onFieldValidate 
}: ContextFormProps) {
  // Compute validity for each field
  const fieldValidity = useMemo(() => ({
    'audience.primary': isFieldValid('audience.primary', value.audience.primary),
    'brand.voiceGuidelines': isFieldValid('brand.voiceGuidelines', value.brand.voiceGuidelines),
    'success.definitionOfDone': isFieldValid('success.definitionOfDone', value.success.definitionOfDone),
    'guardrails.mustAvoid': isFieldValid('guardrails.mustAvoid', value.guardrails.mustAvoid),
  }), [value]);

  const handleFieldChange = (fieldName: string, fieldValue: string | string[]) => {
    // Validate on change
    if (onFieldValidate) {
      const error = validateField(fieldName, fieldValue);
      onFieldValidate(fieldName, error);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <SectionHeader title="Audience" meta="Who this work is for." className="mt-0" />
        <div className="space-y-3">
          <ValidatedInput
            label="Primary audience"
            required
            value={value.audience.primary}
            onChange={(newValue) => {
              onChange({ ...value, audience: { ...value.audience, primary: newValue } });
              handleFieldChange('audience.primary', newValue);
            }}
            error={fieldErrors['audience.primary'] || errors.audience}
            isValid={fieldValidity['audience.primary']}
          />
          <div className="grid grid-cols-2 gap-3">
            <ValidatedInput
              label="Segment"
              value={value.audience.context?.segment || ''}
              onChange={(newValue) =>
                onChange({
                  ...value,
                  audience: {
                    ...value.audience,
                    context: { ...value.audience.context, segment: newValue },
                  },
                })
              }
            />
            <ValidatedInput
              label="Sophistication"
              value={value.audience.context?.sophistication || ''}
              onChange={(newValue) =>
                onChange({
                  ...value,
                  audience: {
                    ...value.audience,
                    context: { ...value.audience.context, sophistication: newValue },
                  },
                })
              }
            />
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Brand voice" meta="Tone, style, and constraints." />
        <ValidatedTextarea
          label="Voice guidelines"
          required
          value={value.brand.voiceGuidelines || ''}
          onChange={(newValue) => {
            onChange({
              ...value,
              brand: { ...value.brand, voiceGuidelines: newValue },
            });
            handleFieldChange('brand.voiceGuidelines', newValue);
          }}
          error={fieldErrors['brand.voiceGuidelines'] || errors.brand}
          isValid={fieldValidity['brand.voiceGuidelines']}
          className="min-h-[120px]"
        />
      </section>

      <section>
        <SectionHeader title="Success criteria" meta="Definition of done." />
        <ValidatedTextarea
          label="Key outcomes (one per line)"
          required
          value={joinLines(value.success.definitionOfDone)}
          onChange={(newValue) => {
            const items = splitLines(newValue);
            onChange({
              ...value,
              success: { ...value.success, definitionOfDone: items },
            });
            handleFieldChange('success.definitionOfDone', items);
          }}
          error={fieldErrors['success.definitionOfDone'] || errors.success}
          isValid={fieldValidity['success.definitionOfDone']}
          className="min-h-[120px]"
          helperText="Enter each criterion on a new line"
        />
      </section>

      <section>
        <SectionHeader title="Guardrails" meta="Constraints and exclusions." />
        <div className="space-y-4">
          <ValidatedTextarea
            label="Must avoid (one per line)"
            required
            value={joinLines(value.guardrails.mustAvoid)}
            onChange={(newValue) => {
              const items = splitLines(newValue);
              onChange({
                ...value,
                guardrails: { ...value.guardrails, mustAvoid: items },
              });
              handleFieldChange('guardrails.mustAvoid', items);
            }}
            error={fieldErrors['guardrails.mustAvoid'] || errors.guardrails}
            isValid={fieldValidity['guardrails.mustAvoid']}
            className="min-h-[100px]"
          />
          <ValidatedTextarea
            label="Competitors (optional)"
            value={joinLines(value.guardrails.competitors)}
            onChange={(newValue) =>
              onChange({
                ...value,
                guardrails: { ...value.guardrails, competitors: splitLines(newValue) },
              })
            }
            className="min-h-[80px]"
          />
        </div>
      </section>
    </div>
  );
}
