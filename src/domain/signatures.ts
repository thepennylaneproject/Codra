/**
 * Codra Signature System
 * 
 * A systemic voice layer that reinforces tone, authority, and delight
 * through controlled, contextual micro-copy.
 */

// Context keys used by components to request a signature
export type SignatureContext =
    | 'EMPTY_STATE'
    | 'SYSTEM_CONFIRMATION'
    | 'ACTION_COMPLETE'
    | 'ERROR_STATE'
    | 'DEAR_CODRA'
    | 'MILESTONE'
    | 'REALITY_CHECK'
    | 'DEFAULT';

// Internal categories for organizing lines per the Style Guide
type SignatureCategory =
    | 'EDITORIAL_PUBLICATION'
    | 'DESIGN_LAYOUT'
    | 'SOFTWARE_SYSTEMS'
    | 'DRY_WIT'
    | 'HARD_TRUTH'
    | 'HIGH_TASTE_ABSURDITY';

interface SignatureEntry {
    text: string;
    weight: number; // For weighted random selection (normal = 1, rare = 0.1)
}

// Registry of all approved signature lines
const SIGNATURE_REGISTRY: Record<SignatureCategory, SignatureEntry[]> = {
    // 1. Editorial / Publication
    // Used at the end of completed artifacts and Tear Sheets.
    EDITORIAL_PUBLICATION: [
        { text: "Filed before the deadline (for once).", weight: 1 },
        { text: "From the cutting-room floor.", weight: 1 },
        { text: "Edited, proofed, and probably still typo’d.", weight: 1 },
        { text: "Sent from a distraction-free environment.", weight: 1 },
        { text: "Published with light reservations.", weight: 1 },
        { text: "Dictated but not read.", weight: 1 },
        { text: "Final_v2_FINAL_Revised.pdf.", weight: 1 },
        { text: "Stet.", weight: 1 },
        { text: "Printed in extremely limited edition.", weight: 1 }, // Also in Absurdity, but fits here
        { text: "Awaiting final approval.", weight: 1 },
        { text: "As per my previous email,", weight: 1 },
        { text: "Redacted for clarity.", weight: 1 },
        { text: "More of a manifesto, really.", weight: 1 },
        { text: "Written in ink.", weight: 1 }
    ],

    // 2. Design & Layout
    // Used after layout, asset, or spread-related actions.
    DESIGN_LAYOUT: [
        { text: "Staying between the bleed lines.", weight: 1 },
        { text: "With appropriately spaced intentions.", weight: 1 },
        { text: "Pixel-perfect(ish).", weight: 1 },
        { text: "Kerned manually.", weight: 1 },
        { text: "Aligned to grid, mostly.", weight: 1 },
        { text: "In glorious monochrome.", weight: 1 },
        { text: "Typeset in something expensive.", weight: 1 },
        { text: "Whitespace is a feature.", weight: 1 },
        { text: "Ignoring the safe area.", weight: 1 },
        { text: "Formatted for print and patience.", weight: 1 },
        { text: "Lorem ipsum dolor sit amet.", weight: 0.2 }, // Rare
        { text: "Rendered with high intent.", weight: 1 },
        { text: "Snap to grid enabled.", weight: 1 }
    ],

    // 3. Software / Systems
    // Used after builds, exports, generations, or saves.
    SOFTWARE_SYSTEMS: [
        { text: "Committed this thought to main.", weight: 1 },
        { text: "Shipped with love and linting.", weight: 1 },
        { text: "Deployed this idea cautiously.", weight: 1 },
        { text: "Compiled and released.", weight: 1 },
        { text: "Running on clean energy and coffee.", weight: 1 },
        { text: "Cached for your convenience.", weight: 1 },
        { text: "Merged without conflicts.", weight: 1 },
        { text: "Pushing to production friday afternoon.", weight: 1 },
        { text: "Exiting with code 0.", weight: 1 },
        { text: "Optimized for human readability.", weight: 1 },
        { text: "System nominal.", weight: 1 },
        { text: "Garbage collection complete.", weight: 1 },
        { text: "Logic verified.", weight: 1 },
        { text: "State persisted.", weight: 1 }
    ],

    // 4. Dry Wit / Editorial Aside
    // Used sparingly for moments of friction or ambiguity.
    DRY_WIT: [
        { text: "It seemed clever at the time.", weight: 1 },
        { text: "Professionally yours, recreationally confused.", weight: 1 },
        { text: "Typed with confidence, reviewed with regret.", weight: 1 },
        { text: "Emotionally, this is still in draft.", weight: 1 },
        { text: "Closing this tab before I overthink it.", weight: 1 },
        { text: "Signed, sealed, mildly unhinged.", weight: 1 },
        { text: "Let’s agree this never happened.", weight: 1 },
        { text: "Proceeding with caution.", weight: 1 },
        { text: "I have notes.", weight: 1 },
        { text: "This is not legal advice.", weight: 1 },
        { text: "Sent from my mechanical keyboard.", weight: 1 },
        { text: "E&OE.", weight: 1 }, // Errors and Omissions Excepted
        { text: "Making it up as we go.", weight: 1 }
    ],

    // 5. High-Taste Absurdity (Rare)
    // Easter eggs. Delight without dilution.
    HIGH_TASTE_ABSURDITY: [
        { text: "Respectfully misaligned.", weight: 1 },
        { text: "Filed under: Necessary.", weight: 1 },
        { text: "This page intentionally left blank.", weight: 1 },
        { text: "No ticket required.", weight: 1 },
        { text: "Void where prohibited.", weight: 1 },
        { text: "Contents may settle during shipping.", weight: 1 },
        { text: "Not for resale.", weight: 1 },
        { text: "Printed on 100% recycled pixels.", weight: 1 },
        { text: "Keep cool. Dry clean only.", weight: 1 }
    ],
    // 6. Hard Truths / Reality Integration
    // Used for budget, timeline, or constraint-heavy sections.
    HARD_TRUTH: [
        { text: "The budget and the vision are currently in litigation.", weight: 1 },
        { text: "Timeline: Ambitious. Progress: Architectural.", weight: 1 },
        { text: "Constraints are just spicy guardrails.", weight: 1 },
        { text: "Reality has entered the chat.", weight: 1 },
        { text: "This will cost more than a coffee subscription.", weight: 1 },
        { text: "Deadlines are closer than they appear.", weight: 1 },
        { text: "We're going to need a bigger spreadsheet.", weight: 1 },
        { text: "Scope creep is a quiet monster.", weight: 1 },
        { text: "Quality, speed, cost: pick two (carefully).", weight: 1 }
    ]
};

