import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlacement } from '../../lib/placement/PlacementContext';
import { useAtmosphere } from '../../lib/design/AtmosphereContext';

export const PlacementLayer: React.FC = () => {
    const { spec } = usePlacement();
    const { currentAtmosphere } = useAtmosphere();

    const {
        blurAmount,
        overlayOpacity,
        scale,
        allowMotion,
        allowAccents
    } = spec;

    const {
        backgroundImage,
        glassTint,
        glowColor,
        hueRotate
    } = currentAtmosphere;

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            {/* Base Background Image or Gradient */}
            <motion.div
                className="absolute inset-0 bg-cover bg-center"
                initial={false}
                animate={{
                    filter: `blur(${blurAmount}px) hue-rotate(${hueRotate}deg)`,
                    scale: scale,
                    opacity: 1, // Base image is always there, overlay determines visibility
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                style={{
                    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                    backgroundColor: glassTint, // Fallback
                }}
            />

            {/* Atmosphere Glow / Accents */}
            {/* We render a large glow blob that moves slowly if motion is allowed */}
            <AnimatePresence>
                {allowAccents && (
                    <>
                        {/* Primary Glow */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: 0.4,
                                background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
                                x: allowMotion ? [0, 50, 0] : 0,
                                y: allowMotion ? [0, 30, 0] : 0,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                opacity: { duration: 1 },
                                default: {
                                    duration: 20,
                                    repeat: Infinity,
                                    ease: "linear"
                                }
                            }}
                            className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full mix-blend-screen"
                        />
                        {/* Secondary Glow (Offset) */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: 0.3,
                                background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
                                x: allowMotion ? [0, -30, 0] : 0,
                                y: allowMotion ? [0, -50, 0] : 0,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                opacity: { duration: 1 },
                                default: {
                                    duration: 15,
                                    repeat: Infinity,
                                    ease: "linear",
                                    delay: 2
                                }
                            }}
                            className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full mix-blend-screen"
                        />
                    </>
                )}
            </AnimatePresence>

            {/* Overlay Layer (Controls "Quiet" vs "Ambient") */}
            <motion.div
                className="absolute inset-0"
                animate={{
                    backgroundColor: glassTint,
                    opacity: overlayOpacity,
                }}
                transition={{ duration: 0.8 }}
            />

            {/* Texture/Grain (Optional, keeping subtle) */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
            />
        </div>
    );
};
