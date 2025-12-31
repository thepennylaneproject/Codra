import { LegalPage } from './LegalPage';

export function PrivacyPage() {
    return (
        <LegalPage 
            title="Privacy Policy"
            lastUpdated="December 21, 2025"
            sections={[
                {
                    title: "1. Data Collection",
                    content: "We collect project context, brand guidelines, and goals to provide specialized AI assistance. This includes Project Brief data you provide during setup."
                },
                {
                    title: "2. AI Training Policy",
                    content: "We do not use your proprietary client context or production outputs to train foundation models without your explicit, opt-in consent."
                },
                {
                    title: "3. Security & Context",
                    content: "Client brand identities and strategy are siloed per project workspace to ensure no cross-contamination of context between assignments."
                },
                {
                    title: "4. Third-Party API Providers",
                    content: "Your data is processed via third-party AI providers (OpenAI, Anthropic, Google). Their respective privacy policies apply to data transit."
                }
            ]}
        />
    );
}