// Mapping from UI Context to Signature Category
const CONTEXT_MAPPING: Record<SignatureContext, SignatureCategory> = {
    EMPTY_STATE: 'EDITORIAL_PUBLICATION',
    SYSTEM_CONFIRMATION: 'SOFTWARE_SYSTEMS',
    DEFAULT: 'EDITORIAL_PUBLICATION',

    // Note: DESIGN_LAYOUT is available for specific contexts if we add them,
    // but ACTION_COMPLETE often overlaps with software operations.
    // We'll map ACTION_COMPLETE to SOFTWARE_SYSTEMS for now.
    ACTION_COMPLETE: 'SOFTWARE_SYSTEMS',

    ERROR_STATE: 'DRY_WIT',
    DEAR_CODRA: 'DRY_WIT',

    MILESTONE: 'HIGH_TASTE_ABSURDITY',
    REALITY_CHECK: 'HARD_TRUTH'
};

/**
 * Deterministically retrieves a signature based on context.
 * 
 * NOTE: The "randomness" is handled by the caller or by a seed if we wanted true determinism across reloads.
 * For this implementation, we simply return a random item from the mapped category.
 * The React component using this should use useMemo to optimize stability during re-renders.
 */
export function getSignatureLine(context: SignatureContext = 'DEFAULT'): string {
    const categoryKey = CONTEXT_MAPPING[context] || 'EDITORIAL_PUBLICATION';
    const lines = SIGNATURE_REGISTRY[categoryKey];

    if (!lines || lines.length === 0) {
        return "Edited, proofed, and probably still typo’d,"; // Fallback
    }

    // Simple random selection
    // Weighted selection could be implemented here if we had varying weights
    // For now simple equivalent probability is fine.
    const randomIndex = Math.floor(Math.random() * lines.length);
    return lines[randomIndex].text;
}
