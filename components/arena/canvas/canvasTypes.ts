
export interface VisualEffect {
    id: string;
    x: number;
    y: number;
    text?: string;
    color: string;
    life: number;
    maxLife: number;
    velocity: { x: number, y: number };
    type: 'TEXT' | 'PARTICLE' | 'EXPLOSION' | 'RING';
    size: number;
}
