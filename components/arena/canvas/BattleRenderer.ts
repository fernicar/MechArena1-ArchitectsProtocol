
import { BattleFrame, BattleResult, MechBattleState, Obstacle } from '../../../types';
import { ARENA_SIZE } from '../../../services/BattleEngine';
import { VisualEffect } from './canvasTypes';

// Theme Definitions
const THEMES: Record<string, { bg: string, grid: string, border: string, accent: string }> = {
    OPEN: { bg: '#0f172a', grid: '#1e293b', border: '#334155', accent: '#22d3ee' }, // Slate (Cyber)
    PILLARS: { bg: '#020617', grid: '#1e293b', border: '#334155', accent: '#64748b' }, // Darker Cyber
    URBAN: { bg: '#111827', grid: '#374151', border: '#4b5563', accent: '#facc15' }, // Gray (Asphalt)
    WASTELAND: { bg: '#291508', grid: '#431407', border: '#7c2d12', accent: '#f97316' }, // Orange/Brown (Rust)
};

export const drawArenaGrid = (ctx: CanvasRenderingContext2D, obstacles: Obstacle[] = [], arenaType: string = 'OPEN') => {
    const theme = THEMES[arenaType] || THEMES.OPEN;

    // Draw Floor
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, ARENA_SIZE.width, ARENA_SIZE.height);
    
    // Draw Grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = theme.grid;
    ctx.beginPath();
    
    const gridSize = 50;
    
    // Standard Grid
    for(let x=0; x<=ARENA_SIZE.width; x+=gridSize) { ctx.moveTo(x,0); ctx.lineTo(x, ARENA_SIZE.height); }
    for(let y=0; y<=ARENA_SIZE.height; y+=gridSize) { ctx.moveTo(0,y); ctx.lineTo(ARENA_SIZE.width, y); }
    ctx.stroke();

    // Specific Theme Decorations
    if (arenaType === 'URBAN') {
        // Road markings (Cross)
        ctx.save();
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 4;
        ctx.setLineDash([40, 40]);
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.moveTo(ARENA_SIZE.width/2, 0); ctx.lineTo(ARENA_SIZE.width/2, ARENA_SIZE.height);
        ctx.moveTo(0, ARENA_SIZE.height/2); ctx.lineTo(ARENA_SIZE.width, ARENA_SIZE.height/2);
        ctx.stroke();
        ctx.restore();
    } else if (arenaType === 'WASTELAND') {
        // Dust/Noise pattern
        ctx.save();
        ctx.fillStyle = theme.accent;
        ctx.globalAlpha = 0.05;
        // Deterministic noise
        for(let x=0; x<=ARENA_SIZE.width; x+=100) {
            for(let y=0; y<=ARENA_SIZE.height; y+=100) {
                if ((x+y)%3 === 0) ctx.fillRect(x+15, y+15, 30, 30);
                if ((x*y)%7 === 0) ctx.fillRect(x+60, y+60, 20, 20);
            }
        }
        ctx.restore();
    }
    
    // Draw Border
    ctx.lineWidth = 4;
    ctx.strokeStyle = theme.border;
    ctx.strokeRect(0, 0, ARENA_SIZE.width, ARENA_SIZE.height);

    // Obstacles
    if (obstacles) {
        obstacles.forEach((obs: Obstacle) => {
            ctx.save();
            const ocx = obs.x + obs.width / 2;
            const ocy = obs.y + obs.height / 2;
            ctx.translate(ocx, ocy);
            
            // Rotation
            if (obs.type === 'PILLAR') ctx.rotate(Math.PI / 4);
            if (obs.type === 'DEBRIS') ctx.rotate(Math.PI / 8); 
            
            const w = obs.width;
            const h = obs.height;
            
            // Colors per Theme
            let fill = '#334155';
            let stroke = '#94a3b8';

            if (arenaType === 'WASTELAND') {
                fill = '#572810';
                stroke = '#9a3412';
            } else if (arenaType === 'URBAN') {
                fill = '#374151';
                stroke = '#6b7280';
            } else if (arenaType === 'PILLARS') {
                fill = '#0f172a';
                stroke = '#475569';
            }

            // Draw Base
            ctx.fillStyle = fill;
            ctx.fillRect(-w/2, -h/2, w, h);
            
            // Detail
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 2;
            
            if (obs.type === 'DEBRIS') {
                 // X mark
                 ctx.beginPath();
                 ctx.moveTo(-w/2, -h/2); ctx.lineTo(w/2, h/2);
                 ctx.moveTo(w/2, -h/2); ctx.lineTo(-w/2, h/2);
                 ctx.globalAlpha = 0.3;
                 ctx.stroke();
                 ctx.globalAlpha = 1.0;
            } else if (obs.type === 'WALL') {
                 // Stripes
                 ctx.beginPath();
                 ctx.moveTo(-w/4, -h/2); ctx.lineTo(-w/4, h/2);
                 ctx.moveTo(w/4, -h/2); ctx.lineTo(w/4, h/2);
                 ctx.globalAlpha = 0.3;
                 ctx.stroke();
                 ctx.globalAlpha = 1.0;
            }

            ctx.strokeRect(-w/2, -h/2, w, h);
            
            // Faux 3D highlight
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(-w/2 + 4, -h/2 + 4, w - 8, h - 8);

            ctx.restore();
        });
    }
};

