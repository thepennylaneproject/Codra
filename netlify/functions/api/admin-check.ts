/**
 * Admin Check Endpoint
 * 
 * GET /api/admin-check
 * Returns whether the current user is an admin
 */

import { Handler } from '@netlify/functions';
import { isAdmin } from '../utils/admin-auth';

export const handler: Handler = async (event) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json',
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    // Only GET allowed
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        const admin = await isAdmin(event);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ isAdmin: admin }),
        };
    } catch (error) {
        console.error('Admin check error:', error);

        return {
            statusCode: 200, // Return 200 with isAdmin: false instead of 500
            headers,
            body: JSON.stringify({ isAdmin: false }),
        };
    }
};
