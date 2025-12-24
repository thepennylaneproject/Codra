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
            <span className="gold-foil text-xs tracking-[0.2em] uppercase">
                — Codra
            </span>
            <span className="text-[10px] text-[#8A8A8A] font-bold italic max-w-[320px] leading-relaxed tracking-wide">
                {signatureLine}
            </span>
        </div>
    );
}
