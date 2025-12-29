
// A robust Glicko-2 style rating calculator
// Simplified for this application but maintaining core mathematical principles.

const TAU = 0.5;

interface RatingData {
    rating: number;
    rd: number;
    vol: number;
}

const g = (phi: number) => {
    return 1 / Math.sqrt(1 + 3 * phi * phi / (Math.PI * Math.PI));
};

const E = (mu: number, mu_j: number, phi_j: number) => {
    return 1 / (1 + Math.exp(-g(phi_j) * (mu - mu_j)));
};

export const calculateRatingChange = (
    player: RatingData, 
    opponent: RatingData, 
    score: number // 1 = win, 0 = loss, 0.5 = draw
): { rating: number, rd: number, vol: number } => {
    
    // 1. Convert to Glicko-2 scale
    const mu = (player.rating - 1500) / 173.7178;
    const phi = player.rd / 173.7178;
    
    const mu_j = (opponent.rating - 1500) / 173.7178;
    const phi_j = opponent.rd / 173.7178;
    
    // 2. Compute variance (v)
    const g_phi_j = g(phi_j);
    const E_mu = E(mu, mu_j, phi_j);
    
    const v = 1 / (g_phi_j * g_phi_j * E_mu * (1 - E_mu));
    
    // 3. Compute delta
    const delta = v * g_phi_j * (score - E_mu);
    
    // 4. Update Volatility (Simplified: keeping constant for this game loop for stability)
    // In full Glicko-2 this involves an iterative algorithm. 
    // For this game, we'll just decay RD slightly less if volatility is high.
    const newVol = player.vol; 
    
    // 5. Update Rating Deviation
    // Pre-rating period RD decay not applied here as we do instant matches.
    const newPhi = 1 / Math.sqrt(1 / (phi * phi + newVol * newVol) + 1 / v);
    
    // 6. Update Rating
    const newMu = mu + newPhi * newPhi * g_phi_j * (score - E_mu);
    
    // 7. Convert back to Glicko scale
    const finalRating = 173.7178 * newMu + 1500;
    const finalRd = 173.7178 * newPhi;
    
    return {
        rating: Math.max(100, Math.round(finalRating)),
        rd: Math.max(30, Math.round(finalRd)),
        vol: newVol
    };
};

export const RANK_ORDER = ['E', 'D', 'C', 'B', 'A', 'S'];

export const getRankValue = (rank: string): number => {
    return RANK_ORDER.indexOf(rank);
};

export const getRankFromRating = (rating: number): string => {
    if (rating < 1200) return 'E';
    if (rating < 1400) return 'D';
    if (rating < 1600) return 'C';
    if (rating < 1800) return 'B';
    if (rating < 2000) return 'A';
    return 'S';
};
