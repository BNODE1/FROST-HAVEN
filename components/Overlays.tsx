
import React from 'react';

interface OverlaysProps {
  freezeOpacity: number;
  coldSnap: boolean;
}

export const Overlays: React.FC<OverlaysProps> = ({ freezeOpacity, coldSnap }) => {
  return (
    <>
      <div 
        className="pointer-events-none fixed inset-0 z-50 transition-all duration-1000 ease-in-out" 
        style={{ 
          boxShadow: `inset 0 0 ${100 * freezeOpacity}px ${20 * freezeOpacity}px rgba(186, 230, 253, ${freezeOpacity})`,
          opacity: freezeOpacity,
          backdropFilter: `grayscale(${freezeOpacity * 80}%) blur(${freezeOpacity * 2}px)`
        }}
      >
         <div className="absolute inset-0 bg-blue-100/10 mix-blend-overlay"></div>
      </div>
      
      {coldSnap && (
         <div className="fixed inset-0 z-40 bg-cyan-500/10 mix-blend-color-dodge animate-pulse pointer-events-none border-[10px] border-cyan-400/30"></div>
      )}
    </>
  );
};
