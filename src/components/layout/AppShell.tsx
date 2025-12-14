/**
 * APP SHELL
 * Main application layout with Cosmic Cockpit Elegance
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { IconRail } from './IconRail';
import { TopBar } from './TopBar';
import { CommandPalette } from '../command-palette/CommandPalette';
import { PromptArchitectPanel } from '../prompt-architect/PromptArchitectPanel';
import { PromptArchitectProvider } from '../../lib/prompt-architect/PromptArchitectContext';
import { useNavPreference } from '../../lib/hooks/useNavPreference';
import { CosmicBackground } from '../common/CosmicBackground';
import { cn } from '../../lib/utils';

export const AppShell: React.FC = () => {
    const { isExpanded } = useNavPreference();

    return (
        <PromptArchitectProvider>
            <CosmicBackground>
                <div className="flex min-h-screen">
                    {/* Global Features */}
                    <CommandPalette />
                    <PromptArchitectPanel />

                    {/* Sidebar - Fixed Position */}
                    <IconRail />

                    {/* Main Content Area - Push with margin */}
                    <div
                        className={cn(
                            "flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ml-0",
                            isExpanded ? "md:ml-60" : "md:ml-[72px]"
                        )}
                    >
                        {/* Top Bar - Sticky */}
                        <TopBar />

                        {/* Page Content - Scrollable */}
                        <main className="flex-1 overflow-auto">
                            {/* The Outlet renders the child route's element */}
                            <Outlet />
                        </main>
                    </div>
                </div>
            </CosmicBackground>
        </PromptArchitectProvider>
    );
};
