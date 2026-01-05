import type { Handler } from '@netlify/functions';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const BASE_URL = process.env.URL || 'http://localhost:5173';

export const handler: Handler = async (event) => {
    if (!GITHUB_CLIENT_ID) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'GitHub Client ID not configured' })
        };
    }

    const redirectUri = `${BASE_URL}/.netlify/functions/github-auth-callback`;
    const scope = 'repo read:user';

    // Generate a random state for security (in a real app, store this in cookie/session)
    const state = Math.random().toString(36).substring(7);

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

    return {
        statusCode: 302,
        headers: {
            Location: authUrl
        }
    };
};
