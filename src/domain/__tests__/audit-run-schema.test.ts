import { describe, expect, it } from 'vitest';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../../');

function loadJson(relPath: string): unknown {
    return JSON.parse(readFileSync(resolve(ROOT, relPath), 'utf8'));
}

const schema = loadJson('audits/schema/audit-output.schema.json');
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema as object);

const AUDIT_RUN_FILES = [
    'audits/runs/2026-03-06/logic_audit_report.json',
    'audits/runs/2026-03-19/logic-20260319-211501.json',
    'audits/runs/2026-03-19/data-20260319-211500.json',
    'audits/runs/2026-03-19/security-20260319-211502.json',
    'audits/runs/2026-03-19/synthesized-20260319-211503.json',
];

describe('audit run output schema conformance', () => {
    for (const relPath of AUDIT_RUN_FILES) {
        it(`${relPath} conforms to audit-output.schema.json v1.1`, () => {
            const data = loadJson(relPath);
            const valid = validate(data);
            if (!valid) {
                const errors = (validate.errors ?? [])
                    .map(e => `  ${e.instancePath || '(root)'} ${e.message}`)
                    .join('\n');
                throw new Error(`Schema errors in ${relPath}:\n${errors}`);
            }
            expect(valid).toBe(true);
        });
    }

    it('logic_audit_report.json runtime-bug-hunter findings all have required v1.1 fields', () => {
        const data = loadJson('audits/runs/2026-03-06/logic_audit_report.json') as {
            findings: Array<Record<string, unknown>>;
        };
        for (const finding of data.findings) {
            expect(finding).toHaveProperty('finding_id');
            expect(finding).toHaveProperty('priority');
            expect(finding).toHaveProperty('proof_hooks');
            expect(finding).toHaveProperty('history');
            expect(finding).toHaveProperty('impact');
            expect(Array.isArray(finding.proof_hooks)).toBe(true);
            expect((finding.proof_hooks as unknown[]).length).toBeGreaterThanOrEqual(1);
            expect(Array.isArray(finding.history)).toBe(true);
            expect((finding.history as unknown[]).length).toBeGreaterThanOrEqual(1);
        }
    });
});
