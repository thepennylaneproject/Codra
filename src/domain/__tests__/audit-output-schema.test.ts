import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = resolve(__dirname, '../../../');
const SCHEMA_PATH = resolve(REPO_ROOT, 'audits/schema/audit-output.schema.json');
const RUNS_DIR = resolve(REPO_ROOT, 'audits/runs');

function loadJson(filePath: string): unknown {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
}

function makeValidator() {
    const ajv = new Ajv({ strict: false });
    addFormats(ajv);
    const schema = loadJson(SCHEMA_PATH);
    return ajv.compile(schema as object);
}

/**
 * Return all JSON files from the most recent run directory.
 * Only the newest run is validated to avoid failing on legacy pre-v1.1 files from earlier runs
 * that used an older finding format.
 */
function collectMostRecentRunFiles(): string[] {
    const runDirs = readdirSync(RUNS_DIR)
        .map((name) => join(RUNS_DIR, name))
        .filter((p) => statSync(p).isDirectory())
        .sort(); // ISO-date-prefixed dirs sort correctly lexicographically

    if (runDirs.length === 0) return [];

    const latestDir = runDirs[runDirs.length - 1];
    return readdirSync(latestDir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => join(latestDir, f));
}

describe('LYRA audit output schema — coverage field enforcement (SYNTH-DEBT-001)', () => {
    const validate = makeValidator();

    it('schema requires coverage as a top-level field', () => {
        const schema = loadJson(SCHEMA_PATH) as { required: string[] };
        expect(schema.required).toContain('coverage');
    });

    it('deploy audit report (build-deploy-auditor) is schema-valid and includes coverage', () => {
        const report = loadJson(
            resolve(REPO_ROOT, 'audits/runs/2026-03-06/deploy_audit_report.json'),
        ) as Record<string, unknown>;

        const valid = validate(report);
        if (!valid) {
            // Surface the first validation error to aid debugging
            throw new Error(
                `Schema validation failed: ${JSON.stringify(validate.errors?.[0], null, 2)}`,
            );
        }
        expect(valid).toBe(true);
        expect(report).toHaveProperty('coverage');
    });

    const mostRecentFiles = collectMostRecentRunFiles();
    for (const filePath of mostRecentFiles) {
        const label = filePath.replace(REPO_ROOT + '/', '');
        it(`${label} is schema-valid and includes coverage`, () => {
            const report = loadJson(filePath) as Record<string, unknown>;

            const valid = validate(report);
            if (!valid) {
                throw new Error(
                    `Schema validation failed for ${label}: ${JSON.stringify(validate.errors?.[0], null, 2)}`,
                );
            }
            expect(valid).toBe(true);
            expect(report).toHaveProperty('coverage');
        });
    }
});
