
import { useRef, useEffect } from 'react';
import { playSound } from '../../../services/audioService';
import { BattleResult } from '../../../types';
import { VisualEffect } from './canvasTypes';

export const useBattleLoop = (
    battleResult: BattleResult | null,
    currentFrameIdx: number,
    isPlaying: boolean,
    playbackSpeed: number,
    setCurrentFrameIdx: React.Dispatch<React.SetStateAction<number>>,
    setIsPlaying: (playing: boolean) => void,
    onFinish: () => void,
    isReplay: boolean
) => {
    const animationRef = useRef<number>(0);
    const visualEffectsRef = useRef<VisualEffect[]>([]);
    const shakeIntensity = useRef<number>(0);
    const shakeOffset = useRef<{x: number, y: number}>({ x: 0, y: 0 });

    useEffect(() => {
        if (!battleResult) return;
        
        // Reset effects on restart (frame 0)
        if (currentFrameIdx === 0) {
            visualEffectsRef.current = [];
            shakeIntensity.current = 0;
            shakeOffset.current = { x: 0, y: 0 };
        }

        if (isPlaying) {
            const fps = 60 * playbackSpeed;
            const interval = 1000 / fps;
            let lastTime = performance.now();

            const renderLoop = (time: number) => {
                const delta = time - lastTime;
                
                if (delta >= interval) {
                    setCurrentFrameIdx(prev => {
                        const next = prev + 1;
                        if (next >= battleResult.frames.length) {
                            setIsPlaying(false);
                            playSound('EXPLODE');
                            // Always trigger finish to show overlay, even in replays
                            onFinish();
                            return prev;
                        }

                        // --- SHAKE DECAY ---
                        shakeIntensity.current *= 0.9;
                        if (shakeIntensity.current < 0.5) shakeIntensity.current = 0;
                        if (shakeIntensity.current > 0) {
                            shakeOffset.current = {
                                x: (Math.random() - 0.5) * shakeIntensity.current,
                                y: (Math.random() - 0.5) * shakeIntensity.current
                            };
                        } else {
                            shakeOffset.current = { x: 0, y: 0 };
                        }

                        const frame = battleResult.frames[next];
                        if (frame) {
                             // --- FRAME LOGIC: EFFECTS & TRAILS ---
                             
                             // Missile Smoke Trails (Generate every 2 frames)
                             if (next % 2 === 0) {
                                frame.projectiles.forEach(p => {
                                    if ((p as any).type === 'MISSILE') {
                                        visualEffectsRef.current.push({
                                            id: `smoke_${p.id}_${next}`,
                                            x: p.position.x,
                                            y: p.position.y,
                                            color: '#cbd5e1', // Light gray smoke
                                            life: 15,
                                            maxLife: 15,
                                            velocity: { x: (Math.random()-0.5)*0.5, y: (Math.random()-0.5)*0.5 },
                                            type: 'PARTICLE',
                                            size: Math.random() * 3 + 1
                                        });
                                    }
                                });
                             }

                             // Boosting Trails
                             [frame.player, frame.enemy].forEach(mech => {
                                 if (mech.isBoosting && mech.hp > 0 && next % 3 === 0) {
                                     const angle = mech.rotation + Math.PI; // Opposite to facing
                                     visualEffectsRef.current.push({
                                         id: `boost_${mech.id}_${next}`,
                                         x: mech.position.x - Math.cos(mech.rotation) * 15,
                                         y: mech.position.y - Math.sin(mech.rotation) * 15,
                                         color: '#f97316',
                                         life: 10,
                                         maxLife: 10,
                                         velocity: { x: Math.cos(angle) * 2 + (Math.random()-0.5), y: Math.sin(angle) * 2 + (Math.random()-0.5) },
                                         type: 'PARTICLE',
                                         size: Math.random() * 4 + 2
                                     });
                                 }

                                 // Low HP Smoke
                                 if (mech.hp > 0 && (mech.hp / mech.maxHp) < 0.3 && next % 5 === 0) {
                                     visualEffectsRef.current.push({
                                         id: `dmg_smoke_${mech.id}_${next}`,
                                         x: mech.position.x + (Math.random()-0.5)*10,
                                         y: mech.position.y + (Math.random()-0.5)*10,
                                         color: '#1f2937', // Dark smoke
                                         life: 40,
                                         maxLife: 40,
                                         velocity: { x: (Math.random()-0.5)*1, y: -1 - Math.random() },
                                         type: 'PARTICLE',
                                         size: Math.random() * 5 + 3
                                     });
                                 }
                             });

                            frame.events.forEach(e => {
                                if (e.type === 'FIRE') {
                                    playSound('FIRE');
                                    // Slight kick
                                    shakeIntensity.current += 1;
                                }
                                if (e.type === 'SHIELD_BLOCK') {
                                    visualEffectsRef.current.push({
                                        id: `sb_${next}_${Math.random()}`,
                                        x: e.location!.x,
                                        y: e.location!.y,
                                        color: '#22d3ee',
                                        life: 20,
                                        maxLife: 20,
                                        velocity: { x: 0, y: 0 },
                                        type: 'RING',
                                        size: 30
                                    });
                                }
                                if (e.type === 'STAGGER_BREAK') {
                                    playSound('ALARM');
                                    shakeIntensity.current += 5;
                                    visualEffectsRef.current.push({
                                        id: `stagger_${next}_${Math.random()}`,
                                        x: e.location!.x,
                                        y: e.location!.y - 30,
                                        text: 'STAGGER!!',
                                        color: '#ff0000',
                                        life: 60,
                                        maxLife: 60,
                                        velocity: { x: 0, y: -1 },
                                        type: 'TEXT',
                                        size: 24
                                    });
                                    // Shockwave
                                    visualEffectsRef.current.push({
                                        id: `stagger_ring_${next}_${Math.random()}`,
                                        x: e.location!.x,
                                        y: e.location!.y,
                                        color: '#ff0000',
                                        life: 30,
                                        maxLife: 30,
                                        velocity: { x: 0, y: 0 },
                                        type: 'RING',
                                        size: 60
                                    });
                                }
                                if (e.type === 'MELEE_HIT') {
                                    playSound('HIT');
                                    shakeIntensity.current += 15;
                                    visualEffectsRef.current.push({
                                        id: `sl_${next}_${Math.random()}`,
                                        x: e.location!.x,
                                        y: e.location!.y,
                                        color: '#f472b6',
                                        life: 15,
                                        maxLife: 15,
                                        velocity: { x: 0, y: 0 },
                                        type: 'EXPLOSION',
                                        size: 40
                                    });
                                }
                                if (e.type === 'HIT') {
                                    playSound('HIT');
                                    if (e.location && e.damage) {
                                        const isCrit = e.damage > 200; // Arbitrary threshold for critical visuals
                                        if (isCrit) shakeIntensity.current += 8;
                                        else shakeIntensity.current += 2;

                                        visualEffectsRef.current.push({
                                            id: `dmg_${next}_${Math.random()}`,
                                            x: e.location.x,
                                            y: e.location.y - 20,
                                            text: isCrit ? `CRIT ${e.damage}` : e.damage.toString(),
                                            color: isCrit ? '#ef4444' : '#facc15',
                                            life: 45,
                                            maxLife: 45,
                                            velocity: { x: (Math.random() - 0.5) * 2, y: -2 },
                                            type: 'TEXT',
                                            size: 14 + (isCrit ? 8 : 0)
                                        });
                                        visualEffectsRef.current.push({
                                            id: `spark_${next}_${Math.random()}`,
                                            x: e.location.x,
                                            y: e.location.y,
                                            color: '#f97316',
                                            life: 10,
                                            maxLife: 10,
                                            velocity: { x: 0, y: 0 },
                                            type: 'EXPLOSION',
                                            size: 15
                                        });
                                    }
                                }
                                if (e.type === 'AI_DECISION') {
                                    const target = e.sourceId === 'PLAYER' ? frame.player : frame.enemy;
                                    visualEffectsRef.current.push({
                                        id: `ai_${next}_${Math.random()}`,
                                        x: target.position.x,
                                        y: target.position.y - 40,
                                        text: e.message || 'Thinking...',
                                        color: '#d8b4fe', // Purple
                                        life: 60,
                                        maxLife: 60,
                                        velocity: { x: 0, y: -0.5 },
                                        type: 'TEXT',
                                        size: 10
                                    });
                                }
                                if (e.type === 'DESTROYED') {
                                    playSound('EXPLODE');
                                    shakeIntensity.current += 30;
                                    const target = e.targetId === 'PLAYER' ? frame.player : frame.enemy;
                                    visualEffectsRef.current.push({
                                        id: `boom_${next}_${e.targetId}`,
                                        x: target.position.x,
                                        y: target.position.y,
                                        color: '#ef4444',
                                        life: 60,
                                        maxLife: 60,
                                        velocity: { x: 0, y: 0 },
                                        type: 'EXPLOSION',
                                        size: 50
                                    });
                                }
                            });
                        }

                        // Update Effects Physics within the loop for smooth state
                        for (let i = visualEffectsRef.current.length - 1; i >= 0; i--) {
                            const effect = visualEffectsRef.current[i];
                            effect.life--;
                            effect.x += effect.velocity.x;
                            effect.y += effect.velocity.y;
                            if (effect.life <= 0) visualEffectsRef.current.splice(i, 1);
                        }

                        return next;
                    });
                    lastTime = time;
                }
                animationRef.current = requestAnimationFrame(renderLoop);
            };
            animationRef.current = requestAnimationFrame(renderLoop);
            return () => cancelAnimationFrame(animationRef.current);
        }
    }, [isPlaying, battleResult, playbackSpeed, isReplay, setCurrentFrameIdx, setIsPlaying, onFinish]);

    return { visualEffectsRef, shakeOffset };
};
