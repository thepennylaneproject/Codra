import { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    type: 'dust' | 'glint';
    phase: number;
}

const GOLD_BASE = '#D4AF37';

export function SparkleLayer() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const particlesRef = useRef<Particle[]>([]);
    const lastSpawnTime = useRef<number>(0);
    const mouseRef = useRef<{ x: number, y: number } | null>(null);
    const lastMoveTime = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        // If reduced motion is preferred, we simply don't start the loop or listeners
        if (mediaQuery.matches) return;

        let width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
        let height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;

        const handleResize = () => {
            if (!canvas.parentElement) return;
            width = canvas.width = canvas.parentElement.clientWidth;
            height = canvas.height = canvas.parentElement.clientHeight;
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            // Check if mouse is within bounds
            if (
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom
            ) {
                mouseRef.current = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
                lastMoveTime.current = Date.now();
            } else {
                mouseRef.current = null;
            }
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);

        const MAX_PARTICLES = window.innerWidth < 768 ? 40 : 100;
        const SPAWN_INTERVAL = 20; // ms

        const createParticle = (x: number, y: number, type: 'dust' | 'glint' = 'dust'): Particle => {
            const angle = Math.random() * Math.PI * 2;
            // Velocity: dust drifts slowly, glints might be stationary or slow
            const speed = type === 'glint' ? Math.random() * 0.2 : Math.random() * 0.5 + 0.1;
            return {
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0,
                maxLife: 120 + Math.random() * 60, // frames
                size: type === 'glint' ? Math.random() * 3 + 2 : Math.random() * 1.5 + 0.5,
                type,
                phase: Math.random() * Math.PI * 2
            };
        };

        const loop = () => {
            const now = Date.now();
            ctx.clearRect(0, 0, width, height);

            // Spawning Logic
            // Only spawn if mouse is active (moved recently) and we have a position
            if (mouseRef.current && (now - lastMoveTime.current < 100)) {
                if (now - lastSpawnTime.current > SPAWN_INTERVAL) {
                    if (particlesRef.current.length < MAX_PARTICLES) {
                        // Spawn 1-2 particles
                        const count = Math.random() > 0.5 ? 2 : 1;
                        for (let k = 0; k < count; k++) {
                            const isGlint = Math.random() > 0.96; // Rare glint
                            const spread = 20;
                            const px = mouseRef.current.x + (Math.random() - 0.5) * spread;
                            const py = mouseRef.current.y + (Math.random() - 0.5) * spread;

                            particlesRef.current.push(createParticle(px, py, isGlint ? 'glint' : 'dust'));
                        }
                    }
                    lastSpawnTime.current = now;
                }
            }

            // Update & Draw
            for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                const p = particlesRef.current[i];
                p.life++;
                p.x += p.vx;
                p.y += p.vy;
                p.phase += 0.05;

                if (p.life >= p.maxLife) {
                    particlesRef.current.splice(i, 1);
                    continue;
                }

                // Calculate Opacity
                let alpha = 1;
                const fadeIn = 20;
                const fadeOut = 40;

                if (p.life < fadeIn) {
                    alpha = p.life / fadeIn;
                } else if (p.life > p.maxLife - fadeOut) {
                    alpha = (p.maxLife - p.life) / fadeOut;
                }

                if (p.type === 'glint') {
                    // Twinkle effect
                    const scale = (Math.sin(p.phase) * 0.5 + 1);
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.scale(scale, scale);
                    ctx.globalAlpha = alpha; // Glints are bright

                    // Draw Star
                    ctx.fillStyle = '#FFFDE7'; // White-gold core
                    ctx.beginPath();
                    // Simple 4-point star
                    const s = p.size;
                    ctx.moveTo(0, -s);
                    ctx.quadraticCurveTo(s / 4, -s / 4, s, 0);
                    ctx.quadraticCurveTo(s / 4, s / 4, 0, s);
                    ctx.quadraticCurveTo(-s / 4, s / 4, -s, 0);
                    ctx.quadraticCurveTo(-s / 4, -s / 4, 0, -s);
                    ctx.fill();

                    ctx.restore();
                } else {
                    // Dust
                    ctx.save();
                    ctx.globalAlpha = alpha * 0.6; // Dust is subtle
                    ctx.fillStyle = GOLD_BASE;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            requestRef.current = requestAnimationFrame(loop);
        };

        requestRef.current = requestAnimationFrame(loop);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />
    );
}
