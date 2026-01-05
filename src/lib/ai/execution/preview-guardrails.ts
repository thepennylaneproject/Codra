import { SpreadTask } from '../../../domain/task-queue';

const PREVIEW_BLOCKED_KEYWORDS = [
    'deploy',
    'publish',
    'release',
    'send',
    'email',
    'webhook',
    'commit',
    'push',
    'merge',
    'delete',
    'remove',
    'migrate',
    'provision',
    'sync',
    'billing',
];

export function getPreviewGuardrail(task?: SpreadTask | null) {
    if (!task) {
        return { blocked: false, matches: [] as string[] };
    }

    const haystack = `${task.title} ${task.description}`.toLowerCase();
    const matches = PREVIEW_BLOCKED_KEYWORDS.filter((keyword) => haystack.includes(keyword));

    return {
        blocked: matches.length > 0,
        matches,
    };
}
