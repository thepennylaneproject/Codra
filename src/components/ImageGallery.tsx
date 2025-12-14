/**
 * src/components/ImageGallery.tsx
 * Display gallery of generated images
 */

import { useGenerationQueue } from '@/hooks/useGenerationQueue';

export function ImageGallery() {
    const { jobs } = useGenerationQueue();

    const completedJobs = jobs.filter(j => j.status === 'completed' && j.result);

    return (
        <div className="w-full">
            <h2 className="text-2xl font-bold text-white mb-6">Generated Images</h2>

            {completedJobs.length === 0 ? (
                <p className="text-zinc-400 text-center py-8">No generated images yet</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {completedJobs.map(job => (
                        <div
                            key={job.id}
                            className="relative group bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-indigo-500 transition-colors"
                        >
                            {job.result?.url && (
                                <>
                                    <img
                                        src={job.result.url}
                                        alt={job.options.prompt}
                                        className="w-full h-48 object-cover group-hover:brightness-75 transition-all"
                                    />
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center bg-black/80 p-4">
                                        <p className="text-white text-sm text-center mb-3 line-clamp-3">
                                            {job.options.prompt}
                                        </p>
                                        <p className="text-zinc-300 text-xs">
                                            {job.result.model} • ${job.result.cost.toFixed(4)}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
