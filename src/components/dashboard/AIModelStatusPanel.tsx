import { Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCredentials } from '../../lib/api/credentials/hooks';

export const AIModelStatusPanel = () => {
    const { credentials } = useCredentials();

    const getStatus = (providerId: string) => {
        const cred = credentials.find(c => c.provider === providerId);
        return cred ? 'ready' : 'missing';
    };

    const providers = [
        { id: 'openai', name: 'OpenAI', status: getStatus('openai') },
        { id: 'anthropic', name: 'Anthropic', status: getStatus('anthropic') },
        { id: 'deepseek', name: 'DeepSeek', status: getStatus('deepseek') },
        { id: 'google', name: 'Gemini', status: getStatus('google') },
    ];

    return (
        <div className="p-4 bg-background-elevated rounded-xl border border-border-subtle h-full">
            <h3 className="text-label-md font-semibold mb-4 flex items-center gap-2 text-text-primary">
                <Cpu className="w-4 h-4" />
                AI Providers
            </h3>
            <div className="space-y-2">
                {providers.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
                        <span className="text-body-sm text-text-secondary">{p.name}</span>
                        <StatusIndicator status={p.status} />
                    </div>
                ))}
            </div>
            <Link to="/settings/credentials" className="text-brand-teal text-label-sm mt-4 block hover:underline">
                Manage API Keys →
            </Link>
        </div>
    );
};

const StatusIndicator = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        ready: 'bg-green-500/10 text-green-500',
        slow: 'bg-yellow-500/10 text-yellow-500',
        error: 'bg-red-500/10 text-red-500',
        missing: 'bg-gray-500/10 text-gray-500',
    };

    // Fallback for unexpected status
    const style = styles[status] || styles.missing;

    return (
        <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${status === 'ready' ? 'bg-green-500' : status === 'slow' ? 'bg-yellow-500' : status === 'error' ? 'bg-red-500' : 'bg-gray-500'}`} />
            <span className={`text-label-sm px-2 py-0.5 rounded ${style}`}>
                {status === 'ready' ? 'Ready' : status === 'missing' ? 'No Key' : status}
            </span>
        </div>
    );
};
