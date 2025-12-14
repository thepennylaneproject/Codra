/**
 * LANDING NAV
 * Navigation bar for the marketing site
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../Logo';
import { Menu, X } from 'lucide-react';

export const LandingNav: React.FC = () => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setMobileMenuOpen(false);
        }
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? 'bg-background-default/80 backdrop-blur-md border-b border-border-subtle py-4'
                    : 'bg-transparent py-6'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <div className="flex-shrink-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <Logo size="md" variant="full" />
                </div>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    {['Features', 'How it Works', 'Pricing', 'FAQ'].map((item) => (
                        <button
                            key={item}
                            onClick={() => scrollToSection(item.toLowerCase().replace(/\s+/g, '-'))}
                            className="text-body-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                        >
                            {item}
                        </button>
                    ))}
                </div>

                {/* Auth Buttons */}
                <div className="hidden md:flex items-center gap-4">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-body-sm font-medium text-text-primary hover:text-brand-teal transition-colors"
                    >
                        Log In
                    </button>
                    <button
                        onClick={() => navigate('/signup')}
                        className="px-5 py-2.5 rounded-lg bg-text-primary text-background-default text-body-sm font-semibold hover:bg-brand-teal hover:scale-105 transition-all"
                    >
                        Get Started
                    </button>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-text-primary"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-background-elevated border-b border-border-subtle p-6 animate-in slide-in-from-top-5">
                    <div className="flex flex-col gap-4">
                        {['Features', 'How it Works', 'Pricing', 'FAQ'].map((item) => (
                            <button
                                key={item}
                                onClick={() => scrollToSection(item.toLowerCase().replace(/\s+/g, '-'))}
                                className="text-left text-body-lg font-medium text-text-secondary hover:text-text-primary"
                            >
                                {item}
                            </button>
                        ))}
                        <hr className="border-border-subtle my-2" />
                        <button
                            onClick={() => navigate('/login')}
                            className="text-left text-body-lg font-medium text-text-primary"
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="w-full py-3 rounded-lg bg-text-primary text-background-default font-semibold text-center"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};
