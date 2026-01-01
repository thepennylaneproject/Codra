/**
 * ACTIVITY STRIP
 * Consolidated status bar at bottom of workspace
 * Information, not interaction - glanceable status display
 */

import { useState } from 'react';
import { ProgressSegment } from './ProgressSegment';
import { BudgetSegment } from './BudgetSegment';
import { AlertSegment } from './AlertSegment';
import { ActivityPopover } from './ActivityPopover';
import {
    useActivityStatus,
    useBudgetStatus,
    useAlerts,
    type ProgressStatus,
    type BudgetStatus,
} from './hooks';

interface ActivityStripProps {
    progress?: ProgressStatus;
    budget?: BudgetStatus;
    showContext?: boolean;
}

export function ActivityStrip({ progress, budget, showContext = false }: ActivityStripProps) {
    // Use provided state or defaults
    const activityStatus = useActivityStatus();
    const budgetStatus = useBudgetStatus();
    const alertsManager = useAlerts();

    const [budgetPopoverOpen, setBudgetPopoverOpen] = useState(false);
    const [alertPopoverOpen, setAlertPopoverOpen] = useState(false);

    // Use props if provided, otherwise use hooks
    const displayProgress = progress || activityStatus.progress;
    const displayBudget = budget || budgetStatus.status;
    const activeAlert = alertsManager.activeAlert;

    // Calculate context usage (placeholder)
    const contextUsage = activityStatus.context?.usage || 0;

    const handleBudgetClick = () => {
        setBudgetPopoverOpen(!budgetPopoverOpen);
        setAlertPopoverOpen(false);
    };

    const handleAlertDetailsClick = () => {
        setAlertPopoverOpen(!alertPopoverOpen);
        setBudgetPopoverOpen(false);
    };

    const handleAlertDismiss = () => {
        if (activeAlert) {
            alertsManager.dismissAlert(activeAlert.id);
        }
        setAlertPopoverOpen(false);
    };

    const handleBudgetClose = () => {
        setBudgetPopoverOpen(false);
    };

    return (
        <div className="relative">
            <div
                className="h-10 bg-[#12121A] border-t border-zinc-800 flex items-center justify-between"
                style={{ height: 'var(--strip-height, 40px)' }}
            >
                {/* Left: Progress or Alert */}
                <div className="flex-1">
                    {activeAlert ? (
                        <AlertSegment
                            alert={activeAlert}
                            onDetailsClick={handleAlertDetailsClick}
                        />
                    ) : (
                        <ProgressSegment progress={displayProgress} />
                    )}
                </div>

                {/* Center: Divider */}
                <div className="h-6 w-px bg-zinc-800" />

                {/* Middle: Budget */}
                <div className="flex-1 flex justify-center">
                    <BudgetSegment
                        budget={displayBudget}
                        onClick={handleBudgetClick}
                    />
                </div>

                {/* Right: Context (optional) */}
                {showContext && (
                    <>
                        <div className="h-6 w-px bg-zinc-800" />
                        <div className="flex-1 flex justify-end px-4">
                            <span className="text-sm text-zinc-400">
                                Context: <span className="font-medium text-zinc-300">{contextUsage}%</span>
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* Popovers */}
            {budgetPopoverOpen && (
                <ActivityPopover
                    type="budget"
                    breakdown={budgetStatus.getBreakdown()}
                    onClose={handleBudgetClose}
                />
            )}

            {alertPopoverOpen && activeAlert && (
                <ActivityPopover
                    type="alert"
                    alert={activeAlert}
                    onDismiss={handleAlertDismiss}
                />
            )}
        </div>
    );
}
