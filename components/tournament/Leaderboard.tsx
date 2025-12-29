
import React from 'react';
import { useGameStore } from '../../store';
import { getRankFromRating } from '../../utils/glicko';

const Leaderboard: React.FC = () => {
    const { rivals, profile } = useGameStore();

    if (!profile) return null;

    // Merge player into the list for display logic (temp sort)
    const playerEntry = {
        id: 'PLAYER',
        name: profile.name,
        mechName: 'ACTIVE UNIT', // Simplified for list
        rating: profile.rating,
        rank: profile.rank,
        trend: 'SAME' as const,
        isPlayer: true
    };

    const allPilots = [...rivals, playerEntry].sort((a, b) => b.rating - a.rating);
    const playerRankIndex = allPilots.findIndex(p => p.id === 'PLAYER');

    // Determine view window: Top 10 + Player neighborhood if outside Top 10
    let displayList = allPilots.slice(0, 15);
    
    // If player is far down, show them and neighbors
    if (playerRankIndex > 15) {
        // Add a spacer
        // Slice neighbors
        const start = Math.max(0, playerRankIndex - 2);
        const end = Math.min(allPilots.length, playerRankIndex + 3);
        const neighbors = allPilots.slice(start, end);
        displayList = [...displayList, { id: 'SPACER', name: '...', rating: 0 } as any, ...neighbors];
    }

    return (
        <div className="flex flex-col h-full bg-slate-900/80 border border-slate-700 overflow-hidden relative">
            <div className="p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-20 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white uppercase tracking-widest">Global Rankings</h2>
                <div className="text-xs text-slate-500 font-mono">SEASON 01 // CYCLE 42</div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-950 text-slate-500 text-xs uppercase sticky top-0 z-10">
                        <tr>
                            <th className="p-3 font-medium">#</th>
                            <th className="p-3 font-medium">Pilot</th>
                            <th className="p-3 font-medium hidden sm:table-cell">AC Name</th>
                            <th className="p-3 font-medium text-center">Rank</th>
                            <th className="p-3 font-medium text-right">Rating</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm font-mono">
                        {displayList.map((pilot, idx) => {
                            if (pilot.id === 'SPACER') {
                                return (
                                    <tr key="spacer" className="bg-slate-950/50">
                                        <td colSpan={5} className="text-center text-slate-600 py-2">...</td>
                                    </tr>
                                );
                            }

                            // Calculate actual rank based on sorted full list
                            const realRank = allPilots.findIndex(p => p.id === pilot.id) + 1;
                            const isPlayer = (pilot as any).isPlayer;
                            const rankGrade = getRankFromRating(pilot.rating);
                            
                            let rowClass = 'border-b border-slate-800/50 hover:bg-slate-800 transition-colors';
                            if (isPlayer) rowClass = 'bg-yellow-900/20 border-y border-yellow-500/50';
                            if (realRank === 1) rowClass = 'bg-gradient-to-r from-yellow-500/10 to-transparent border-b border-yellow-900';

                            return (
                                <tr key={pilot.id} className={rowClass}>
                                    <td className="p-3 text-slate-400 font-bold w-12">
                                        {realRank === 1 ? '👑' : realRank}
                                    </td>
                                    <td className="p-3">
                                        <div className={`font-bold ${isPlayer ? 'text-yellow-400' : 'text-white'}`}>
                                            {pilot.name}
                                        </div>
                                    </td>
                                    <td className="p-3 text-slate-500 text-xs hidden sm:table-cell">
                                        {pilot.mechName}
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold
                                            ${rankGrade === 'S' ? 'bg-purple-900 text-purple-300' :
                                              rankGrade === 'A' ? 'bg-cyan-900 text-cyan-300' :
                                              rankGrade === 'B' ? 'bg-green-900 text-green-300' :
                                              'bg-slate-800 text-slate-400'}
                                        `}>
                                            {rankGrade}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right font-bold text-white w-32">
                                        <div className="flex items-center justify-end gap-2">
                                            {pilot.rating}
                                            {pilot.trend === 'UP' && <span className="text-green-500 text-[10px]">▲</span>}
                                            {pilot.trend === 'DOWN' && <span className="text-red-500 text-[10px]">▼</span>}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            <div className="p-2 border-t border-slate-700 bg-slate-900 text-[10px] text-slate-500 text-center">
                LEADERBOARD UPDATES HOURLY
            </div>
        </div>
    );
};

export default Leaderboard;
