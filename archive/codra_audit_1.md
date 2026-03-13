Implementation Plan - End-to-End UX Audit (Ink & Ivory)
This plan outlines the structure and key focus areas for the End-to-End UX Audit of the Codra application, adhering to the "Ink & Ivory" visual system and "Manuscript/Ledger/Journal" aesthetic.

User Review Required
IMPORTANT

The audit identifies a significant "technical vs. aesthetic" drift where the UI code uses hardcoded colors and generic SaaS patterns (like bg-white and bg-zinc-\*) instead of the defined "Ink & Ivory" tokens.

Proposed Changes
Audit Report & Systemic Recommendations
[NEW]

ux_audit_report.md
I will generate a comprehensive audit report covering:

Executive Summary: Stating the current "Status" of the system's UX.
System-level Recommendations:
Information Architecture: Renaming and restructuring for a "Ledger" feel.
Layout & Spacing: Defining Rules and Margins over "Cards".
Typography: mapping roles to the existing tokens in

design-tokens.ts
.
Affordances: Shifting from generic buttons to typographic cues.
Detailed Issue Log: A prioritized table of specific UX/UI flaws found in the codebase.
Per-screen Notes: Zoomed-in analysis of

ProjectsPage
,

ExecutionDeskPage
, and Onboarding.
Implementation Roadmap: A 3-phase plan to align the codebase with the "Ink & Ivory" vision.
Verification Plan
Manual Verification
I will verify that all proposed fixes in the report specifically address the hardcoded CSS values and component structures identified in the research phase.
I will ensure the roadmap provides concrete paths for replacing bg-white with var(--brand-ivory) and implementing ruled separators in place of generic borders.
