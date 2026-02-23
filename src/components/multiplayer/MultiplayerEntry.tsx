import React from "react";

interface MultiplayerEntryProps {
  onSinglePlayer: () => void;
  onMultiplayer: () => void;
}

export default function MultiplayerEntry({ onSinglePlayer, onMultiplayer }: MultiplayerEntryProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Court arc decoratives */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{ border: '1px solid hsl(38 95% 52% / 0.04)' }} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{ border: '1px solid hsl(38 95% 52% / 0.06)' }} />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 0%, hsl(38 95% 52% / 0.05) 0%, transparent 60%)' }} />
      </div>

      <div className="relative text-center mb-12 animate-fade-in">
        {/* Basketball icon */}
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'hsl(38 95% 52% / 0.1)', border: '1px solid hsl(38 95% 52% / 0.25)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="hsl(38 95% 55%)" strokeWidth={1.5} style={{width:40,height:40}}>
            <circle cx="12" cy="12" r="9.75" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25v19.5M2.25 12h19.5M4.5 6.75c2 2 4 3.75 7.5 3.75s5.5-1.75 7.5-3.75M4.5 17.25c2-2 4-3.75 7.5-3.75s5.5 1.75 7.5 3.75" />
          </svg>
        </div>
        <h1 className="font-display text-6xl sm:text-7xl text-foreground tracking-wider mb-2">BASKETBALL</h1>
        <h2 className="font-display text-3xl sm:text-4xl tracking-widest" style={{ color: 'hsl(38 95% 55%)' }}>MANAGER</h2>
        <p className="text-muted-foreground mt-3 text-sm font-condensed tracking-wide">Lithuanian Basketball League · Career Mode</p>
      </div>

      <div className="w-full max-w-sm space-y-3 animate-slide-up">
        <button
          onClick={onSinglePlayer}
          className="w-full relative overflow-hidden rounded-xl px-6 py-5 text-left transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer"
          style={{ background: 'hsl(38 95% 52%)', boxShadow: '0 0 30px hsl(38 95% 52% / 0.18)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70 mb-1 font-condensed" style={{ color: 'hsl(220 25% 5%)' }}>Solo</div>
              <div className="text-xl font-black font-condensed uppercase tracking-wide" style={{ color: 'hsl(220 25% 5%)' }}>Single Player</div>
              <div className="text-sm opacity-70 mt-0.5 font-condensed" style={{ color: 'hsl(220 25% 5%)' }}>Manage your club alone</div>
            </div>
            <svg viewBox="0 0 24 24" fill="hsl(220 25% 5%)" style={{width:36,height:36,opacity:0.7}}>
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
          </div>
        </button>

        <button
          onClick={onMultiplayer}
          className="w-full relative overflow-hidden rounded-xl px-6 py-5 text-left transition-all active:scale-[0.98] cursor-pointer"
          style={{
            background: 'hsl(220 22% 8%)',
            border: '1px solid hsl(220 20% 15%)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'hsl(38 95% 52% / 0.4)';
            (e.currentTarget as HTMLElement).style.background = 'hsl(220 22% 9%)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'hsl(220 20% 15%)';
            (e.currentTarget as HTMLElement).style.background = 'hsl(220 22% 8%)';
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1 font-condensed" style={{ color: 'hsl(38 95% 55%)' }}>Live</div>
              <div className="text-xl font-black text-foreground font-condensed uppercase tracking-wide">Multiplayer</div>
              <div className="text-sm text-muted-foreground mt-0.5 font-condensed">Play against a friend</div>
            </div>
            <svg viewBox="0 0 24 24" fill="hsl(215 15% 50%)" style={{width:36,height:36}}>
              <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" />
              <path d="M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 013.57-4.047zM20.226 19.389a8.287 8.287 0 00-1.308-5.135 3.75 3.75 0 013.57 4.047l-.01.121a.563.563 0 01-.373.486l-.115.04c-.567.2-1.156.349-1.764.441z" />
            </svg>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'hsl(152 60% 48%)' }} />
            <span className="text-xs text-muted-foreground font-condensed">Real-time · Free · No account needed</span>
          </div>
        </button>
      </div>

      <p className="text-xs text-muted-foreground mt-10 opacity-40 font-condensed">v1.0 · Basketball Manager</p>
    </div>
  );
}
