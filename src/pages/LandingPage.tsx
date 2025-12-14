/**
 * LANDING PAGE
 * Marketing page for converting visitors to users
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingNav } from '../components/landing/LandingNav';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesGrid } from '../components/landing/FeaturesGrid';
import { HowItWorks } from '../components/landing/HowItWorks';
import { PricingSection } from '../components/landing/PricingSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { FAQSection } from '../components/landing/FAQSection';
import { CTASection } from '../components/landing/CTASection';
import { LandingFooter } from '../components/landing/LandingFooter';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background-default">
            <LandingNav />

            <HeroSection
                title="Creative Automation for Makers"
                subtitle="Build AI Workflows with Clarity and Control"
                cta={{
                    text: 'Start Building Free',
                    onClick: () => navigate('/signup'),
                }}
                secondaryCta={{
                    text: 'Watch Demo',
                    onClick: () => window.open('https://youtube.com', '_blank'),
                }}
            />

            <FeaturesGrid />

            <HowItWorks />

            <PricingSection />

            <TestimonialsSection />

            <FAQSection />

            <CTASection />

            <LandingFooter />
        </div>
    );
};

export default LandingPage;
