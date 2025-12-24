import { LegalPage } from './LegalPage';

export function TermsPage() {
    return (
        <LegalPage 
            title="Terms of Service"
            lastUpdated="December 21, 2025"
            sections={[
                {
                    title: "1. Acceptance of Terms",
                    content: "By accessing Codra's production studio, you agree to be bound by these Terms. If you are using the service on behalf of an agency, you represent that you have the authority to bind that agency to these terms."
                },
                {
                    title: "2. AI Production Capacity",
                    content: "Codra provides an AI-augmented production environment. Outputs are generated using large language models. While we strive for production-grade quality, users are responsible for final verification before deployment."
                },
                {
                    title: "3. Ownership of Works",
                    content: "Subject to your compliance with these terms and payment of applicable fees, you own all rights, title, and interest in and to the production outputs generated through your workspaces."
                },
                {
                    title: "4. Agency & Client Use",
                    content: "Agencies using Codra to deliver services to third-party clients are responsible for the management of those client relationships and ensuring client context is handled securely."
                }
            ]}
        />
    );
}
