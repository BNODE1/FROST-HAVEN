
import React, { useRef, useEffect } from 'react';
import { GameState, VisualEffect } from '../types';
import { User, Skull, Hammer, Plus } from 'lucide-react';

interface GameCanvasProps {
  state: GameState;
  effects: VisualEffect[];
  onRepair: () => void;
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'snow' | 'fire' | 'spark' | 'star' | 'smoke' | 'meteor';

  constructor(w: number, h: number, type: 'snow' | 'fire' | 'spark' | 'star' | 'smoke' | 'meteor', blizzard: boolean, fireX: number) {
    this.type = type;
    if (type === 'snow') {
      this.x = Math.random() * w;
      this.y = -10;
      this.size = Math.random() * 2 + 1;
      this.maxLife = 200;
      this.life = this.maxLife;
      const speed = blizzard ? 10 : 2;
      this.vy = Math.random() * speed + 2;
      this.vx = (Math.random() - 0.5) * 0.5 + (blizzard ? 5 : 0);
      this.color = `rgba(200, 240, 255, ${Math.random() * 0.6 + 0.4})`;
    } else if (type === 'meteor') {
      this.x = Math.random() * w;
      this.y = -50;
      this.size = Math.random() * 4 + 2;
      this.maxLife = 100;
      this.life = this.maxLife;
      this.vx = (Math.random() - 0.5) * 5;
      this.vy = Math.random() * 10 + 10;
      this.color = '#ef4444';
    } else if (type === 'fire') {
      this.x = fireX + (Math.random() - 0.5) * 20;
      this.y = h - 60; 
      this.size = Math.random() * 6 + 4;
      this.vy = -Math.random() * 2 - 1;
      this.vx = (Math.random() - 0.5) * 1;
      this.maxLife = Math.random() * 30 + 10;
      this.life = this.maxLife;
      this.color = '#f97316'; 
    } else if (type === 'smoke') {
      this.x = fireX + (Math.random() - 0.5) * 15;
      this.y = h - 80;
      this.size = Math.random() * 8 + 4;
      this.vy = -Math.random() * 2 - 1;
      this.vx = (Math.random() - 0.5) * 2;
      this.maxLife = 80;
      this.life = this.maxLife;
      this.color = 'rgba(50, 50, 80, 0)'; 
    } else if (type === 'spark') {
      this.x = fireX + (Math.random() - 0.5) * 10;
      this.y = h - 70;
      this.size = Math.random() * 2;
      this.vy = -Math.random() * 5 - 2;
      this.vx = (Math.random() - 0.5) * 4;
      this.maxLife = 40;
      this.life = this.maxLife;
      this.color = '#fbbf24'; 
    } else { // Star
      this.x = Math.random() * w;
      this.y = Math.random() * (h * 0.6);
      this.size = Math.random() * 2;
      this.vx = 0;
      this.vy = 0;
      this.maxLife = 1000;
      this.life = 1000;
      this.color = `rgba(148, 163, 184, ${Math.random() * 0.8})`; 
    }
  }

  update(blizzard: boolean) {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    if (this.type === 'snow' && Math.random() < 0.01) this.x += (Math.random() - 0.5) * 20;
  }
}

