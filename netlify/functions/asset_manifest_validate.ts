import { Handler } from '@netlify/functions';
import { validateManifest, formatValidationErrors } from '../../src/lib/assets/manifest/validate';

export const handler: Handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const validation = validateManifest(body);

        if (!validation.success && validation.errors) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    valid: false,
                    errors: formatValidationErrors(validation.errors)
                })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                valid: true,
                message: "Manifest is valid",
                bundleName: validation.data?.bundle.name,
                assetCount: validation.data?.assets.length
            })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
