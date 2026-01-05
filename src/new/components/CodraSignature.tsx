import React, { useMemo } from 'react';
import { getSignatureLine, SignatureContext } from '../../domain/signatures';

interface CodraSignatureProps {
    context: SignatureContext;
    className?: string;
}

/**
 * CodraSignature
 * 
 * An editorial signature block that acts as the "Managing Editor" of the interface.
 * Renders a consistent "— Codra" sign-off followed by a context-aware, witty one-liner.
 */
export const CodraSignature: React.FC<CodraSignatureProps> = ({
    context,
    className = ''
}) => {
    // Deterministically select the signature for this mount/render cycle
    // This ensures it doesn't jitter on re-renders, but changes if context changes
    const signatureLine = useMemo(() => {
        return getSignatureLine(context);
    }, [context]);

    if (!context) return null;

    return (
        <div className={`codra-signature ${className} flex flex-col gap-1 items-start select-none opacity-95`}>
            <span className="text-xs font-semibold text-zinc-500">
                — Codra
            </span>
            <span className="text-xs text-text-soft font-semibold italic max-w-[320px] leading-relaxed">
                {signatureLine}
            </span>
        </div>
    );
}
