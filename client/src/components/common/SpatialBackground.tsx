import React, { useEffect, useRef, useMemo } from 'react';
import { useZone } from '../../context/ZoneContext';

interface SpatialBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  showSpotlight?: boolean;
}

interface SpatialNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  pulsePhase: number;
  pulseSpeed: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  baseAlpha: number;
}

export const SpatialBackground: React.FC<SpatialBackgroundProps> = ({
  children,
  className = '',
  showSpotlight = true,
}) => {
  const { currentZone, zoneStatus, zoneTypeMode } = useZone();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  // Dynamic atmospheric colors matching the luxury Plum Rose light palette
  const themeColors = useMemo(() => {
    switch (zoneTypeMode) {
      case 'hackathon':
        return {
          primary: 'rgba(217, 108, 157, 0.12)', // Rose Pink
          secondary: 'rgba(241, 217, 229, 0.35)', // Pale Rose
          accent: 'rgba(109, 82, 120, 0.15)', // Deep Plum / Info
          ring: 'rgba(217, 108, 157, 0.15)',
          spotlight: 'rgba(217, 108, 157, 0.08)',
        };
      case 'campus':
        return {
          primary: 'rgba(241, 217, 229, 0.30)',
          secondary: 'rgba(217, 108, 157, 0.10)',
          accent: 'rgba(41, 33, 47, 0.08)',
          ring: 'rgba(217, 108, 157, 0.12)',
          spotlight: 'rgba(241, 217, 229, 0.15)',
        };
      case 'transit':
        return {
          primary: 'rgba(245, 237, 242, 0.40)',
          secondary: 'rgba(217, 108, 157, 0.10)',
          accent: 'rgba(183, 121, 31, 0.10)',
          ring: 'rgba(217, 108, 157, 0.12)',
          spotlight: 'rgba(241, 217, 229, 0.12)',
        };
      case 'community':
        return {
          primary: 'rgba(241, 217, 229, 0.35)',
          secondary: 'rgba(217, 108, 157, 0.12)',
          accent: 'rgba(38, 122, 98, 0.10)',
          ring: 'rgba(217, 108, 157, 0.15)',
          spotlight: 'rgba(217, 108, 157, 0.08)',
        };
      default:
        return {
          primary: 'rgba(217, 108, 157, 0.10)',
          secondary: 'rgba(241, 217, 229, 0.35)',
          accent: 'rgba(41, 33, 47, 0.06)',
          ring: 'rgba(217, 108, 157, 0.12)',
          spotlight: 'rgba(217, 108, 157, 0.08)',
        };
    }
  }, [zoneTypeMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    let animId: number | null = null;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // Parallax tracking state
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      if (isTouchDevice || prefersReducedMotion) return;
      const cx = width / 2;
      const cy = height / 2;
      targetParallaxX = ((e.clientX - cx) / cx) * 20;
      targetParallaxY = ((e.clientY - cy) / cy) * 15;

      // Update interactive spotlight
      if (spotlightRef.current && showSpotlight) {
        spotlightRef.current.style.transform = `translate3d(${e.clientX - 350}px, ${e.clientY - 350}px, 0)`;
      }
    };

    if (!isTouchDevice && !prefersReducedMotion) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
    }

    // Initialize spatial network nodes (Layer B) - minimal, refined micro-nodes
    const nodeCount = Math.min(22, Math.floor(width / 60));
    const nodes: SpatialNode[] = [];
    const colors = [
      'rgba(217, 108, 157, 0.45)', // Rose Pink
      'rgba(109, 82, 120, 0.40)', // Info / Plum
      'rgba(199, 86, 137, 0.40)', // Rose Dark
      'rgba(41, 33, 47, 0.30)', // Deep Plum
    ];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        baseRadius: Math.random() * 1.4 + 0.9,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.015 + 0.008,
        color: colors[i % colors.length],
      });
    }

    // Initialize atmospheric floating dust (Layer C) - subtle low-opacity depth
    const particleCount = prefersReducedMotion ? 0 : 28;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -Math.random() * 0.16 - 0.04,
        radius: Math.random() * 1.3 + 0.5,
        alpha: Math.random() * 0.12 + 0.03,
        baseAlpha: Math.random() * 0.12 + 0.03,
      });
    }

    let time = 0;

    // Main procedural rendering frame
    const render = () => {
      time += 0.006;

      // Spring lerp for parallax
      currentParallaxX += (targetParallaxX - currentParallaxX) * 0.035;
      currentParallaxY += (targetParallaxY - currentParallaxY) * 0.035;

      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(currentParallaxX, currentParallaxY);

      const centerX = width * 0.5;
      const centerY = height * 0.4;

      // ----------------------------------------------------
      // Layer B.1: Abstract concentric spatial zone contours
      // ----------------------------------------------------
      const ringRadii = [
        Math.min(width, height) * 0.18,
        Math.min(width, height) * 0.32,
        Math.min(width, height) * 0.48,
        Math.min(width, height) * 0.65,
      ];

      ringRadii.forEach((baseR, index) => {
        const breathingR = baseR + Math.sin(time + index * 1.2) * 4;
        ctx.beginPath();

        // Subtle topographic waviness
        const segments = 64;
        for (let s = 0; s <= segments; s++) {
          const theta = (s / segments) * Math.PI * 2;
          const wave = Math.sin(theta * 4 + time * 0.6 + index) * 2;
          const r = breathingR + wave;
          const px = centerX + Math.cos(theta) * (r * 1.25);
          const py = centerY + Math.sin(theta) * (r * 0.75);
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }

        ctx.closePath();

        const ringAlpha = Math.max(0.02, 0.08 - index * 0.015);
        ctx.strokeStyle = index === 1 && zoneStatus === 'active'
          ? themeColors.accent
          : `rgba(217, 108, 157, ${ringAlpha})`;
        ctx.lineWidth = index === 1 ? 1 : 0.8;

        if (index % 2 === 1) {
          ctx.setLineDash([4, 10]);
        } else {
          ctx.setLineDash([6, 14]);
        }

        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Spatial radar sweep arc (subtle restrained atmospheric indicator)
      if (zoneStatus === 'active' && !prefersReducedMotion) {
        const sweepAngle = (time * 0.9) % (Math.PI * 2);
        const sweepRadius = ringRadii[1] * 1.25;
        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          sweepRadius
        );
        gradient.addColorStop(0, 'rgba(217, 108, 157, 0.04)');
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, sweepRadius, sweepAngle - 0.22, sweepAngle);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Restrained active perimeter tick
        const tickX = centerX + Math.cos(sweepAngle) * sweepRadius;
        const tickY = centerY + Math.sin(sweepAngle) * (sweepRadius * 0.6);
        ctx.beginPath();
        ctx.arc(tickX, tickY, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(217, 108, 157, 0.6)';
        ctx.shadowColor = 'rgba(217, 108, 157, 0.5)';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ----------------------------------------------------
      // Layer B.2: Spatial anonymous nodes and filaments
      // ----------------------------------------------------
      nodes.forEach((node) => {
        if (!prefersReducedMotion) {
          node.x += node.vx;
          node.y += node.vy;

          if (node.x < 0) node.x = width;
          if (node.x > width) node.x = 0;
          if (node.y < 0) node.y = height;
          if (node.y > height) node.y = 0;

          node.pulsePhase += node.pulseSpeed;
        }

        const pulseScale = 1 + Math.sin(node.pulsePhase) * 0.25;
        const currentR = node.baseRadius * pulseScale;

        // Subtle soft outer glow
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentR * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.025)';
        ctx.fill();

        // Node center
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentR, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Connect nearby nodes with delicate spatial filaments
      const maxDist = Math.min(width, 170);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const filamentAlpha = (1 - dist / maxDist) * 0.07;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(148, 163, 184, ${filamentAlpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      // ----------------------------------------------------
      // Layer C: Atmospheric depth floating particles
      // ----------------------------------------------------
      particles.forEach((p) => {
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.y < 0) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(224, 242, 254, ${p.alpha * 0.65})`;
        ctx.fill();
      });

      ctx.restore();

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    // First frame render
    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (!isTouchDevice && !prefersReducedMotion) {
        window.removeEventListener('pointermove', handlePointerMove);
      }
      if (animId) {
        cancelAnimationFrame(animId);
      }
    };
  }, [themeColors, zoneStatus, showSpotlight]);

  return (
    <div
      ref={containerRef}
      className={`relative min-h-screen w-full bg-transparent dropzone-bg text-slate-100 overflow-x-hidden selection:bg-cyan-500 selection:text-white ${className}`}
    >
      {/* ========================================================= */}
      {/* LAYER A — DEEP ATMOSPHERIC HARMONIZATION LAYER */}
      {/* ========================================================= */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 opacity-20" aria-hidden="true">
        {/* Soft Radial Ambient 1: Top Center/Left (Subtle Blue / Indigo Ambient) */}
        <div
          className="absolute -top-[18%] left-[6%] w-[850px] h-[850px] md:w-[1150px] md:h-[1150px] rounded-full blur-[180px] md:blur-[220px] animate-aurora-1 mix-blend-screen transition-colors duration-1000"
          style={{
            background: `radial-gradient(circle, ${themeColors.accent} 0%, rgba(11, 41, 64, 0.08) 45%, transparent 70%)`,
          }}
        />

        {/* Soft Radial Ambient 2: Top Right (Subtle Deep-Violet Ambient) */}
        <div
          className="absolute top-[0%] -right-[10%] w-[750px] h-[750px] md:w-[1050px] md:h-[1050px] rounded-full blur-[180px] md:blur-[220px] animate-aurora-2 mix-blend-screen transition-colors duration-1000"
          style={{
            background: `radial-gradient(circle, ${themeColors.secondary} 0%, rgba(36, 20, 61, 0.08) 40%, transparent 70%)`,
          }}
        />

        {/* Soft Radial Ambient 3: Center Mid (Subtle Indigo Glow) */}
        <div
          className="absolute top-[38%] left-[22%] w-[700px] h-[700px] md:w-[900px] md:h-[900px] rounded-full blur-[180px] animate-aurora-3 mix-blend-screen transition-colors duration-1000"
          style={{
            background: `radial-gradient(circle, ${themeColors.primary} 0%, rgba(23, 27, 66, 0.08) 40%, transparent 65%)`,
          }}
        />

        {/* Bottom Ambient Floor */}
        <div
          className="absolute -bottom-[22%] left-[8%] right-[8%] h-[480px] blur-[160px] mix-blend-screen"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${themeColors.primary} 25%, ${themeColors.secondary} 75%, transparent 100%)`,
          }}
        />

        {/* ========================================================= */}
        {/* LAYER B & C — PROCEDURAL SPATIAL CANVAS */}
        {/* ========================================================= */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
        />

        {/* ========================================================= */}
        {/* LAYER D — INTERACTIVE CURSOR FOCUS SPOTLIGHT */}
        {/* ========================================================= */}
        {showSpotlight && (
          <div
            ref={spotlightRef}
            className="hidden md:block absolute top-0 left-0 w-[650px] h-[650px] rounded-full pointer-events-none opacity-35 blur-[110px] mix-blend-screen transition-opacity duration-300 z-[2]"
            style={{
              background: `radial-gradient(circle, ${themeColors.spotlight} 0%, transparent 65%)`,
              transform: 'translate3d(50vw, 300px, 0)',
              willChange: 'transform',
            }}
          />
        )}

        {/* FILM GRAIN TEXTURE (Cinematic Texture) */}
        <div className="absolute inset-0 bg-noise opacity-[0.026] pointer-events-none mix-blend-overlay z-[3]" />
      </div>

      {/* ========================================================= */}
      {/* FOREGROUND CONTENT */}
      {/* ========================================================= */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
};

// Backwards-compatible export so existing imports work seamlessly
export const AuroraBackground = SpatialBackground;
export default SpatialBackground;
