
import React from 'react';

interface CommandGroupProps {
    heading: string;
    children: React.ReactNode;
}

export const CommandGroup: React.FC<CommandGroupProps> = ({ heading, children }) => {
    if (React.Children.count(children) === 0) return null;

    return (
        <div className="py-2">
            <h3 className="px-4 pb-2 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase select-none">
                {heading}
            </h3>
            <div role="group" aria-label={heading}>
                {children}
            </div>
        </div>
    );
};
