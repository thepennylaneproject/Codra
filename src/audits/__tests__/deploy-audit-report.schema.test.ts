import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');
const schemaPath = path.join(root, 'audits/schema/audit-output.schema.json');
const deployReportPath = path.join(
  root,
  'audits/runs/2026-03-06/deploy_audit_report.json',
);

const loadJson = (filePath: string) =>
  JSON.parse(readFileSync(filePath, 'utf-8'));

describe('build-deploy-auditor output', () => {
  it('conforms to LYRA audit-output schema v1.1.0', () => {
    const schema = loadJson(schemaPath);
    const deployReport = loadJson(deployReportPath);

    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const isValid = validate(deployReport);

    if (!isValid) {
      // Log full validation errors to aid debugging on failure
      // eslint-disable-next-line no-console
      console.error(validate.errors);
    }

    expect(isValid).toBe(true);
  });
});
