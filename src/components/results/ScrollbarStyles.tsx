
import React from "react";

const ScrollbarStyles = () => {
  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        /* Custom scrollbar styles - only visible on scroll/hover */
        .content-panel {
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
        }
        
        .content-panel::-webkit-scrollbar {
          width: 8px;
          height: 8px;
          background-color: transparent;
        }
        
        .content-panel::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 4px;
        }
        
        .content-panel::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 4px;
        }
        
        /* Show scrollbar on hover/scroll */
        .content-panel:hover::-webkit-scrollbar-thumb,
        .content-panel:focus::-webkit-scrollbar-thumb,
        .content-panel:active::-webkit-scrollbar-thumb {
          background: rgba(159, 135, 245, 0.5);
        }
        
        .content-panel:hover::-webkit-scrollbar-track,
        .content-panel:focus::-webkit-scrollbar-track,
        .content-panel:active::-webkit-scrollbar-track {
          background: rgba(226, 220, 248, 0.3);
        }
        
        /* For Firefox */
        .content-panel:hover,
        .content-panel:focus-within,
        .content-panel:active {
          scrollbar-color: rgba(159, 135, 245, 0.5) rgba(226, 220, 248, 0.3);
        }
      `
    }} />
  );
};

export default ScrollbarStyles;
