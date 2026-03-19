import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('runtime-bug-hunter output', () => {
  it('conforms to the audit-output schema', () => {
    const schemaPath = join(__dirname, '..', 'schema', 'audit-output.schema.json');
    const reportPath = join(__dirname, '..', 'runs', '2026-03-06', 'logic_audit_report.json');

    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
    const report = JSON.parse(readFileSync(reportPath, 'utf-8'));

    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const isValid = validate(report);

    if (!isValid && validate.errors) {
      console.error(validate.errors);
    }

    expect(isValid).toBe(true);
  });
});
