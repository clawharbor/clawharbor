'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Bankr color palette (matches official logo) ──────────────────────────────
const C = {
  cream:   '#f0e4c8',
  creamDk: '#d4c4a0',
  black:   '#1a1a1a',
  orange:  '#ff6b2b',
  yellow:  '#ffd700',
};

type PetState = 'walk' | 'idle' | 'sit' | 'wave';
type Direction = 'left' | 'right';

function BankrBot({ state, direction, tick, s = 3 }: {
  state: PetState; direction: Direction; tick: number; s?: number;
}) {
  const flip = direction === 'left';
  const legL = state === 'walk' ? (tick%2===0?-18:18) : (state==='sit'?75:0);
  const legR = state === 'walk' ? (tick%2===0?18:-18) : (state==='sit'?-75:0);
  const armL = state === 'wave' ? -60 : (state==='walk'?(tick%2===0?12:-12):5);
  const armR = state === 'walk' ? (tick%2===0?-12:12) : -5;
  const blink = tick % 40 < 2;
  const eyeH = blink ? 1 : s * 1.8;
  const px = (n: number) => `${n}px`;

  return (
    <div style={{ position:'relative', width:px(s*22), height:px(s*28),
      transform: flip?'scaleX(-1)':undefined, imageRendering:'pixelated' as any }}>

      {/* Antenna */}
      <div style={{ position:'absolute', top:px(-s*2), left:px(s*10), width:px(s*2), height:px(s*3), background:C.black, borderRadius:px(s*.3) }}/>
      <div style={{ position:'absolute', top:px(-s*3.5), left:px(s*9), width:px(s*4), height:px(s*4), background:C.orange, borderRadius:'50%', border:`${px(s*.5)} solid ${C.black}` }}/>

      {/* Head — retro TV */}
      <div style={{ position:'absolute', top:px(s*.5), left:px(s*1), width:px(s*20), height:px(s*14), background:C.cream, borderRadius:px(s*1.2), border:`${px(s*.6)} solid ${C.black}` }}>
        {/* Screen */}
        <div style={{ position:'absolute', top:px(s*1.2), left:px(s*1.5), width:px(s*12), height:px(s*10), background:C.orange, borderRadius:px(s*.7), border:`${px(s*.5)} solid ${C.black}`, overflow:'hidden' }}>
          <div style={{ position:'absolute', top:px(s*.3), left:px(s*.3), width:px(s*3), height:px(s*1.2), background:'rgba(255,255,255,0.25)', borderRadius:px(s*.3) }}/>
          <div style={{ position:'absolute', top:px(s*2), left:px(s*1.5), width:px(s*2.5), height:px(eyeH), background:C.yellow, borderRadius:px(s*.2) }}/>
          <div style={{ position:'absolute', top:px(s*2), left:px(s*6.5), width:px(s*2.5), height:px(eyeH), background:C.yellow, borderRadius:px(s*.2) }}/>
          <div style={{ position:'absolute', bottom:px(s*1.8), left:px(s*1.5), width:px(s*9), height:px(s*.8), background:C.yellow, borderRadius:px(s*.2), clipPath:'polygon(0 0,100% 0,80% 100%,20% 100%)' }}/>
        </div>
        {/* Side panel */}
        <div style={{ position:'absolute', top:px(s*1.5), right:px(s*1), width:px(s*4), height:px(s*9), background:C.creamDk, borderRadius:px(s*.4), border:`${px(s*.3)} solid rgba(26,26,26,0.3)`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:px(s*.8), padding:px(s*.5) }}>
          <div style={{ width:px(s*2.5), height:px(s*.5), background:C.black, opacity:.4, borderRadius:'1px' }}/>
          <div style={{ width:px(s*.8), height:px(s*3), background:C.black, opacity:.35, borderRadius:'1px' }}/>
          <div style={{ width:px(s*2.5), height:px(s*.5), background:C.black, opacity:.4, borderRadius:'1px' }}/>
          <div style={{ width:px(s*.8), height:px(s*2), background:C.black, opacity:.35, borderRadius:'1px' }}/>
        </div>
        {/* Chin */}
        <div style={{ position:'absolute', bottom:px(s*.8), left:px(s*1.5), width:px(s*6), height:px(s*1.2), background:C.creamDk, borderRadius:px(s*.3), border:`${px(s*.2)} solid rgba(26,26,26,0.3)` }}/>
      </div>

      {/* Body */}
      <div style={{ position:'absolute', top:px(s*15), left:px(s*4), width:px(s*14), height:px(s*8), background:C.cream, borderRadius:px(s*.6), border:`${px(s*.6)} solid ${C.black}` }}>
        <div style={{ position:'absolute', top:px(s*1.5), left:px(s*2), width:px(s*6), height:px(s*4), background:C.creamDk, borderRadius:px(s*.4), border:`${px(s*.3)} solid rgba(26,26,26,0.3)` }}>
          <div style={{ margin:`${px(s*.5)} auto 0`, width:px(s*3), height:px(s*.7), background:C.orange, borderRadius:'1px', opacity:.8 }}/>
          <div style={{ margin:`${px(s*.4)} auto 0`, width:px(s*4), height:px(s*.7), background:C.orange, borderRadius:'1px', opacity:.5 }}/>
        </div>
      </div>

      {/* Left arm */}
      <div style={{ position:'absolute', top:px(s*15.5), left:px(s*1), width:px(s*3.5), height:px(s*7), background:C.cream, borderRadius:px(s*.5), border:`${px(s*.5)} solid ${C.black}`, transform:`rotate(${armL}deg)`, transformOrigin:'top center', transition:'transform .25s' }}>
        {state === 'wave' && <div style={{ position:'absolute', top:px(-s), left:px(-s), width:px(s*2), height:px(s*2), background:C.cream, borderRadius:'50%', border:`${px(s*.4)} solid ${C.black}` }}/>}
      </div>

      {/* Right arm */}
      <div style={{ position:'absolute', top:px(s*15.5), right:px(s*1), width:px(s*3.5), height:px(s*7), background:C.cream, borderRadius:px(s*.5), border:`${px(s*.5)} solid ${C.black}`, transform:`rotate(${armR}deg)`, transformOrigin:'top center', transition:'transform .25s' }}/>

      {/* Left leg */}
      <div style={{ position:'absolute', top:px(s*22.5), left:px(s*5), width:px(s*4), height:px(s*6), background:C.cream, borderRadius:px(s*.4), border:`${px(s*.5)} solid ${C.black}`, transform:`rotate(${legL}deg)`, transformOrigin:'top center', transition:'transform .2s' }}>
        <div style={{ position:'absolute', bottom:px(-s*.4), left:px(-s*.5), width:px(s*5), height:px(s*1.5), background:C.orange, borderRadius:px(s*.4), border:`${px(s*.4)} solid ${C.black}` }}/>
      </div>

      {/* Right leg */}
      <div style={{ position:'absolute', top:px(s*22.5), right:px(s*5), width:px(s*4), height:px(s*6), background:C.cream, borderRadius:px(s*.4), border:`${px(s*.5)} solid ${C.black}`, transform:`rotate(${legR}deg)`, transformOrigin:'top center', transition:'transform .2s' }}>
        <div style={{ position:'absolute', bottom:px(-s*.4), right:px(-s*.5), width:px(s*5), height:px(s*1.5), background:C.orange, borderRadius:px(s*.4), border:`${px(s*.4)} solid ${C.black}` }}/>
      </div>
    </div>
  );
}

