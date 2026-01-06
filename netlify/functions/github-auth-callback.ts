import type { Handler } from '@netlify/functions';


const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const BASE_URL = process.env.URL || 'http://localhost:5175';

export const handler: Handler = async (event) => {
    const code = event.queryStringParameters?.code;

    if (!code) {
        return { statusCode: 400, body: 'Missing code' };
    }

    try {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code,
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            return { statusCode: 400, body: JSON.stringify(tokenData) };
        }

        const accessToken = tokenData.access_token;

        // Redirect back to the application with the token
        // In a real app, we would store this in the database against the user's ID
        // For now, we'll pass it back so the client can store it in memory/localStorage for the session
        // This is known as the "Token in URL" pattern, secure-ish if using HTTPS and fragment, but not ideal for long term.
        // Given existing auth, we could update the user's record here if we knew who they were (by passing a session token in state).

        return {
            statusCode: 302,
            headers: {
                Location: `${BASE_URL}/admin/github-callback?token=${accessToken}`
            }
        };

    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: 'Internal Server Error' };
    }
};
