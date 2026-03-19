import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import schema from '../../../audits/schema/audit-output.schema.json';
import performanceReport from '../../../audits/runs/2026-03-06/perf_audit_report.json';
import { describe, expect, it } from 'vitest';

describe('performance-cost-auditor output', () => {
  it('conforms to the LYRA audit output schema', () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const isValid = validate(performanceReport);

    expect(isValid).toBe(true);
    expect(validate.errors).toBeNull();
  });
});
