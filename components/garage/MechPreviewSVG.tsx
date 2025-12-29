
import React from 'react';
import { MechBuild, PartCategory } from '../../types';
import { MECH_COLORS } from '../../constants';

interface MechPreviewSVGProps {
    build: MechBuild;
    highlightedCategory?: PartCategory;
}

const MechPreviewSVG: React.FC<MechPreviewSVGProps> = ({ build, highlightedCategory }) => {
    // Cosmetic Resolution
    const primaryId = build.cosmetics?.primary || 'zinc';
    const secondaryId = build.cosmetics?.secondary || 'slate';
    const pattern = build.cosmetics?.pattern || 'SOLID';

    const primaryHex = MECH_COLORS.find(c => c.id === primaryId)?.hex || '#71717a';
    const secondaryHex = MECH_COLORS.find(c => c.id === secondaryId)?.hex || '#334155';

    // Determines mask or fill url
    const getFill = (cat: PartCategory) => {
        if (highlightedCategory === cat) return '#FACC15'; // Highlight override
        
        // Weapon/Back/Gen/Rad usually keep metallic/dark look or simple primary
        if (cat === PartCategory.WEAPON_R || cat === PartCategory.WEAPON_L || 
            cat === PartCategory.BACK_L || cat === PartCategory.BACK_R) {
            return '#334155'; // Dark gunmetal
        }
        
        // Armor parts get pattern
        if (cat === PartCategory.HEAD || cat === PartCategory.CORE || cat === PartCategory.ARMS || cat === PartCategory.LEGS) {
            if (pattern === 'SOLID') return primaryHex;
            return `url(#pattern_${pattern})`;
        }
        
        return primaryHex;
    };

    const getStroke = (cat: PartCategory) => highlightedCategory === cat ? '#FEF08A' : '#475569';
    
    // Leg Drawing Logic
    const renderLegs = () => {
        const type = build.parts.LEGS.spec?.legType || 'BIPED';
        const fill = getFill(PartCategory.LEGS);
        const stroke = getStroke(PartCategory.LEGS);

        switch(type) {
            case 'TANK':
                return (
                    <g transform="translate(200, 480)">
                        <path d="M-60 -20 L-70 20 L-60 40 L60 40 L70 20 L60 -20 Z" fill={fill} stroke={stroke} strokeWidth="2" />
                        <rect x="-65" y="0" width="130" height="35" fill="none" stroke={stroke} strokeWidth="1" strokeDasharray="5,3" />
                        <circle cx="-40" cy="20" r="10" fill="#1e293b" />
                        <circle cx="0" cy="20" r="10" fill="#1e293b" />
                        <circle cx="40" cy="20" r="10" fill="#1e293b" />
                    </g>
                );
            case 'QUAD':
                return (
                    <g transform="translate(200, 450)">
                         <path d="M-20 -10 L-70 50 L-90 90" fill="none" stroke={stroke} strokeWidth="8" opacity="0.6" />
                         <path d="M20 -10 L70 50 L90 90" fill="none" stroke={stroke} strokeWidth="8" opacity="0.6" />
                         <path d="M-30 0 L-60 60 L-80 100 H-50 L-30 60 Z" fill={fill} stroke={stroke} strokeWidth="2" />
                         <path d="M30 0 L60 60 L80 100 H50 L30 60 Z" fill={fill} stroke={stroke} strokeWidth="2" />
                    </g>
                );
            case 'REVERSE_JOINT':
                return (
                    <g transform="translate(200, 450)">
                         <path d="M-30 -10 L-60 40 L-30 100 L-60 140 H-40" fill="none" stroke={primaryHex} strokeWidth="12" strokeLinecap="round" />
                         <path d="M-30 -10 L-60 40 L-30 100 L-60 140 H-40" fill="none" stroke={stroke} strokeWidth="2" />
                         <path d="M30 -10 L60 40 L30 100 L60 140 H40" fill="none" stroke={primaryHex} strokeWidth="12" strokeLinecap="round" />
                         <path d="M30 -10 L60 40 L30 100 L60 140 H40" fill="none" stroke={stroke} strokeWidth="2" />
                    </g>
                );
            case 'BIPED':
            default:
                return (
                    <g transform="translate(200, 450)">
                         <path d="M-40 10 L-50 100 L-80 140 H-30 L-20 100 Z" fill={fill} stroke={stroke} strokeWidth="2" />
                         <path d="M40 10 L50 100 L80 140 H30 L20 100 Z" fill={fill} stroke={stroke} strokeWidth="2" />
                         <rect x="-40" y="-20" width="80" height="30" fill={secondaryHex} stroke={stroke} strokeWidth="2" />
                    </g>
                );
        }
    };

    const renderWeapon = (type: string | undefined, side: 'L' | 'R') => {
        const cat = side === 'L' ? PartCategory.WEAPON_L : PartCategory.WEAPON_R;
        const color = getFill(cat);
        const stroke = getStroke(cat);
        
        const transform = side === 'L' ? "translate(-35, 80)" : "translate(25, 80)";

        switch (type) {
            case 'BLADE':
                return (
                    <g transform={transform}>
                        <rect x="-5" y="0" width="10" height="40" fill="#334155" />
                        <path d="M-2 40 L-2 120 L2 120 L2 40 Z" fill="#22d3ee" filter="url(#glow)" opacity="0.8" />
                    </g>
                );
            case 'SHIELD':
                return (
                     <g transform={transform}>
                         <path d={side === 'L' ? "M-20 -20 L-30 60 L0 80 L0 -20 Z" : "M20 -20 L30 60 L0 80 L0 -20 Z"} fill={primaryHex} stroke={stroke} strokeWidth="2" opacity="0.8" />
                     </g>
                );
            case 'BAZOOKA':
                return (
                    <g transform={transform}>
                        <rect x="-15" y="-20" width="30" height="100" fill={color} stroke={stroke} strokeWidth="2" />
                        <circle cx="0" cy="80" r="12" fill="#000" />
                    </g>
                );
            case 'MISSILE':
            case 'MACHINE_GUN':
                 return (
                    <g transform={transform}>
                        <rect x="-10" y="0" width="20" height="60" fill={color} stroke={stroke} strokeWidth="2" />
                        <rect x="-12" y="40" width="24" height="10" fill="#1e293b" />
                    </g>
                 );
            case 'RIFLE':
            default:
                return (
                    <g transform={transform}>
                         <rect x="-5" y="0" width="10" height="80" fill={color} stroke={stroke} strokeWidth="2" />
                         <rect x="-8" y="10" width="16" height="30" fill={color} stroke={stroke} />
                    </g>
                );
        }
    }

    return (
        <svg viewBox="0 0 400 600" className="w-full h-full max-h-[500px] drop-shadow-[0_0_10px_rgba(6,182,212,0.1)]">
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                
                {/* Dynamic Patterns */}
                <pattern id="pattern_STRIPES" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
                    <rect width="20" height="20" fill={primaryHex} />
                    <rect width="10" height="20" fill={secondaryHex} />
                </pattern>
                
                <pattern id="pattern_CAMO" patternUnits="userSpaceOnUse" width="40" height="40">
                    <rect width="40" height="40" fill={primaryHex} />
                    <circle cx="10" cy="10" r="8" fill={secondaryHex} opacity="0.7" />
                    <circle cx="30" cy="30" r="12" fill={secondaryHex} opacity="0.7" />
                    <circle cx="30" cy="5" r="5" fill="#1e293b" opacity="0.3" />
                </pattern>

                <pattern id="pattern_HAZARD" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(-45)">
                    <rect width="20" height="20" fill="#facc15" />
                    <rect width="10" height="20" fill="#000" />
                </pattern>
            </defs>

            {renderLegs()}

            {/* CORE */}
            <g transform="translate(200, 320)">
                 <path d="M-50 -60 L50 -60 L40 60 L-40 60 Z" fill={getFill(PartCategory.CORE)} stroke={getStroke(PartCategory.CORE)} strokeWidth="2" />
                 <rect x="-20" y="-20" width="40" height="40" rx="5" fill="#0F172A" opacity="0.5" />
                 {highlightedCategory === PartCategory.GENERATOR && (
                     <circle cx="0" cy="0" r="15" fill="#22D3EE" filter="url(#glow)" />
                 )}
            </g>

            {/* HEAD */}
            <g transform="translate(200, 240)">
                 <path d="M-20 -30 L20 -30 L25 10 L-25 10 Z" fill={getFill(PartCategory.HEAD)} stroke={getStroke(PartCategory.HEAD)} strokeWidth="2" />
                 <rect x="-15" y="-15" width="30" height="5" fill="#22D3EE" filter="url(#glow)" />
            </g>

            {/* ARMS */}
            <g transform="translate(130, 320)">
                 <rect x="-30" y="-20" width="40" height="50" rx="5" fill={getFill(PartCategory.ARMS)} stroke={getStroke(PartCategory.ARMS)} strokeWidth="2" />
                 <rect x="-25" y="30" width="20" height="60" fill={getFill(PartCategory.ARMS)} stroke={getStroke(PartCategory.ARMS)} strokeWidth="2" />
                 {renderWeapon(build.parts.WEAPON_L.spec?.weaponType, 'L')}
            </g>

            <g transform="translate(270, 320)">
                 <rect x="-10" y="-20" width="40" height="50" rx="5" fill={getFill(PartCategory.ARMS)} stroke={getStroke(PartCategory.ARMS)} strokeWidth="2" />
                 <rect x="5" y="30" width="20" height="60" fill={getFill(PartCategory.ARMS)} stroke={getStroke(PartCategory.ARMS)} strokeWidth="2" />
                 {renderWeapon(build.parts.WEAPON_R.spec?.weaponType, 'R')}
            </g>

            {/* BACK UNITS */}
            <g transform="translate(150, 260)">
                 <path d="M0 0 L-40 -50 L-10 -60 L10 -10 Z" fill={getFill(PartCategory.BACK_L)} stroke={getStroke(PartCategory.BACK_L)} strokeWidth="2" />
            </g>
            <g transform="translate(250, 260)">
                 <path d="M0 0 L40 -50 L10 -60 L-10 -10 Z" fill={getFill(PartCategory.BACK_R)} stroke={getStroke(PartCategory.BACK_R)} strokeWidth="2" />
            </g>

            {/* BOOSTER INDICATOR */}
            {highlightedCategory === PartCategory.BOOSTER && (
                 <g transform="translate(200, 350)">
                     <path d="M-30 0 L-40 40 L-20 40 Z" fill="#F59E0B" opacity="0.8" />
                     <path d="M30 0 L40 40 L20 40 Z" fill="#F59E0B" opacity="0.8" />
                 </g>
            )}

            {/* RADIATOR INDICATOR */}
            {highlightedCategory === PartCategory.RADIATOR && (
                 <g transform="translate(200, 300)">
                     <rect x="-30" y="-10" width="60" height="5" fill="#3B82F6" opacity="0.8" filter="url(#glow)" />
                 </g>
            )}
        </svg>
    );
};

export default MechPreviewSVG;
