
import { MechBuild } from '../types';

export const getMechValidationErrors = (mech: MechBuild): string[] => {
    const errors: string[] = [];
    
    // Weight Check: Total weight must not exceed leg capacity
    if (mech.stats.weight > mech.stats.weightCapacity) {
        errors.push(`WEIGHT OVERLOAD (${mech.stats.weight} / ${mech.stats.weightCapacity})`);
    }

    // Energy Check: Drain must not exceed output * 1.2 (Spec)
    if (mech.stats.energyDrain > mech.stats.energyOutput * 1.2) {
        errors.push(`ENERGY CRITICAL (${mech.stats.energyDrain} > ${Math.floor(mech.stats.energyOutput * 1.2)})`);
    }
    
    // AI Capacity Check
    if (mech.stats.aiLoad > mech.stats.aiCapacity) {
        errors.push(`AI CPU OVERLOAD (${mech.stats.aiLoad} / ${mech.stats.aiCapacity})`);
    }

    return errors;
};
