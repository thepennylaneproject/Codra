/**
 * src/components/GenerationQueue.tsx
 * Display generation queue and job status
 */


import { useGenerationQueue } from '@/hooks/useGenerationQueue';
import { ImageGenerationJob } from '@/lib/ai/types-image';

export function GenerationQueue() {
    const { jobs, queueStatus, isLoading, error, retryJob } = useGenerationQueue();

    if (isLoading && !jobs.length) {
        return (
            <div className="p-6 bg-zinc-950 rounded-lg border border-zinc-800">
                <p className="text-zinc-400">Loading queue...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                <p className="text-red-300">{error}</p>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-900/30 border-green-700';
            case 'processing':
                return 'bg-blue-900/30 border-blue-700';
            case 'pending':
                return 'bg-yellow-900/30 border-yellow-700';
            case 'failed':
                return 'bg-red-900/30 border-red-700';
            default:
                return 'bg-zinc-900 border-zinc-700';
        }
    };

    return (
        <div className="w-full space-y-6">
            {/* Queue Status Summary */}
            {queueStatus && (
                <div className="grid grid-cols-5 gap-4">
                    <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                        <p className="text-xs text-zinc-400">Total</p>
                        <p className="text-2xl font-bold text-white">{queueStatus.totalJobs}</p>
                    </div>
                    <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                        <p className="text-xs text-yellow-300">Pending</p>
                        <p className="text-2xl font-bold text-yellow-300">{queueStatus.pendingJobs}</p>
                    </div>
                    <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                        <p className="text-xs text-blue-300">Processing</p>
                        <p className="text-2xl font-bold text-blue-300">{queueStatus.processingJobs}</p>
                    </div>
                    <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                        <p className="text-xs text-green-300">Completed</p>
                        <p className="text-2xl font-bold text-green-300">{queueStatus.completedJobs}</p>
                    </div>
                    <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
                        <p className="text-xs text-red-300">Failed</p>
                        <p className="text-2xl font-bold text-red-300">{queueStatus.failedJobs}</p>
                    </div>
                </div>
            )}

            {/* Jobs List */}
            <div className="space-y-3">
                {jobs.length === 0 ? (
                    <p className="text-zinc-400 text-center py-8">No generation jobs yet</p>
                ) : (
                    jobs.map((job: ImageGenerationJob) => (
                        <div
                            key={job.id}
                            className={`p-4 border rounded-lg ${getStatusColor(job.status)}`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="font-semibold text-white">{job.options.prompt.slice(0, 50)}...</p>
                                    <p className="text-xs text-zinc-400 mt-1">
                                        {job.provider} • {job.model}
                                    </p>
                                </div>
                                <span className="px-3 py-1 bg-zinc-900 text-zinc-200 text-xs font-medium rounded capitalize">
                                    {job.status}
                                </span>
                            </div>

                            {/* Result Preview */}
                            {job.result?.url && (
                                <div className="mt-2 mb-2">
                                    <img
                                        src={job.result.url}
                                        alt="Generation result"
                                        className="w-full h-32 object-cover rounded"
                                    />
                                </div>
                            )}

                            {/* Error Message */}
                            {job.error && (
                                <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded">
                                    <p className="text-red-300 text-xs">{job.error.message}</p>
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 mt-2">
                                <p>Cost: ${job.result?.cost.toFixed(4) || '0.0000'}</p>
                                <p>Time: {job.result?.generationTime || '-'}ms</p>
                                <p>Created: {new Date(job.createdAt).toLocaleTimeString()}</p>
                                {job.completedAt && (
                                    <p>Completed: {new Date(job.completedAt).toLocaleTimeString()}</p>
                                )}
                            </div>

                            {/* Actions */}
                            {job.status === 'failed' && job.retryCount < job.maxRetries && (
                                <button
                                    onClick={() => retryJob(job.id)}
                                    className="mt-3 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded transition-colors"
                                >
                                    Retry
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}