const drawWeapon = (ctx: CanvasRenderingContext2D, type: string, side: 'L' | 'R' | 'BL' | 'BR', baseColor: string) => {
    ctx.save();
    
    // Rotate 90 degrees CCW (-90 deg) to correct alignment
    ctx.rotate(-Math.PI / 2);

    ctx.fillStyle = '#1e293b'; // Gunmetal dark
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 1;

    if (side === 'L') ctx.translate(-15, 0);
    if (side === 'R') ctx.translate(15, 0);
    if (side === 'BL') ctx.translate(-10, -10);
    if (side === 'BR') ctx.translate(10, -10);

    // Skip drawing if NONE
    if (type === 'NONE') { ctx.restore(); return; }

    if (type === 'RIFLE') {
        ctx.fillStyle = '#475569';
        ctx.fillRect(-3, 0, 6, 25);
        ctx.fillStyle = '#000';
        ctx.fillRect(-1, 25, 2, 2);
    } else if (type === 'MACHINE_GUN') {
        ctx.fillStyle = '#334155';
        ctx.fillRect(-4, 0, 8, 20);
        ctx.fillRect(-1, 20, 2, 3); // Barrel
    } else if (type === 'BAZOOKA') {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-5, -5, 10, 35);
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(0, 30, 4, 0, Math.PI * 2); ctx.fill();
    } else if (type === 'MISSILE') {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-6, -5, 12, 15);
        // Cells
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-4, -2, 3, 3);
        ctx.fillRect(1, -2, 3, 3);
        ctx.fillRect(-4, 4, 3, 3);
        ctx.fillRect(1, 4, 3, 3);
    } else if (type === 'CANNON') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-4, -10, 8, 40); // Long barrel
    } else if (type === 'BLADE') {
        ctx.fillStyle = '#334155';
        ctx.fillRect(-3, 0, 6, 15); // Hilt
        // Energy blade drawn only when firing usually, but let's draw emitter
        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(-1, 15, 2, 5);
    } else if (type === 'SHIELD') {
        ctx.fillStyle = baseColor;
        ctx.beginPath(); 
        ctx.moveTo(0, 0); ctx.lineTo(-10, 10); ctx.lineTo(0, 25); ctx.lineTo(10, 10); 
        ctx.fill();
        ctx.stroke();
    } else if (type === 'RADAR') {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI, true); ctx.fill();
        ctx.strokeStyle = '#22c55e';
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, -10); ctx.stroke();
    }

    ctx.restore();
}

