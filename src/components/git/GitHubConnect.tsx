import React from 'react';
import { Github } from 'lucide-react';

interface GitHubConnectProps {
    connected?: boolean;
}

export const GitHubConnect: React.FC<GitHubConnectProps> = ({ connected }) => {
    const handleConnect = () => {
        // Redirect to our Netlify Function to start OAuth
        window.location.href = '/.netlify/functions/github-auth-start';
    };

    if (connected) {
        return (
            <button disabled className="flex items-center gap-2 px-4 py-2 bg-green-900/50 text-green-200 border border-green-800 rounded-md text-sm font-medium">
                <Github size={16} />
                Connected
            </button>
        );
    }

    return (
        <button
            onClick={handleConnect}
            className="flex items-center gap-2 px-4 py-2 bg-[#24292e] text-white rounded-md hover:bg-[#2c3137] transition-colors text-sm font-medium"
        >
            <Github size={16} />
            Connect GitHub
        </button>
    );
};