const PET_QUIPS = [
  'gm ser 🌅','$BNKR to the moon','running on Base ⚡','LFG!','*beep boop*',
  'on-chain vibes','ser, your agents need payroll','buy high sell never',
  'based and orange-pilled','executing swap...','wen lambo?','skill installed ✅',
];

function SpeechBubble({ text, flipped }: { text: string; flipped: boolean }) {
  return (
    <div style={{ position:'absolute', bottom:'105%', [flipped?'right':'left']:0,
      background:'rgba(255,255,255,0.97)', color:C.black, fontSize:11,
      fontFamily:'monospace', fontWeight:700, padding:'4px 8px', borderRadius:8,
      whiteSpace:'nowrap', border:`2px solid ${C.orange}`, zIndex:100, pointerEvents:'none' }}>
      {text}
      <div style={{ position:'absolute', bottom:-8, [flipped?'right':'left']:10,
        width:0, height:0, borderLeft:'5px solid transparent', borderRight:'5px solid transparent',
        borderTop:`8px solid ${C.orange}` }}/>
    </div>
  );
}

export function OfficePet({ containerWidth = 800, scale = 1 }: { containerWidth?: number; scale?: number }) {
  const s = 3 * scale;
  const petWidth = s * 22;

  const [x, setX] = useState(containerWidth / 2);
  const [petState, setPetState] = useState<PetState>('idle');
  const [direction, setDirection] = useState<Direction>('right');
  const [quip, setQuip] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [hovered, setHovered] = useState(false);

  const xRef = useRef(x);
  const frameRef = useRef<number | undefined>(undefined);
  xRef.current = x;

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const decide = () => {
      const rand = Math.random();
      if (rand < 0.45) {
        const target = Math.random() * (containerWidth - petWidth * 2) + petWidth;
        setDirection(target > xRef.current ? 'right' : 'left');
        setPetState('walk');
        const startX = xRef.current;
        const duration = (Math.abs(target - startX) / (1.5 * scale)) * 16;
        let startTime: number | null = null;
        const animate = (time: number) => {
          if (!startTime) startTime = time;
          const progress = Math.min((time - startTime) / duration, 1);
          const newX = startX + (target - startX) * progress;
          setX(newX); xRef.current = newX;
          if (progress < 1) { frameRef.current = requestAnimationFrame(animate); }
          else { setPetState('idle'); timeout = setTimeout(decide, 800 + Math.random()*1200); }
        };
        frameRef.current = requestAnimationFrame(animate);
      } else if (rand < 0.65) {
        setPetState('sit');
        timeout = setTimeout(() => { setPetState('idle'); timeout = setTimeout(decide, 500); }, 2000 + Math.random()*2000);
      } else {
        setPetState('wave');
        setQuip(PET_QUIPS[Math.floor(Math.random()*PET_QUIPS.length)]);
        timeout = setTimeout(() => { setQuip(null); setPetState('idle'); timeout = setTimeout(decide, 600); }, 2500);
      }
    };
    timeout = setTimeout(decide, 1200);
    return () => { clearTimeout(timeout); if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [containerWidth, petWidth, scale]);

  const handleClick = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    setPetState('wave');
    setQuip(PET_QUIPS[Math.floor(Math.random()*PET_QUIPS.length)]);
    setTimeout(() => { setQuip(null); setPetState('idle'); }, 2500);
  }, []);

  return (
    <div style={{ position:'absolute', left:Math.max(0, Math.min(x, containerWidth - petWidth)),
      bottom:0, width:petWidth, cursor:'pointer', zIndex:10, userSelect:'none' }}
      onClick={handleClick} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      title="Bankr Bot 🤖 — click me!">
      {hovered && <div style={{ position:'absolute', bottom:-4, left:'50%', transform:'translateX(-50%)',
        width:petWidth*.8, height:petWidth*.2, background:'rgba(255,107,43,0.3)', borderRadius:'50%', filter:'blur(6px)' }}/>}
      {quip && <SpeechBubble text={quip} flipped={direction==='left'}/>}
      <BankrBot state={petState} direction={direction} tick={tick} s={s}/>
      {hovered && <div style={{ position:'absolute', bottom:-18, left:'50%', transform:'translateX(-50%)',
        fontSize:9, fontFamily:'monospace', color:C.orange, whiteSpace:'nowrap', fontWeight:700, letterSpacing:1 }}>
        BANKR BOT
      </div>}
    </div>
  );
}
