import { Plus, Palette, BarChart2, Rocket, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsBarProps {
    openDesignConsole?: () => void;
    setShowBenchmark: (show: boolean) => void;
}

export const QuickActionsBar = ({ openDesignConsole, setShowBenchmark }: QuickActionsBarProps) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-wrap gap-3 mb-8 p-4 bg-background-elevated rounded-xl border border-border-subtle shadow-sm">
            <QuickActionButton
                icon={Plus}
                label="New Project"
                onClick={() => navigate('/projects/new')}
                primary
            />
            {/* Design console usually available via settings or a global modal, we'll try to use the provided handler or navigate */}
            <QuickActionButton
                icon={Palette}
                label="Design Console"
                onClick={openDesignConsole || (() => navigate('/settings/appearance'))}
            />
            <QuickActionButton
                icon={BarChart2}
                label="Benchmarks"
                onClick={() => setShowBenchmark(true)}
            />
            <QuickActionButton
                icon={Rocket}
                label="Deploy"
                onClick={() => navigate('/settings/deploy')}
            />
            <QuickActionButton
                icon={Key}
                label="API Keys"
                onClick={() => navigate('/settings/credentials')}
            />
        </div>
    );
};

interface QuickActionButtonProps {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    primary?: boolean;
}

const QuickActionButton = ({ icon: Icon, label, onClick, primary }: QuickActionButtonProps) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all
            ${primary
                ? 'bg-brand-teal text-white hover:brightness-110 shadow-md'
                : 'bg-background-subtle text-text-secondary hover:bg-background-elevated hover:text-text-primary border border-transparent hover:border-border-subtle'
            }
        `}
    >
        <Icon className="w-4 h-4" />
        {label}
    </button>
);