// Procedural Pattern Generation
const getFillStyle = (ctx: CanvasRenderingContext2D, primary: string, secondary: string, pattern: string) => {
    if (pattern === 'SOLID' || !pattern) return primary;

    // Create a mini canvas for the pattern
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 20;
    pCanvas.height = 20;
    const pCtx = pCanvas.getContext('2d');
    if (!pCtx) return primary;

    pCtx.fillStyle = primary;
    pCtx.fillRect(0, 0, 20, 20);

    if (pattern === 'STRIPES') {
        pCtx.fillStyle = secondary;
        pCtx.beginPath();
        pCtx.moveTo(10, 0); pCtx.lineTo(20, 0); pCtx.lineTo(10, 20); pCtx.lineTo(0, 20);
        pCtx.fill();
    } else if (pattern === 'CAMO') {
        pCtx.fillStyle = secondary;
        pCtx.globalAlpha = 0.7;
        pCtx.beginPath(); pCtx.arc(5, 5, 4, 0, Math.PI*2); pCtx.fill();
        pCtx.beginPath(); pCtx.arc(15, 15, 6, 0, Math.PI*2); pCtx.fill();
    } else if (pattern === 'HAZARD') {
        pCtx.fillStyle = secondary; // usually black
        pCtx.beginPath();
        pCtx.moveTo(0,0); pCtx.lineTo(10,0); pCtx.lineTo(0,10);
        pCtx.moveTo(10,20); pCtx.lineTo(20,20); pCtx.lineTo(20,10);
        pCtx.fill();
    }

    return ctx.createPattern(pCanvas, 'repeat') || primary;
};

export const drawMech = (ctx: CanvasRenderingContext2D, mech: MechBattleState, defaultColor: string) => {
    if (mech.hp <= 0) return;
    
    const legType = mech.visualConfig?.legType || 'BIPED';
    const primary = mech.visualConfig?.baseColor || defaultColor;
    const secondary = mech.visualConfig?.secondaryColor || '#333';
    const pattern = mech.visualConfig?.pattern || 'SOLID';

    const fillStyle = getFillStyle(ctx, primary, secondary, pattern);

    ctx.save();
    ctx.translate(mech.position.x, mech.position.y);
    
    // HP Bar (In-world)
    const hpPct = mech.hp / mech.maxHp;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-20, -40, 40, 4);
    ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : '#ef4444';
    ctx.fillRect(-20, -40, 40 * hpPct, 4);

    if (mech.isStaggered) {
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'center';
        ctx.fillText('STAGGER', 0, -50);
    }

    if (mech.isShielded) {
        ctx.beginPath();
        ctx.arc(0, 0, 35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34, 211, 238, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    ctx.rotate(mech.rotation);
    
    if (mech.isStaggered) {
        const shakeX = (Math.random() - 0.5) * 4;
        const shakeY = (Math.random() - 0.5) * 4;
        ctx.translate(shakeX, shakeY);
    }

    ctx.fillStyle = fillStyle;
    ctx.shadowColor = primary;
    ctx.shadowBlur = mech.isBoosting ? 25 : 5;

    // Body Shapes
    if (legType === 'TANK') {
        ctx.fillRect(-20, -15, 40, 30);
        ctx.fillStyle = '#334155';
        ctx.fillRect(-25, -20, 50, 6);
        ctx.fillRect(-25, 14, 50, 6);
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
    } else if (legType === 'QUAD') {
        ctx.strokeStyle = primary;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-20, -20); ctx.lineTo(20, 20);
        ctx.moveTo(-20, 20); ctx.lineTo(20, -20);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
    } else if (legType === 'HOVER') {
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.strokeStyle = primary;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Biped / Reverse
        ctx.beginPath();
        if (legType === 'REVERSE_JOINT') {
            ctx.moveTo(15, 0); ctx.lineTo(-15, 15); ctx.lineTo(-10, 0); ctx.lineTo(-15, -15);
        } else {
            ctx.moveTo(15, 0); ctx.lineTo(-10, 12); ctx.lineTo(-5, 0); ctx.lineTo(-10, -12);
        }
        ctx.closePath();
        ctx.fill();
    }

    // Draw Weapons (On top of body)
    if (mech.visualConfig) {
        drawWeapon(ctx, mech.visualConfig.backL, 'BL', primary);
        drawWeapon(ctx, mech.visualConfig.backR, 'BR', primary);
        drawWeapon(ctx, mech.visualConfig.weaponL, 'L', primary);
        drawWeapon(ctx, mech.visualConfig.weaponR, 'R', primary);
    }
    
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 80, -0.25, 0.25); ctx.fill();

    if (mech.isFiringR || mech.isFiringL || mech.isFiringBackL || mech.isFiringBackR) {
        ctx.fillStyle = '#fef08a';
        ctx.beginPath(); ctx.arc(15, mech.isFiringR ? 8 : -8, 4, 0, Math.PI * 2); ctx.fill();
    }
    
    ctx.restore();
};

