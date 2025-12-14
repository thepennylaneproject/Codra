
import React from 'react';
import { PricingTable } from './PricingTable';
import { X } from 'lucide-react';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                    <X className="h-6 w-6" />
                </button>

                <div className="p-8 pb-0 text-center">
                    <h2 className="text-3xl font-bold text-gray-900">Upgrade your plan</h2>
                    <p className="mt-2 text-gray-600">You've reached your usage limits. Unlock more power with Pro.</p>
                </div>

                <div className="p-4">
                    <PricingTable />
                </div>
            </div>
        </div>
    );
};
