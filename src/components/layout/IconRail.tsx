/**
 * COSMIC ICON RAIL
 * Collapsible navigation with Cosmic Cockpit Elegance styling
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, User, PanelLeftOpen, PanelLeftClose, Menu } from 'lucide-react';
import { MAIN_NAV_ITEMS, BOTTOM_NAV_ITEMS } from './nav-config';
import { RailItem } from './RailItem';
import { useNavPreference } from '../../lib/hooks/useNavPreference';
import { cn } from '../../lib/utils';
import { RailTooltip } from './RailTooltip';
import { motion, AnimatePresence } from 'framer-motion';

export const IconRail: React.FC = () => {
  const { isPinned, setPinned, isExpanded, setIsExpanded } = useNavPreference();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input focused
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      // Toggle pin on '['
      if (e.key === '[' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPinned(!isPinned);
      }

      // 1-5 navigation
      if (e.key >= '1' && e.key <= '5') {
        const index = parseInt(e.key) - 1;
        if (index < MAIN_NAV_ITEMS.length) {
          navigate(MAIN_NAV_ITEMS[index].path);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPinned, setPinned, navigate]);

  const railWidth = isExpanded ? 240 : 72;

  // Mobile Overlay Logic
  if (isMobile) {
    return (
      <>
        {/* Mobile Trigger - Cosmic styled */}
        {!mobileOpen && (
          <button
            onClick={() => setMobileOpen(true)}
            className="fixed bottom-4 left-4 z-50 p-3 rounded-full bg-gradient-to-r from-energy-teal to-teal-500 text-void shadow-lg shadow-energy-teal/30 md:hidden"
          >
            <Menu size={20} />
          </button>
        )}

        <AnimatePresence>
          {mobileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 bg-void z-40 md:hidden"
              />

              {/* Mobile Drawer - Cosmic Glass */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 bottom-0 w-[280px] bg-glass-frosted backdrop-blur-xl border-r border-glass-edge z-50 flex flex-col md:hidden"
              >
                {/* Inner glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-energy-teal/[0.03] to-transparent pointer-events-none" />

                {/* Mobile Header */}
                <div className="relative h-16 flex items-center px-5 border-b border-glass-edge">
                  <div className="flex items-center gap-3">
                    {/* Logo with glow */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-energy-teal/30 blur-xl rounded-full" />
                      <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-energy-teal to-teal-500 flex items-center justify-center shadow-lg shadow-energy-teal/25">
                        <Activity className="w-5 h-5 text-void" />
                      </div>
                    </div>
                    <span className="font-display font-semibold text-lg text-stardust-warm tracking-tight">
                      Codra
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="ml-auto p-2 rounded-lg text-stardust-muted hover:text-stardust hover:bg-white/[0.06] transition-colors"
                  >
                    <PanelLeftClose size={18} />
                  </button>
                </div>

                {/* Mobile Nav Items */}
                <div className="relative flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                  {MAIN_NAV_ITEMS.map((item, i) => (
                    <RailItem key={item.path} {...item} isExpanded={true} index={i} />
                  ))}
                </div>

                {/* Mobile Footer */}
                <div className="relative p-3 border-t border-glass-edge">
                  {BOTTOM_NAV_ITEMS.map((item, i) => (
                    <RailItem key={item.path} {...item} isExpanded={true} index={i} />
                  ))}

                  {/* User Profile - Cosmic Glass */}
                  <div className="mt-4 flex items-center rounded-xl border border-glass-edge bg-white/[0.04] cursor-pointer hover:bg-white/[0.08] transition-all duration-200 px-3 py-2.5 gap-3">
                    <RailTooltip content="User Profile" disabled={true} side="right">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    </RailTooltip>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-stardust truncate">Sarah Sahl</div>
                      <div className="text-xs text-stardust-muted truncate">Pro Plan</div>
                    </div>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop Rail - Cosmic Cockpit Style
  return (
    <motion.aside
      initial={false}
      animate={{ width: railWidth }}
      transition={{
        duration: isExpanded ? 0.2 : 0.15,
        ease: isExpanded ? "easeOut" : "easeIn"
      }}
      className="fixed left-0 top-0 h-screen z-40 flex flex-col overflow-hidden"
      onMouseEnter={() => !isPinned && setIsExpanded(true)}
      onMouseLeave={() => !isPinned && setIsExpanded(false)}
    >
      {/* Glass background */}
      <div
        className="absolute inset-0 backdrop-blur-xl border-r"
        style={{
          backgroundColor: 'rgba(8, 10, 14, 0.6)', // Taste Governor: 0.6 opacity
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Inner glow effect */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(0, 217, 217, 0.03), transparent)' }}
        />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className={cn("h-16 flex items-center transition-all", isExpanded ? "px-5" : "px-0 justify-center")}>
          <div className="flex items-center gap-3">
            {/* Logo with glow */}
            <div className="relative">
              <div
                className="absolute inset-0 blur-xl rounded-full"
                style={{ backgroundColor: 'rgba(0, 217, 217, 0.3)' }}
              />
              <div
                className="relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(to bottom right, #00D9D9, #14B8A6)',
                  boxShadow: '0 10px 25px -5px rgba(0, 217, 217, 0.25)'
                }}
              >
                <Activity className="w-5 h-5" style={{ color: '#050608' }} />
              </div>
            </div>


            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="font-display font-semibold text-lg text-stardust-warm tracking-tight whitespace-nowrap"
                >
                  Codra
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {isExpanded && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-auto p-1.5 rounded-lg text-stardust-muted hover:text-stardust hover:bg-white/[0.06] transition-colors"
              onClick={() => setPinned(!isPinned)}
            >
              {isPinned ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </motion.button>
          )}
        </div>

        {/* Nav - with cosmic styling */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-x-hidden overflow-y-auto custom-scrollbar">
          {MAIN_NAV_ITEMS.map((item, i) => (
            <RailItem key={item.path} {...item} isExpanded={isExpanded} index={i} />
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-glass-edge space-y-1">
          {BOTTOM_NAV_ITEMS.map((item, i) => (
            <RailItem key={item.path} {...item} isExpanded={isExpanded} index={i} />
          ))}

          {/* User Profile - Cosmic Glass */}
          <div className={cn(
            "mt-4 flex items-center rounded-xl cursor-pointer transition-all duration-200 overflow-hidden",
            isExpanded
              ? "px-3 py-2.5 gap-3 border border-glass-edge bg-white/[0.04] hover:bg-white/[0.08]"
              : "justify-center w-10 h-10 mx-auto p-0 border-none bg-transparent hover:bg-white/[0.06]"
          )}>
            <RailTooltip content="User Profile" disabled={isExpanded} side="right">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                <User className="w-4 h-4 text-white" />
              </div>
            </RailTooltip>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex-1 min-w-0"
                >
                  <div className="text-sm font-medium text-stardust truncate">Sarah Sahl</div>
                  <div className="text-xs text-stardust-muted truncate">Pro Plan</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};
