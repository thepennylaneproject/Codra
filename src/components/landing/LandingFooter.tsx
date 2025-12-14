/**
 * LANDING FOOTER
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../Logo';
import { Twitter, Github, Linkedin, Youtube } from 'lucide-react';

export const LandingFooter: React.FC = () => {
    return (
        <footer className="bg-background-elevated border-t border-border-subtle pt-16 pb-8 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="col-span-1 md:col-span-1">
                        <div className="mb-6">
                            <Logo size="md" variant="full" />
                        </div>
                        <p className="text-body-sm text-text-muted mb-6">
                            The Creative Automation Studio for the next generation of builders.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-text-muted hover:text-brand-teal transition-colors"><Twitter className="w-5 h-5" /></a>
                            <a href="#" className="text-text-muted hover:text-brand-teal transition-colors"><Github className="w-5 h-5" /></a>
                            <a href="#" className="text-text-muted hover:text-brand-teal transition-colors"><Linkedin className="w-5 h-5" /></a>
                            <a href="#" className="text-text-muted hover:text-brand-teal transition-colors"><Youtube className="w-5 h-5" /></a>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div>
                        <h4 className="font-bold text-text-primary mb-4">Product</h4>
                        <ul className="space-y-3 text-body-sm text-text-muted">
                            <li><Link to="/features" className="hover:text-brand-teal">Features</Link></li>
                            <li><Link to="/pricing" className="hover:text-brand-teal">Pricing</Link></li>
                            <li><Link to="/changelog" className="hover:text-brand-teal">Changelog</Link></li>
                            <li><Link to="/roadmap" className="hover:text-brand-teal">Roadmap</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-text-primary mb-4">Resources</h4>
                        <ul className="space-y-3 text-body-sm text-text-muted">
                            <li><Link to="/docs" className="hover:text-brand-teal">Documentation</Link></li>
                            <li><Link to="/blog" className="hover:text-brand-teal">Blog</Link></li>
                            <li><Link to="/community" className="hover:text-brand-teal">Community</Link></li>
                            <li><Link to="/help" className="hover:text-brand-teal">Help Center</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-text-primary mb-4">Company</h4>
                        <ul className="space-y-3 text-body-sm text-text-muted">
                            <li><Link to="/about" className="hover:text-brand-teal">About</Link></li>
                            <li><Link to="/careers" className="hover:text-brand-teal">Careers</Link></li>
                            <li><Link to="/legal" className="hover:text-brand-teal">Legal</Link></li>
                            <li><Link to="/contact" className="hover:text-brand-teal">Contact</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-border-subtle flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-label-xs text-text-soft">
                        © {new Date().getFullYear()} Codra Inc. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-label-xs text-text-soft">
                        <Link to="/privacy" className="hover:text-text-primary">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-text-primary">Terms of Service</Link>
                        <Link to="/cookies" className="hover:text-text-primary">Cookie Settings</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
