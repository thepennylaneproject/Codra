import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';

import auditOutputSchema from '../../../audits/schema/audit-output.schema.json';
import uxAuditReport from '../../../audits/runs/2026-03-06/ux_audit_report.json';

describe('ux audit report schema compliance', () => {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(auditOutputSchema);

  it('matches the LYRA audit-output schema', () => {
    const isValid = validate(uxAuditReport);

    if (!isValid && validate.errors) {
      console.error(validate.errors);
    }

    expect(isValid).toBe(true);
  });
});
