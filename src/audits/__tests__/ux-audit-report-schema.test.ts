import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';

import schema from '../../../audits/schema/audit-output.schema.json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('ux audit report', () => {
  it('conforms to the LYRA audit-output schema', () => {
    const uxReportPath = path.resolve(
      __dirname,
      '../../../audits/runs/2026-03-06/ux_audit_report.json',
    );
    const uxReport = JSON.parse(readFileSync(uxReportPath, 'utf-8'));

    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const valid = validate(uxReport);

    if (!valid) {
      // eslint-disable-next-line no-console
      console.error(validate.errors);
    }

    expect(valid).toBe(true);
    expect(validate.errors ?? []).toEqual([]);
  });
});