const GameCanvas: React.FC<GameCanvasProps> = ({ state, effects, onRepair }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const initializedRef = useRef(false);
  const stateRef = useRef(state);

  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      if (canvas.parentElement) {
         canvas.width = canvas.parentElement.offsetWidth;
         canvas.height = canvas.parentElement.offsetHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    if (!initializedRef.current) {
        for(let i=0; i<50; i++) particlesRef.current.push(new Particle(canvas.width, canvas.height, 'star', false, 0));
        initializedRef.current = true;
    }

    const drawMountains = (ctx: CanvasRenderingContext2D, w: number, baseY: number) => {
        ctx.fillStyle = '#0f172a'; // Dark slate
        ctx.beginPath();
        ctx.moveTo(0, baseY);
        ctx.lineTo(w * 0.2, baseY - 150);
        ctx.lineTo(w * 0.5, baseY - 50);
        ctx.lineTo(w * 0.8, baseY - 180);
        ctx.lineTo(w, baseY);
        ctx.fill();
        
        // Peaks
        ctx.fillStyle = '#e2e8f0'; // Snow
        ctx.beginPath();
        ctx.moveTo(w * 0.2, baseY - 150);
        ctx.lineTo(w * 0.25, baseY - 110);
        ctx.lineTo(w * 0.15, baseY - 110);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(w * 0.8, baseY - 180);
        ctx.lineTo(w * 0.85, baseY - 140);
        ctx.lineTo(w * 0.75, baseY - 140);
        ctx.fill();
    };

    const drawTrees = (ctx: CanvasRenderingContext2D, baseY: number) => {
        const treeCount = 8;
        const startX = 20;
        const gap = 15;
        
        for(let i=0; i<treeCount; i++) {
            const h = 70 + Math.random() * 20;
            const x = startX + (i * gap);
            // Trunk
            ctx.fillStyle = '#3f2c20';
            ctx.fillRect(x - 2, baseY - 10, 4, 10);
            // Leaves
            ctx.fillStyle = '#064e3b'; 
            ctx.beginPath();
            ctx.moveTo(x, baseY - h);
            ctx.lineTo(x + 12, baseY - 10);
            ctx.lineTo(x - 12, baseY - 10);
            ctx.fill();
        }
    };

    const drawLake = (ctx: CanvasRenderingContext2D, w: number, baseY: number) => {
        const lakeX = w - 90;
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.ellipse(lakeX, baseY + 15, 60, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 1;
        ctx.stroke();
    };

    // Draw procedural shelter based on level
    const drawShelter = (ctx: CanvasRenderingContext2D, w: number, h: number, level: number, health: number) => {
        if (level < 2) return; // Level 1 is just fire
        
        const cx = w / 2;
        const groundY = h - 60;
        
        ctx.save();
        
        // Damage shake/tint
        if (health < 50) {
           ctx.shadowColor = 'red';
           ctx.shadowBlur = (50 - health) * 0.5;
        }

        if (level === 2) { // Tent
            ctx.fillStyle = '#475569'; // Slate tent
            ctx.beginPath();
            ctx.moveTo(cx, groundY - 60);
            ctx.lineTo(cx + 40, groundY);
            ctx.lineTo(cx - 40, groundY);
            ctx.fill();
            
            // Opening
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.moveTo(cx, groundY - 60);
            ctx.lineTo(cx + 10, groundY);
            ctx.lineTo(cx - 10, groundY);
            ctx.fill();
            
            // Snow on top
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.moveTo(cx, groundY - 60);
            ctx.lineTo(cx + 15, groundY - 40);
            ctx.lineTo(cx - 15, groundY - 40);
            ctx.fill();
        } 
        else if (level === 3) { // Cabin
            const width = 80;
            const height = 50;
            
            // Walls
            ctx.fillStyle = '#573318'; // Wood
            ctx.fillRect(cx - width/2, groundY - height, width, height);
            
            // Roof
            ctx.fillStyle = '#334155'; // Dark roof
            ctx.beginPath();
            ctx.moveTo(cx, groundY - height - 40);
            ctx.lineTo(cx + width/2 + 10, groundY - height);
            ctx.lineTo(cx - width/2 - 10, groundY - height);
            ctx.fill();
            
            // Door
            ctx.fillStyle = '#1e1b15';
            ctx.fillRect(cx - 10, groundY - 30, 20, 30);
            
            // Window
            ctx.fillStyle = '#fef08a'; // Light
            ctx.fillRect(cx - 30, groundY - 30, 15, 15);
            ctx.fillRect(cx + 15, groundY - 30, 15, 15);
        }
        else if (level >= 4) { // Fortress
            const width = 120;
            const height = 70;
            
            // Main Keep
            ctx.fillStyle = '#475569'; // Stone
            ctx.fillRect(cx - width/2, groundY - height, width, height);
            
            // Battlements
            ctx.fillStyle = '#334155';
            for(let i=0; i<5; i++) {
                ctx.fillRect((cx - width/2) + (i * 24), groundY - height - 10, 15, 10);
            }
            
            // Gate
            ctx.fillStyle = '#1e1b15';
            ctx.beginPath();
            ctx.arc(cx, groundY, 25, Math.PI, 0);
            ctx.fill();
            
            // Windows
            ctx.fillStyle = '#0ea5e9'; // Magic light
            ctx.fillRect(cx - 40, groundY - 40, 10, 20);
            ctx.fillRect(cx + 30, groundY - 40, 10, 20);
        }
        
        ctx.restore();
    };

    let animationFrameId: number;

    const render = () => {
      if (!canvas || !ctx) return;
      const { width: w, height: h } = canvas;
      const curState = stateRef.current; 
      
      const freezeFactor = Math.min(1, Math.max(0, -curState.temperature / 40));
      const time = curState.timeOfDay;
      const isNight = time < 20 || time > 80;
      const isOverload = curState.comboMultiplier > 4.8;

      if (isOverload) {
          const shakeX = (Math.random() - 0.5) * 4;
          const shakeY = (Math.random() - 0.5) * 4;
          ctx.translate(shakeX, shakeY);
      }

      // Sky
      let skyTop = isNight ? '#020617' : '#1e1b4b'; 
      let skyBot = isNight ? '#1e293b' : '#4c1d95'; 
      if (curState.isMeteorShower) skyTop = '#450a0a'; // Red sky

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, skyTop);
      grad.addColorStop(1, skyBot);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Stars
      for (let p of particlesRef.current) {
        if (p.type === 'star') {
           ctx.fillStyle = p.color;
           ctx.fillRect(p.x, p.y, p.size, p.size);
        }
      }
      
      // Floor
      const horizonY = h - 120;
      drawMountains(ctx, w, horizonY);
      
      const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
      groundGrad.addColorStop(0, '#111827'); 
      groundGrad.addColorStop(1, '#1f2937');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, horizonY, w, h - horizonY);

      drawTrees(ctx, horizonY); // Back trees
      drawLake(ctx, w, horizonY);
      
      // Draw Shelter on Canvas
      drawShelter(ctx, w, h, curState.shelterLevel, curState.shelterHealth);

      const fireX = w / 2;
      const fireIntensity = Math.max(0.1, curState.fireLevel / 100);

      // Particle Spawning
      if (curState.isMeteorShower && Math.random() < 0.1) {
          particlesRef.current.push(new Particle(w, h, 'meteor', false, 0));
      }
      
      const snowCount = curState.isBlizzard ? 10 : 2;
      for (let i = 0; i < snowCount; i++) {
        if (Math.random() > 0.1) 
           particlesRef.current.push(new Particle(w, h, 'snow', curState.isBlizzard, fireX));
      }

      if (curState.fireLevel > 0) {
        const fireCount = Math.ceil(fireIntensity * 3);
        for(let i=0; i<fireCount; i++) particlesRef.current.push(new Particle(w, h, 'fire', false, fireX));
        if (Math.random() < fireIntensity * 0.3) particlesRef.current.push(new Particle(w, h, 'spark', false, fireX));
        if (Math.random() < fireIntensity * 0.2) particlesRef.current.push(new Particle(w, h, 'smoke', curState.isBlizzard, fireX));
      }

      // Particle Updates & Draw
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        if (p.type === 'star') continue; 
        p.update(curState.isBlizzard);
        if (p.life <= 0 || p.y > h) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        
        if (p.type === 'meteor') {
            ctx.strokeStyle = '#f87171';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.fillRect(p.x, p.y, 4, 4);
        } else if (p.type === 'snow') {
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        } else if (p.type === 'spark') {
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        } else if (p.type === 'smoke') {
          const alpha = (p.life / p.maxLife) * 0.3;
          ctx.fillStyle = `rgba(100, 116, 139, ${alpha})`; 
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else { // Fire
          const lifeRatio = p.life / p.maxLife;
          ctx.fillStyle = `rgba(249, 115, 22, ${lifeRatio})`;
          ctx.beginPath();
          const s = p.size * lifeRatio;
          ctx.moveTo(p.x, p.y - s);
          ctx.lineTo(p.x + s, p.y + s);
          ctx.lineTo(p.x - s, p.y + s);
          ctx.fill();
        }
      }
      
      // Golden Bonus (Cube)
      if (curState.goldenSnowflake) {
          const { x, y } = curState.goldenSnowflake;
          const sx = (x / 100) * w;
          const sy = (y / 100) * h;
          
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.rect(sx - 10, sy - 10, 20, 20); // Simple glowing cube
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Inner detail
          ctx.strokeStyle = '#fffbeb';
          ctx.lineWidth = 2;
          ctx.strokeRect(sx - 6, sy - 6, 12, 12);
      }

      if (isOverload) {
          ctx.setTransform(1, 0, 0, 1, 0, 0); 
      }
      
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  const isNight = state.timeOfDay < 20 || state.timeOfDay > 80;
  const isDangerous = (isNight && state.fireLevel < 40) || state.isMeteorShower || state.wolvesActive;

  return (
    <div className={`relative w-full h-[350px] bg-slate-950 overflow-hidden select-none transition-all duration-1000 border-b border-blue-500/20 ${state.isBlizzard ? 'animate-[shake_0.5s_ease-in-out_infinite]' : ''}`}>
      <style>{`
        @keyframes chop {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(-45deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes walk-left {
          0% { transform: translateX(0); }
          50% { transform: translateX(-20px); }
          100% { transform: translateX(0); }
        }
        @keyframes walk-right {
          0% { transform: translateX(0); }
          50% { transform: translateX(20px); }
          100% { transform: translateX(0); }
        }
        @keyframes floatUp {
          0% { transform: translate(-50%, -50%) translateY(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) translateY(-50px); opacity: 0; }
        }
      `}</style>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Shelter Health Bar (Floating above shelter) - Moved LOWER to bottom-130px */}
      {state.shelterLevel > 1 && (
          <div 
             className="absolute bottom-[130px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-30 cursor-pointer group active:scale-95 transition-transform"
             onClick={onRepair}
          >
              <div className="flex items-center gap-1">
                 <div className="w-24 h-3 bg-slate-900 border border-slate-600 rounded-full overflow-hidden shadow-lg relative">
                      <div 
                        className={`h-full ${state.shelterHealth > 50 ? 'bg-green-500' : state.shelterHealth > 20 ? 'bg-yellow-500' : 'bg-red-500'} transition-all duration-300`} 
                        style={{ width: `${state.shelterHealth}%` }}
                      ></div>
                  </div>
                  {state.shelterHealth < 100 && (
                      <div className="bg-slate-900 rounded-full p-1 border border-slate-600 text-slate-400 group-hover:text-green-400 transition-colors">
                          <Hammer size={10} />
                      </div>
                  )}
              </div>
          </div>
      )}
      
      {/* WORKERS VISUALIZATION */}
      <div className="absolute inset-0 pointer-events-none z-20">
        
        {/* Wood Workers (Forest Zone - In Front of Trees) */}
        {Array.from({ length: state.workers.wood }).map((_, i) => (
          <div 
            key={`wood-${i}`} 
            className="absolute bottom-28 z-20 transition-all" 
            style={{ 
                left: `${15 + (i * 4)}%`, 
                animation: `chop ${1 + Math.random()}s infinite ease-in-out` 
            }}
          >
             <div className="flex flex-col items-center">
                 <User size={28} className="text-emerald-300 drop-shadow-[0_0_5px_rgba(52,211,153,1)]" fill="#064e3b" />
                 {/* Axe graphic for clarity */}
                 <div className="w-1 h-4 bg-emerald-600 absolute top-2 right-0 rotate-45 origin-bottom-left"></div>
             </div>
          </div>
        ))}
        
        {/* Food Workers (Lake Zone - Fishing) */}
        {Array.from({ length: state.workers.food }).map((_, i) => (
          <div 
            key={`food-${i}`} 
            className="absolute bottom-24 transition-all" 
            style={{ 
                right: `${15 + (i * 3)}%`, 
                animation: `walk-right ${4 + Math.random()}s infinite ease-in-out` 
            }}
          >
             <User size={24} className="text-blue-300 drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]" />
          </div>
        ))}

        {/* Fire Workers (Center - Stoking) */}
        {Array.from({ length: state.workers.fire }).map((_, i) => (
          <div 
             key={`fire-${i}`} 
             className="absolute bottom-24 transition-all" 
             style={{ 
                 left: `${45 + (i * 3)}%`,
             }}
          >
             <User size={24} className="text-orange-300 animate-pulse drop-shadow-[0_0_5px_rgba(251,146,60,0.8)]" />
          </div>
        ))}

         {/* Idle Workers (Wandering near shelter) */}
         {Array.from({ length: Math.max(0, state.survivors - state.sick - (state.workers.wood + state.workers.food + state.workers.fire + state.workers.scout)) }).map((_, i) => (
          <div 
             key={`idle-${i}`} 
             className="absolute bottom-24 transition-all" 
             style={{ 
                 left: '50%', 
                 transform: `translateX(${(i - 1) * 15}px)`,
                 animation: `walk-right ${4 + Math.random()}s infinite alternate`
             }}
          >
             <User size={24} className="text-slate-400 opacity-80" />
          </div>
        ))}

        {/* Sick Workers (Lying down) */}
        {Array.from({ length: state.sick }).map((_, i) => (
          <div 
             key={`sick-${i}`} 
             className="absolute bottom-20 transition-all" 
             style={{ 
                 left: '50%', 
                 transform: `translateX(${(i + 1) * 20}px) rotate(90deg)`,
             }}
          >
             <div className="flex flex-col items-center">
                 <div className="absolute -left-4 top-2 animate-pulse text-red-500 font-bold text-xs"><Skull size={10} /></div>
                 <User size={24} className="text-red-800 fill-red-950 opacity-80" />
             </div>
          </div>
        ))}
        
        {/* WOLF PACK VISUALS */}
        {state.wolvesActive && (
            <>
                <div className="absolute bottom-28 left-[5%] animate-pulse z-10">
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_5px_red]"></div>
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_5px_red]"></div>
                    </div>
                </div>
                <div className="absolute bottom-32 left-[12%] animate-pulse delay-75 z-10">
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_5px_red]"></div>
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_5px_red]"></div>
                    </div>
                </div>
                <div className="absolute bottom-26 left-[20%] animate-pulse delay-150 z-10">
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_5px_red]"></div>
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_5px_red]"></div>
                    </div>
                </div>
            </>
        )}

         {/* Scout */}
         {state.workers.scout > 0 && (
           <div className="absolute bottom-32 right-0 transition-all duration-[10s] ease-linear -translate-x-full">
               <User size={24} className="text-purple-400 animate-pulse" />
           </div>
         )}
      </div>

      {/* DANGER VISUALS */}
      {isDangerous && (
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-red-900/20 to-transparent pointer-events-none animate-pulse"></div>
      )}

      {effects.map(effect => (
         <div 
            key={effect.id} 
            className={`absolute font-black text-2xl pointer-events-none drop-shadow-md ${effect.color} z-50 whitespace-nowrap`} 
            style={{ 
                left: `${effect.x}%`, 
                top: `${effect.y}%`, 
                animation: 'floatUp 0.8s ease-out forwards' 
            }}
         >
           {effect.text}
         </div>
      ))}

      <div className="absolute inset-0 pointer-events-none z-30 opacity-10 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
      
      {state.beaconProgress >= 100 && (
         <div className="absolute inset-0 bg-green-500/20 pointer-events-none z-50 animate-pulse"></div>
      )}

      {state.isBlizzard && <div className="absolute inset-0 bg-white/40 pointer-events-none z-50 mix-blend-overlay backdrop-blur-[2px]"></div>}
    </div>
  );
};

export default GameCanvas;
