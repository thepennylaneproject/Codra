import { useBudget } from '@/hooks/useBudget';
import { Wallet } from 'lucide-react';
import { useState } from 'react';
import { BudgetDetailModal } from './BudgetDetailModal';

export function BudgetBadge() {
    const { spent, limit, percentage } = useBudget();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const colorClasses = 
        percentage < 50 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
        percentage < 80 ? 'bg-amber-50 border-amber-100 text-amber-700' :
        'bg-rose-50 border-rose-100 text-rose-700';

    const iconClasses = 
        percentage < 50 ? 'text-emerald-600' :
        percentage < 80 ? 'text-amber-600' :
        'text-rose-600';

    const textClasses = 
        percentage < 50 ? 'text-emerald-600' :
        percentage < 80 ? 'text-amber-600' :
        'text-rose-600';

    return (
        <>
            <div 
                className={`flex items-center gap-1 px-3 py-1 rounded-lg border cursor-pointer hover:opacity-80 transition-all group ${colorClasses}`}
                title="Monthly Budget Usage - Click to manage"
                onClick={() => setIsModalOpen(true)}
            >
                <Wallet size={14} strokeWidth={1.5} className={iconClasses} />
                <span className="text-xs font-semibold">${spent.toFixed(0)}</span>
                <span className="text-xs opacity-50">/</span>
                <span className={`text-xs font-mono ${textClasses}`}>${limit}</span>
            </div>

            <BudgetDetailModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </>
    );
}
