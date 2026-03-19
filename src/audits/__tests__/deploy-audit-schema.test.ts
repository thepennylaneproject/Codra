import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../../..');
const schemaPath = path.resolve(rootDir, 'audits/schema/audit-output.schema.json');

const createValidator = () => {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
};

describe('LYRA audit artifacts', () => {
  const validate = createValidator();

  it('keeps build/deploy synthesizer output schema-aligned', () => {
    const payloadPath = path.resolve(
      rootDir,
      'audits/runs/2026-03-06/synthesizer_output.json',
    );
    const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));

    const valid = validate(payload);
    expect(validate.errors).toBeNull();
    expect(valid).toBe(true);
  });
});
