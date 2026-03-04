import { useBudget } from '@/hooks/useBudget';
import { Wallet } from 'lucide-react';
import { useState } from 'react';
import { BudgetDetailModal } from './BudgetDetailModal';

export function BudgetBadge() {
    const { spent, limit, percentage } = useBudget();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const colorClasses = 
        percentage < 80 ? 'bg-white border-[#1A1A1A]/10 text-[#1A1A1A]' : // Normal (Ink)
        percentage < 100 ? 'bg-[#FFFAF0] border-[#D93025]/30 text-[#D93025]' : // Warning (Amber-ish equivalent -> Red Text)
        'bg-[#D93025] border-[#D93025] text-white'; // Critical (Vermilion)

    const iconClasses = 
        percentage < 80 ? 'text-[#1A1A1A]/50' :
        percentage < 100 ? 'text-[#D93025]' :
        'text-white';

    const textClasses = 
        percentage < 80 ? 'text-[#1A1A1A]' :
        percentage < 100 ? 'text-[#D93025]' :
        'text-white';

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
