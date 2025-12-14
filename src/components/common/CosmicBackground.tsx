import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAtmosphere } from '../../lib/design/AtmosphereContext';

export function CosmicBackground({ children }: { children?: React.ReactNode }) {
    const { currentAtmosphere } = useAtmosphere();

    // Generate some static particles to float around
    const particles = useMemo(() => {
        return Array.from({ length: 20 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            duration: Math.random() * 20 + 10,
            delay: Math.random() * 5,
        }));
    }, []);

    return (
        <>
            {/* Background Layers - Fixed & Behind */}
            <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none select-none">
                {/* 1. Underlying Base Layer (Fallback color) */}
                <div className="absolute inset-0 bg-zinc-950" />

                {/* 2. The Dynamic "World" Image */}
                {currentAtmosphere.backgroundImage && (
                    <motion.div
                        key={currentAtmosphere.backgroundImage}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 mix-blend-screen"
                        style={{
                            backgroundImage: `url(${currentAtmosphere.backgroundImage})`,
                            filter: `hue-rotate(${currentAtmosphere.hueRotate}deg)`
                        }}
                    />
                )}

                {/* 3. Gradient Overlay for readability (Vignette) */}
                <div className="absolute inset-0 bg-radial-gradient-to-tr from-transparent via-zinc-950/40 to-zinc-950/80" />
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/30 via-transparent to-zinc-950/80" />

                {/* 4. Atmosphere Glow Overlay */}
                <motion.div
                    animate={{
                        background: `radial-gradient(circle at 50% 30%, ${currentAtmosphere.glowColor} 0%, transparent 60%)`,
                    }}
                    transition={{ duration: 2 }}
                    className="absolute inset-0 opacity-20"
                />

                {/* 5. Floating Particles */}
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        className="absolute rounded-full"
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            width: p.size,
                            height: p.size,
                            backgroundColor: currentAtmosphere.glowColor || 'white',
                            boxShadow: `0 0 ${p.size * 2}px ${currentAtmosphere.glowColor}`,
                        }}
                        animate={{
                            y: [0, -100, 0],
                            opacity: [0.2, 0.8, 0.2],
                        }}
                        transition={{
                            duration: p.duration,
                            repeat: Infinity,
                            delay: p.delay,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            {/* Content Layer - Normal Flow */}
            <div className="relative z-0 min-h-screen">
                {children}
            </div>
        </>
    );
}
