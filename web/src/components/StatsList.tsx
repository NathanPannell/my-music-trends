import { Info } from 'lucide-react';
import { ReactNode, useRef, useState, useEffect } from 'react';

interface StatsListProps {
  icon: ReactNode;
  title: string;
  tooltipText: string;
  children: ReactNode;
}

export function StatsList({ icon, title, tooltipText, children }: StatsListProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startScrollTop, setStartScrollTop] = useState(0);

  // Handle outside click to close tooltip
  useEffect(() => {
    if (!showTooltip) return;
    const handleClickOutside = (e: MouseEvent) => {
      // If clicking strictly outside the tooltip and icon, close it.
      // We'll rely on the specific stopPropagation on the icon/tooltip elements if we want to keep them open,
      // but simpler to just attach a listener to window.
      // For now, a simple window click listener that runs in capture or bubble phase might be enough.
      // But we need to avoid closing if the click was ON the toggle button.
      // Let's keep it simple: clicking anywhere else closes it.
      // We will attach the click listener to document.
    };
    
    const listener = () => setShowTooltip(false);
    // Add a small delay or check event target to avoid immediate closing if the click that opened it bubbles up?
    // Actually, creating a separate overlay or just checking target is better.
    // Let's use a simpler approach: Toggle on click. If open, clicking anywhere (including the icon again) toggles/closes.
    // To implement "click anywhere else to close", we need a global listener.
    window.addEventListener('click', listener);
    return () => window.removeEventListener('click', listener);
  }, [showTooltip]);

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the window listener from catching this immediately if we attach it there
    setShowTooltip(!showTooltip);
  };

  const handleTooltipClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Keep open if clicking inside the tooltip text
  };

  // Custom Scrollbar Logic
  const handleScroll = () => {
    if (listRef.current && thumbRef.current && scrollbarRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      const trackHeight = scrollbarRef.current.clientHeight;
      // Calculate thumb height proportional to content
      const thumbHeight = Math.max(20, (clientHeight / scrollHeight) * trackHeight);
      
      // Calculate thumb position
      // The scrollable ratio: how much we have scrolled vs how much we can scroll
      const maxScrollTop = scrollHeight - clientHeight;
      const maxThumbTop = trackHeight - thumbHeight;
      
      if (maxScrollTop > 0) {
        const thumbTop = (scrollTop / maxScrollTop) * maxThumbTop;
        thumbRef.current.style.height = `${thumbHeight}px`;
        thumbRef.current.style.transform = `translateY(${thumbTop}px)`;
      } else {
        thumbRef.current.style.height = '0px';
      }
    }
  };

  useEffect(() => {
    // Initial calculation and listener
    const list = listRef.current;
    if (list) {
      list.addEventListener('scroll', handleScroll);
      // Determine if scrollbar is needed initially
      handleScroll();
      // Resize observer to update if content changes? 
      // For now assume static content or re-render updates.
      // Let's add a ResizeObserver just in case content loads later.
      const observer = new ResizeObserver(handleScroll);
      observer.observe(list);
      return () => {
        list.removeEventListener('scroll', handleScroll);
        observer.disconnect();
      };
    }
  }, [children]);


  // Dragging logic for custom scrollbar
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent text selection
    e.stopPropagation();
    setIsDragging(true);
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartY(clientY);
    if (listRef.current) {
      setStartScrollTop(listRef.current.scrollTop);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
       if (!listRef.current || !scrollbarRef.current) return;

       const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
       const deltaY = clientY - startY;
       
       const { scrollHeight, clientHeight } = listRef.current;
       const trackHeight = scrollbarRef.current.clientHeight;
       const thumbHeight = parseFloat(thumbRef.current?.style.height || '0');
       
       const maxScrollTop = scrollHeight - clientHeight;
       const maxThumbTop = trackHeight - thumbHeight;

       if (maxThumbTop > 0) {
           // Calculate how much scrollTop changes per pixel of thumb movement
           // deltaTop / maxThumbTop = deltaScroll / maxScrollTop
           const deltaScroll = (deltaY / maxThumbTop) * maxScrollTop;
           listRef.current.scrollTop = startScrollTop + deltaScroll;
       }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, startY, startScrollTop]);

  return (
    <div className="flex flex-col h-[400px]">
      <div className="p-4 pb-2 flex items-center gap-2 group relative cursor-pointer shrink-0" onClick={handleIconClick}>
        {icon}
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{title}</h3>
        <button 
          className="text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
          aria-label="Info"
        >
          <Info size={14} />
        </button>
        
        {/* Tooltip Popup */}
        {showTooltip && (
          <div 
            className="absolute top-10 left-4 z-50 w-64 p-3 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl text-xs text-zinc-300"
            onClick={handleTooltipClick}
          >
             <div className="absolute -top-1 left-3 w-2 h-2 bg-zinc-900 border-t border-l border-zinc-700 transform rotate-45" />
             {tooltipText}
          </div>
        )}
      </div>

      <div className="relative flex-1 min-h-0">
        {/* 
          The list container. 
          Mobile: overflow-hidden to prevent swipe scrolling the list itself (scrolling anywhere else on screen will scroll the page).
          Desktop: md:overflow-y-auto to allow standard mouse wheel scrolling.
        */}
        <div 
          ref={listRef}
          className="absolute inset-0 overflow-y-hidden md:overflow-y-auto scrollbar-hide p-4 pt-0 space-y-3"
        >
          {children}
        </div>

        {/* Custom Scrollbar Track (Visible on touch devices or always if we want consistent UI, plan said specifically for mobile but might be nice always or just hidden on desktop if native scrollbar is preferred. Plan implied unified custom scrollbar for mobile, maybe desktop uses native? 
           The plan said:
           - Desktop: Maintain overflow-y-auto behavior (standard scrolling).
           - Mobile: Set overflow-y-hidden ... Render a visible custom scrollbar on the right.
           
           So this scrollbar should probably be visible only on mobile/touch, or we can make it always visible if we hide the native one.
           The 'scrollbar-hide' utility (common in tailwind plugins or global css) hides native scrollbar.
           Let's assume we want this custom scrollbar to be the primary scroll method on mobile.
           On desktop, if we leave overflow-y-auto, the native scrollbar appears.
           We can hide the native scroll bar on desktop too (using ::-webkit-scrollbar display:none in CSS) and use this custom one for consistency, OR show this only block on mobile (md:hidden).
           
           Given the request "When I want to scroll the tracks, I will use the new, dedicated scroll bar", this suggests a precise interaction model on mobile.
           I will show this implementation on all sizes but logic handles interaction. 
           Actually, on desktop, mouse wheel usually works fine.
           I'll keep it simple: Make this scrollbar visible always, and hide native scrollbar via CSS utility `scrollbar-hide` if available or inline styles.
           The plan says "Desktop: Maintain overflow-y-auto", which implicitly might show native scrollbar. 
           Let's try to hide native scrollbar and use this one for consistent look, OR just leave native on desktop.
           The request is specifically about MOBILE issues (#2 add a scroll bar ... when touching tracks it scrolls page ... use dedicated scroll bar).
           
           So:
           Mobile (< md): overflow-y-hidden on container. Custom scrollbar VISIBLE.
           Desktop (>= md): overflow-y-auto on container. Custom scrollbar HIDDEN (or optional).
           
           Let's follow the plan exactly: "Desktop: Maintain overflow-y-auto... Mobile: Set overflow-y-hidden".
        */}
        <div 
          ref={scrollbarRef}
          className="absolute right-1 top-2 bottom-2 w-1.5 bg-white/5 rounded-full md:hidden"
          // Only visible on mobile/tablet (hidden on md+? No, md is typically 768px, tablets are often larger. Let's say hidden on lg or just keep it always visible for touch-capable? 
          // Actually, "md" breakpoint in tailwind is usually where "mobile" logic switches for grid layouts in this codebase.
          // Let's stick to showing it on small screens only as per the request context, or maybe always is safer if they want "dedicated scroll bar".
          // I will make it visible on all screens that have the 'mobile' constrained behavior. 
          // WAIT: If I set overflow-y-hidden on mobile only (className="... overflow-y-hidden md:overflow-y-auto"), then scrollbar is ONLY needed on mobile.
          // So I will hide this scrollbar on desktop: `md:hidden`.
        >
          <div 
             ref={thumbRef}
             className="w-full bg-white/30 rounded-full hover:bg-white/50 active:bg-white/70 transition-colors cursor-pointer touch-none"
             onMouseDown={handleMouseDown}
             onTouchStart={handleMouseDown}
          />
        </div>
      </div>
    </div>
  );
}