export const drawLockOn = (ctx: CanvasRenderingContext2D, target: MechBattleState, color: string) => {
    ctx.save();
    ctx.translate(target.position.x, target.position.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    const size = 30;
    const time = Date.now() / 1000;
    const rot = time % (Math.PI * 2);

    ctx.rotate(rot);
    
    // Draw brackets
    ctx.beginPath();
    ctx.moveTo(-size, -size + 10); ctx.lineTo(-size, -size); ctx.lineTo(-size + 10, -size);
    ctx.moveTo(size, -size + 10); ctx.lineTo(size, -size); ctx.lineTo(size - 10, -size);
    ctx.moveTo(-size, size - 10); ctx.lineTo(-size, size); ctx.lineTo(-size + 10, size);
    ctx.moveTo(size, size - 10); ctx.lineTo(size, size); ctx.lineTo(size - 10, size);
    ctx.stroke();

    ctx.restore();
};

export const drawProjectiles = (ctx: CanvasRenderingContext2D, projectiles: any[]) => {
    projectiles.forEach(proj => {
        ctx.save();
        ctx.fillStyle = proj.color;
        ctx.shadowColor = proj.color;
        ctx.shadowBlur = 5;
        ctx.translate(proj.position.x, proj.position.y);
        
        const type = proj.type;

        if (type === 'MISSILE') {
            const angle = Math.atan2(proj.velocity.y, proj.velocity.x);
            ctx.rotate(angle);
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(-4, -1, 8, 2);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath(); ctx.arc(4, 0, 2, 0, Math.PI*2); ctx.fill();
        } else if (type === 'BAZOOKA') {
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#f97316';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else if (type === 'CANNON') {
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444';
            ctx.fill();
            ctx.strokeStyle = '#fee2e2';
            ctx.stroke();
        } else if (type === 'MACHINE_GUN') {
            ctx.beginPath();
            ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#fde047';
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    });
};

export const drawEffects = (ctx: CanvasRenderingContext2D, effects: VisualEffect[]) => {
    effects.forEach(effect => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, effect.life / effect.maxLife);
        
        if (effect.type === 'TEXT' && effect.text) {
            ctx.fillStyle = effect.color;
            ctx.font = `bold ${effect.size}px monospace`;
            ctx.textAlign = 'center';
            ctx.lineWidth = 2;
            ctx.strokeText(effect.text, effect.x, effect.y);
            ctx.fillText(effect.text, effect.x, effect.y);
        } else if (effect.type === 'EXPLOSION') {
            ctx.fillStyle = effect.color;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, Math.max(0, effect.size * (1 - (effect.life/effect.maxLife))), 0, Math.PI * 2);
            ctx.fill();
        } else if (effect.type === 'RING') {
            ctx.strokeStyle = effect.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, Math.max(0, effect.size * (1 - (effect.life/effect.maxLife))), 0, Math.PI*2);
            ctx.stroke();
        } else if (effect.type === 'PARTICLE') {
            ctx.fillStyle = effect.color;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    });
};

export const renderBattleFrame = (
    ctx: CanvasRenderingContext2D, 
    frame: BattleFrame, 
    battleResult: BattleResult, 
    effects: VisualEffect[],
    viewSize: { width: number, height: number },
    options: { zoom: number, shake: { x: number, y: number } }
) => {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    const p1 = frame.player.position;
    const p2 = frame.enemy.position;
    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;
    
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.translate(options.shake.x, options.shake.y);
    ctx.scale(options.zoom, options.zoom);
    ctx.translate(-cx, -cy);

    // Pass arenaType
    drawArenaGrid(ctx, battleResult.obstacles, battleResult.arenaType);
    
    drawMech(ctx, frame.player, '#06b6d4');
    drawMech(ctx, frame.enemy, '#ef4444');
    
    // Draw Lock-On Indicator if actively firing and has ammo
    if (frame.player.isFiringR || frame.player.isFiringL || frame.player.isFiringBackL || frame.player.isFiringBackR) {
        drawLockOn(ctx, frame.enemy, '#ef4444');
    }
    if (frame.enemy.isFiringR || frame.enemy.isFiringL || frame.enemy.isFiringBackL || frame.enemy.isFiringBackR) {
        drawLockOn(ctx, frame.player, '#22d3ee');
    }

    drawProjectiles(ctx, frame.projectiles);
    drawEffects(ctx, effects);

    ctx.restore();
};
