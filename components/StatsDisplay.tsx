
import React from 'react';
import { MechStats } from '../types';

interface StatsDisplayProps {
  stats: MechStats;
  previewStats?: MechStats | null;
  compact?: boolean;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ stats, previewStats, compact = false }) => {
  const StatBar = ({ label, value, previewValue, max, color, inverse = false }: { label: string; value: number; previewValue?: number; max: number; color: string; inverse?: boolean }) => {
    const safeMax = max || 100;
    const currentPercent = Math.min((value / safeMax) * 100, 100);
    const previewPercent = previewValue !== undefined ? Math.min((previewValue / safeMax) * 100, 100) : currentPercent;
    
    const isDiff = previewValue !== undefined && previewValue !== value;
    // For most stats, higher is better. For some (weight, drain, aiLoad), lower is better.
    const isBetter = inverse ? previewValue! < value : previewValue! > value;
    const diffColor = previewValue && isBetter ? 'bg-green-400' : 'bg-red-500';

    return (
      <div className="mb-2 group">
        <div className="flex justify-between text-[10px] uppercase tracking-wider mb-1">
          <span className="text-slate-400">{label}</span>
          <div className="font-mono flex gap-2">
            {isDiff && (
                <span className={isBetter ? 'text-green-400' : 'text-red-500'}>
                    {previewValue! > value ? '+' : ''}{previewValue! - value}
                </span>
            )}
            <span className="text-white">{value}</span>
          </div>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-sm overflow-hidden border border-slate-700 relative">
          <div 
            className={`absolute top-0 left-0 h-full ${color} transition-all duration-300 z-10`} 
            style={{ width: `${currentPercent}%` }}
          />
          {isDiff && (
            <div 
                className={`absolute top-0 left-0 h-full ${diffColor} opacity-70 transition-all duration-300 z-0 ${!isBetter ? 'animate-pulse' : ''}`}
                style={{ width: `${previewPercent}%` }}
            />
          )}
        </div>
      </div>
    );
  };

  const enStatus = stats.energyDrain > stats.energyOutput * 1.2 ? 'CRITICAL' : 
                   stats.energyDrain > stats.energyOutput ? 'WARNING' : 'OK';

  return (
    <div className={`bg-slate-900/80 border border-slate-700 p-4 ${compact ? 'text-xs' : ''}`}>
      <h3 className="text-cyan-400 font-bold uppercase tracking-widest mb-4 border-b border-slate-700 pb-2 flex justify-between items-center">
        <span>PERFORMANCE</span>
        {previewStats && <span className="text-yellow-400 text-xs animate-pulse ml-2">PREVIEWING</span>}
      </h3>
      
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-2 gap-x-6 gap-y-2'}`}>
        <StatBar label="AP (Armor)" value={stats.ap} previewValue={previewStats?.ap} max={15000} color="bg-green-500" />
        <StatBar label="Defense" value={stats.defense} previewValue={previewStats?.defense} max={3000} color="bg-emerald-500" />
        
        <StatBar label="Total Weight" value={stats.weight} previewValue={previewStats?.weight} max={stats.weightCapacity || 10000} color={stats.weight > stats.weightCapacity ? "bg-red-600" : "bg-slate-400"} inverse />
        <StatBar label="Load Capacity" value={stats.weightCapacity} previewValue={previewStats?.weightCapacity} max={15000} color="bg-slate-500" />
        
        <StatBar label="Energy Output" value={stats.energyOutput} previewValue={previewStats?.energyOutput} max={8000} color="bg-cyan-500" />
        <StatBar label="Energy Drain" value={stats.energyDrain} previewValue={previewStats?.energyDrain} max={stats.energyOutput || 5000} color={enStatus === 'CRITICAL' ? "bg-red-600" : enStatus === 'WARNING' ? "bg-orange-500" : "bg-purple-500"} inverse />
        
        <StatBar label="Mobility" value={stats.mobility} previewValue={previewStats?.mobility} max={1000} color="bg-yellow-500" />
        <StatBar label="Firepower" value={stats.firepower} previewValue={previewStats?.firepower} max={5000} color="bg-red-500" />
        
        <StatBar label="Weapon Accuracy" value={stats.precision} previewValue={previewStats?.precision} max={300} color="bg-pink-500" />
        <StatBar label="Scan Range" value={stats.scanRange} previewValue={previewStats?.scanRange} max={1000} color="bg-teal-400" />

        <StatBar label="AI CPU Load" value={stats.aiLoad} previewValue={previewStats?.aiLoad} max={stats.aiCapacity || 200} color={stats.aiLoad > stats.aiCapacity ? "bg-red-600" : "bg-indigo-500"} inverse />
        <StatBar label="AI Capacity" value={stats.aiCapacity} previewValue={previewStats?.aiCapacity} max={250} color="bg-slate-600" />
      </div>
      
      {!compact && (
        <div className="mt-4 flex gap-4 text-xs font-mono">
            <div className={`flex-1 p-2 border ${stats.weight > stats.weightCapacity ? 'border-red-500 bg-red-900/20 text-red-500' : 'border-slate-700 text-green-500'}`}>
                WEIGHT: {stats.weight > stats.weightCapacity ? 'OVERLOAD' : 'OK'}
            </div>
            <div className={`flex-1 p-2 border 
                ${enStatus === 'CRITICAL' ? 'border-red-500 bg-red-900/20 text-red-500' : 
                  enStatus === 'WARNING' ? 'border-orange-500 bg-orange-900/20 text-orange-500' : 
                  'border-slate-700 text-cyan-500'}`}>
                ENERGY: {enStatus}
            </div>
            <div className={`flex-1 p-2 border ${stats.aiLoad > stats.aiCapacity ? 'border-red-500 bg-red-900/20 text-red-500' : 'border-slate-700 text-purple-400'}`}>
                AI CPU: {stats.aiLoad > stats.aiCapacity ? 'OVERLOAD' : 'OK'}
            </div>
        </div>
      )}
    </div>
  );
};

export default StatsDisplay;
