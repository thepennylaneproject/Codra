import fs from 'fs';
import path from 'path';

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { describe, it } from 'vitest';

describe('build-deploy-auditor output', () => {
  const schemaPath = path.resolve(__dirname, '..', 'schema', 'audit-output.schema.json');
  const reportPath = path.resolve(__dirname, '..', 'runs', '2026-03-06', 'deploy_audit_report.json');

  it('matches the LYRA audit-output schema v1.1.0', () => {
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const valid = validate(report);

    if (!valid) {
      const messages = (validate.errors ?? []).map((err) => `${err.instancePath} ${err.message}`);
      throw new Error(`Schema validation failed:\n${messages.join('\n')}`);
    }
  });
});
