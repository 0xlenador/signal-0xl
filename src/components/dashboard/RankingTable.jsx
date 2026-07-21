'use client';

import { Trophy, Info } from 'lucide-react';

export default function RankingTable() {
  return (
    <section className="glass-panel rounded-3xl p-5 shadow-lg flex-grow flex flex-col relative group">
      <div className="absolute inset-0 bg-gradient-to-t from-accent-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl"></div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2 border-b border-border-light pb-3 relative z-10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-accent-warning drop-shadow-md" /> 
          <span className="group-hover:text-accent-primary transition-colors">Signal Leaderboard</span>
          <span className="cursor-help relative group/tt ml-1 opacity-80 group-hover:opacity-100 transition-opacity flex items-center">
            <Info className="w-4 h-4" />
          </span>
        </h2>
        <div className="text-xs text-text-muted font-mono bg-surface-2 px-3 py-1 rounded-full border border-border-light">
          6 registered signalers
        </div>
      </div>

      <div className="w-full overflow-y-auto max-h-[300px] xl:max-h-full xl:flex-grow mt-2">
        <table className="ranking-table w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border-light/50">
              <th className="py-3 px-2 text-[0.65rem] text-text-muted font-semibold tracking-wider w-10 text-center">#</th>
              <th className="py-3 px-2 text-[0.65rem] text-text-muted font-semibold tracking-wider">ADDRESS</th>
              <th className="py-3 px-2 text-[0.65rem] text-text-muted font-semibold tracking-wider">BADGES</th>
              <th className="py-3 px-2 text-[0.65rem] text-text-muted font-semibold tracking-wider text-right">SCORE</th>
              <th className="py-3 px-2 text-[0.65rem] text-text-muted font-semibold tracking-wider text-right w-16">FORK</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-light/20 hover:bg-surface-1/50 transition-colors group">
              <td className="py-4 px-2 text-accent-warning flex justify-center"><Trophy className="w-4 h-4" /></td>
              <td className="py-4 px-2 font-mono text-xs">0x3ec5...b9bC</td>
              <td className="py-4 px-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-surface-2 rounded-full text-[0.55rem] font-bold text-[#a78bfa] border border-[#a78bfa]/30">VIP</span>
                  <span className="text-[0.6rem] tracking-widest text-accent-primary">🔬 💎 🏛️ 🔥</span>
                </div>
              </td>
              <td className="py-4 px-2 text-right font-bold">7 pts</td>
              <td className="py-4 px-2 text-right text-text-muted text-xs">B1</td>
            </tr>
            <tr className="border-b border-border-light/20 bg-accent-primary/5 hover:bg-accent-primary/10 transition-colors">
              <td className="py-4 px-2 text-text-muted text-center font-bold text-xs"><Trophy className="w-4 h-4 text-gray-400 mx-auto" /></td>
              <td className="py-4 px-2 font-mono text-xs text-white flex items-center gap-2">
                0x6D22...caF0 
                <span className="px-2 py-0.5 bg-accent-primary/20 text-accent-primary rounded-full text-[0.55rem] font-bold">You</span>
              </td>
              <td className="py-4 px-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-surface-2 rounded-full text-[0.55rem] font-bold text-[#a78bfa] border border-[#a78bfa]/30">VIP</span>
                  <span className="text-[0.6rem] tracking-widest text-accent-primary">🔬 💎 🏛️</span>
                </div>
              </td>
              <td className="py-4 px-2 text-right font-bold text-white">5 pts</td>
              <td className="py-4 px-2 text-right text-text-muted text-xs">B1</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
