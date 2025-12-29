
import React, { useState, useMemo, useEffect } from 'react';
import { useGameStore } from '../store';
import { PartCategory, MechPart, PaintPattern } from '../types';
import { calculateStats, MECH_COLORS, PAINT_PATTERNS } from '../constants';
import StatsDisplay from './StatsDisplay';
import { generateMechVisualization } from '../services/geminiService';
import { getMechValidationErrors } from '../utils/validation';
import MechPreviewSVG from './garage/MechPreviewSVG';
import PartList from './garage/PartList';

interface GarageProps {
  onExit: () => void;
  onTest?: () => void;
}

const Garage: React.FC<GarageProps> = ({ onExit, onTest }) => {
  const { mechs, activeMechId, credits: money, ownedPartIds, profile, updateMech: onUpdateBuild, buyPart: onBuyPart, debugSettings } = useGameStore();
  
  const build = activeMechId && mechs[activeMechId] ? mechs[activeMechId] : null;

  const [selectedCategory, setSelectedCategory] = useState<PartCategory>(PartCategory.HEAD);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [mechImage, setMechImage] = useState<string | null>(build?.imageUrl || null);
  const [previewPart, setPreviewPart] = useState<MechPart | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showPaintShop, setShowPaintShop] = useState(false);

  // Ensure cosmetics object exists (migration for old saves)
  useEffect(() => {
      if (build && !build.cosmetics) {
          onUpdateBuild({
              ...build,
              cosmetics: {
                  primary: build.color || 'zinc',
                  secondary: 'slate',
                  pattern: 'SOLID'
              }
          });
      }
  }, [build, onUpdateBuild]);

  const previewStats = useMemo(() => {
    if (!previewPart || !build) return null;
    if (previewPart.category !== selectedCategory) return null;
    
    const tempParts = { ...build.parts, [selectedCategory]: previewPart };
    return calculateStats(tempParts, build.aiConfig);
  }, [previewPart, build, selectedCategory]);
  
  if (!build || !profile || !build.cosmetics) return null;

  const validationErrors = getMechValidationErrors(build);
  const isMechValid = validationErrors.length === 0;

  const handleAction = (part: MechPart) => {
    const isOwned = ownedPartIds.has(part.id);
    const isLevelLocked = (part.unlockLevel || 0) > profile.level;
    const isLocked = isLevelLocked && !(debugSettings.enabled && debugSettings.unlockAllParts);

    if (isLocked) return;

    if (isOwned) {
        const newParts = { ...build.parts, [selectedCategory]: part };
        const newStats = calculateStats(newParts, build.aiConfig);
        onUpdateBuild({
            ...build,
            parts: newParts,
            stats: newStats,
            imageUrl: undefined // Reset image on part change as it is no longer valid
        });
        setMechImage(null); 
    } else {
        if (money >= part.cost) {
            onBuyPart(part);
        }
    }
  };

  const handleNameChange = (name: string) => {
    onUpdateBuild({ ...build, name });
  };

  const handleCosmeticChange = (key: 'primary' | 'secondary' | 'pattern', value: string) => {
      onUpdateBuild({
          ...build,
          cosmetics: {
              ...build.cosmetics,
              [key]: value
          },
          imageUrl: undefined
      });
      setMechImage(null);
  };

  const handleVisualize = async () => {
    if (debugSettings.enabled) {
        setGeneratingImage(true);
        const img = await generateMechVisualization(build);
        setMechImage(img);
        onUpdateBuild({ ...build, imageUrl: img || undefined });
        setGeneratingImage(false);
        return;
    }

    if (!process.env.API_KEY) {
        alert("API Key required for visualization");
        return;
    }
    setGeneratingImage(true);
    const img = await generateMechVisualization(build);
    if (img) {
        setMechImage(img);
        onUpdateBuild({ ...build, imageUrl: img });
    }
    setGeneratingImage(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-950 text-white relative">
      <header className="flex justify-between items-center p-4 bg-slate-900 border-b border-slate-700 z-10">
        <div className="flex flex-col gap-1">
            <h1 className="text-xl md:text-2xl font-bold text-cyan-400 tracking-widest truncate">GARAGE // ASSEMBLY</h1>
             <input 
                type="text" 
                value={build.name} 
                onChange={(e) => handleNameChange(e.target.value)}
                className="bg-transparent border-b border-slate-700 text-white font-mono text-sm focus:border-cyan-500 outline-none w-48"
                placeholder="UNIT NAME"
            />
            {!isMechValid && <span className="text-[10px] text-red-500 font-bold animate-pulse">SYSTEM WARNING: CONFIGURATION INVALID</span>}
        </div>
        <div className="font-mono flex items-center gap-4">
            <div className="hidden md:block">
                <span className="text-slate-500 text-xs">WEIGHT:</span>
                <span className={`text-sm ml-1 ${build.stats.weight > build.stats.weightCapacity ? 'text-red-500 blink' : 'text-white'}`}>
                    {build.stats.weight} / {build.stats.weightCapacity}
                </span>
            </div>
            <div className="hidden md:block">
                 <span className="text-slate-500 text-xs">EN:</span>
                 <span className={`text-sm ml-1 ${build.stats.energyDrain > build.stats.energyOutput ? 'text-red-500 blink' : 'text-white'}`}>
                    {build.stats.energyDrain} / {build.stats.energyOutput}
                 </span>
            </div>
            <div className="ml-2 pl-2 md:ml-4 md:pl-4 border-l border-slate-700">
                <span className="text-slate-500 text-xs md:inline hidden">FUNDS:</span>
                <span className="text-yellow-400 text-lg md:text-xl font-bold ml-2">{money.toLocaleString()} C</span>
            </div>
        </div>
        <div className="flex gap-2 ml-4">
            {onTest && isMechValid && (
                <button
                    onClick={onTest}
                    className="px-4 py-2 bg-red-900/50 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white uppercase text-xs font-bold tracking-wider transition-all"
                >
                    Test Run
                </button>
            )}
            <button 
                onClick={onExit}
                className={`px-4 py-2 border text-sm uppercase tracking-wider
                    ${isMechValid 
                        ? 'border-slate-500 text-slate-400 hover:bg-slate-800' 
                        : 'border-red-500 bg-red-900/20 text-red-400 font-bold'}`}
            >
                {isMechValid ? 'Exit' : 'Exit (Errors)'}
            </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative flex-col lg:flex-row">
        
        <PartList 
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            build={build}
            ownedPartIds={ownedPartIds}
            money={money}
            profile={profile}
            onHover={setPreviewPart}
            onAction={handleAction}
            debugSettings={debugSettings}
        />

        {/* Center: Schematic / Visual */}
        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden order-1 lg:order-2 min-h-[300px] perspective-[1000px]">
             <div 
                className="relative w-full h-full flex items-center justify-center transition-transform duration-100 ease-linear transform-style-3d"
                style={{ transform: `rotateY(${rotation}deg)` }}
             >
                 {(!mechImage) ? (
                     <>
                        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ 
                            backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
                            backgroundSize: '40px 40px' 
                        }}></div>
                        <MechPreviewSVG build={build} highlightedCategory={selectedCategory} />
                     </>
                 ) : (
                     <img src={mechImage} alt="Mech Visualization" className="max-h-full max-w-full object-contain relative z-0 animate-fade-in" />
                 )}
             </div>
             
             {!generatingImage && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4 w-full max-w-lg px-4 pointer-events-none">
                    {/* Controls container - pointer events auto */}
                    <div className="pointer-events-auto flex flex-col items-center gap-4 w-full">
                        {/* Paint Shop Toggle */}
                        <button 
                            onClick={() => setShowPaintShop(!showPaintShop)}
                            className={`px-3 py-1 text-xs uppercase border rounded backdrop-blur-sm ${showPaintShop ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-900/50 border-slate-600 text-slate-400'}`}
                        >
                            {showPaintShop ? 'Close Paint Shop' : 'Open Paint Shop'}
                        </button>

                        {/* Paint Shop Panel */}
                        {showPaintShop && (
                            <div className="bg-slate-900/95 border border-slate-600 p-4 rounded w-full animate-fade-in shadow-2xl flex flex-col gap-3">
                                {/* Primary Color */}
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase mb-1">Primary Coating</div>
                                    <div className="flex gap-1 flex-wrap">
                                        {MECH_COLORS.map(color => (
                                            <button
                                                key={color.id}
                                                onClick={() => handleCosmeticChange('primary', color.id)}
                                                className={`w-5 h-5 rounded border transition-transform hover:scale-110 ${build.cosmetics.primary === color.id ? 'border-white ring-1 ring-white scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: color.hex }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                                {/* Secondary Color */}
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase mb-1">Secondary Detail</div>
                                    <div className="flex gap-1 flex-wrap">
                                        {MECH_COLORS.map(color => (
                                            <button
                                                key={color.id}
                                                onClick={() => handleCosmeticChange('secondary', color.id)}
                                                className={`w-5 h-5 rounded border transition-transform hover:scale-110 ${build.cosmetics.secondary === color.id ? 'border-white ring-1 ring-white scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: color.hex }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                                {/* Pattern */}
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase mb-1">Livery Pattern</div>
                                    <div className="flex gap-2">
                                        {PAINT_PATTERNS.map(pat => (
                                            <button
                                                key={pat.id}
                                                onClick={() => handleCosmeticChange('pattern', pat.id)}
                                                className={`flex-1 py-1 text-[10px] font-bold uppercase border transition-all 
                                                    ${build.cosmetics.pattern === pat.id 
                                                        ? 'bg-cyan-600 text-white border-cyan-400' 
                                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                                            >
                                                {pat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Rotation Control */}
                        <div className="w-64 max-w-full flex items-center gap-2 bg-slate-900/50 p-2 rounded backdrop-blur-sm border border-slate-700">
                            <span className="text-[10px] text-slate-400 uppercase">Rot</span>
                            <input 
                                type="range" min="0" max="360" value={rotation} 
                                onChange={(e) => setRotation(parseInt(e.target.value))}
                                className="w-full h-1 bg-slate-700 appearance-none cursor-pointer hover:bg-cyan-900 accent-cyan-500 rounded"
                            />
                        </div>

                        <button
                            onClick={handleVisualize}
                            className={`bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-none border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] uppercase tracking-widest pointer-events-auto`}
                        >
                            {mechImage ? 'Rerender Neural Image' : 'Render Neural Image'}
                        </button>
                    </div>
                </div>
             )}
             
             {generatingImage && (
                 <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30 flex-col">
                     <div className="text-cyan-400 font-mono text-lg animate-pulse mb-2">NEURAL RENDERING IN PROGRESS...</div>
                     <div className="w-64 h-2 bg-slate-800 rounded overflow-hidden">
                         <div className="h-full bg-cyan-500 animate-[width_2s_ease-in-out_infinite]" style={{width: '50%'}}></div>
                     </div>
                 </div>
             )}
             
             {/* Mobile Stats Toggle */}
             <button 
                onClick={() => setShowStats(!showStats)}
                className="absolute top-4 right-4 lg:hidden px-3 py-1 bg-slate-800 border border-slate-600 text-white text-xs uppercase z-20 pointer-events-auto"
             >
                {showStats ? 'Hide Stats' : 'Show Stats'}
             </button>
        </div>

        {/* Right Column: Stats (Conditional on Mobile) */}
        <div className={`
            w-full lg:w-1/4 bg-slate-900/90 border-l border-slate-700 p-4 overflow-y-auto z-20
            fixed inset-0 top-16 lg:static lg:block
            ${showStats ? 'block' : 'hidden'}
        `}>
            {showStats && <button onClick={() => setShowStats(false)} className="lg:hidden absolute top-2 right-2 text-slate-400">✕</button>}
            <StatsDisplay stats={build.stats} previewStats={previewStats} />
            
            {/* Validation Errors List in Stats Panel */}
            {!isMechValid && (
                <div className="mt-4 p-4 border border-red-500 bg-red-900/20">
                     <h3 className="text-red-500 font-bold text-xs uppercase mb-2">Build Errors</h3>
                     {validationErrors.map((err, i) => (
                         <div key={i} className="text-[10px] text-red-300 font-mono mb-1">> {err}</div>
                     ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Garage;
