/**
 * DEMO CREDENTIALS
 * Configuration for demo mode behavior
 */

export const DEMO_CONFIG = {
    enabled: true,
    provider: 'codra-demo',
    model: 'demo-gpt-4',
    limits: {
        projects: 1,
        generations: 50,
        storageMB: 10
    },
    features: {
        canExport: false,
        canDeploy: false,
        canCollaborate: false
    }
};

export const isDemoMode = (preferences: { useDemoMode: boolean }): boolean => {
    return preferences.useDemoMode;
};
