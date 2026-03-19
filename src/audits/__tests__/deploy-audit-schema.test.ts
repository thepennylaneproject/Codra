import { describe, expect, it } from 'vitest';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import path from 'path';

const loadJson = (relativePath: string) =>
  JSON.parse(readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8'));

describe('build-deploy-auditor output', () => {
  it('conforms to LYRA audit-output schema v1.1', () => {
    const schema = loadJson('audits/schema/audit-output.schema.json');
    const deployReport = loadJson('audits/runs/2026-03-06/deploy_audit_report.json');

    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const valid = validate(deployReport);

    if (!valid && validate.errors) {
      console.error(validate.errors);
    }

    expect(valid).toBe(true);
  });
});
