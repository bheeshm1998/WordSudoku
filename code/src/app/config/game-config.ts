export const TIER_1 = ['E', 'A', 'T', 'O', 'S', 'I', 'N', 'R', 'H', 'W', 'Y', 'B', 'F', 'M'];
export const TIER_2 = ['D', 'L', 'U', 'G', 'P', 'K', 'C'];
export const TIER_3 = ['V', 'J', 'X', 'Q', 'Z'];
export const ALL_LETTERS = [...TIER_1, ...TIER_2, ...TIER_3];

export type BoardSize = 5 | 9;

export enum Difficulty {
    Easy = 'easy',
    Medium = 'medium',
    Hard = 'hard'
}

export const DIFFICULTIES = [Difficulty.Easy, Difficulty.Medium, Difficulty.Hard];
export const BOARD_SIZES: BoardSize[] = [5, 9];

interface KnobConfig {
    prefillLetterMix: { tier1: number; tier2: number; tier3: number };
    prefillCellRange: [number, number];
    playerPoolSize: number;
    playerPoolRemoval: { tier1: number; tier2: number; tier3: number };
}

export const DIFFICULTY_KNOB_CONFIG: Record<Difficulty, KnobConfig> = {
    [Difficulty.Easy]: {
        prefillLetterMix: { tier1: 2, tier2: 3, tier3: 4 },
        prefillCellRange: [20, 24],
        playerPoolSize: 22,
        playerPoolRemoval: { tier1: 2, tier2: 1, tier3: 1 }
    },
    [Difficulty.Medium]: {
        prefillLetterMix: { tier1: 4, tier2: 4, tier3: 1 },
        prefillCellRange: [24, 28],
        playerPoolSize: 18,
        playerPoolRemoval: { tier1: 2, tier2: 3, tier3: 3 }
    },
    [Difficulty.Hard]: {
        prefillLetterMix: { tier1: 6, tier2: 3, tier3: 0 },
        prefillCellRange: [28, 32],
        playerPoolSize: 14,
        playerPoolRemoval: { tier1: 4, tier2: 4, tier3: 4 }
    }
};

export const BOARD_SIZE_CONFIG: Record<BoardSize, {
    prefillCellRange: [number, number];
    letterSelectionBias: 'safe' | 'normal';
}> = {
    5: {
        prefillCellRange: [12, 14],
        letterSelectionBias: 'safe'
    },
    9: {
        prefillCellRange: [20, 32],
        letterSelectionBias: 'normal'
    }
};

export interface GameConfig {
    boardSize: BoardSize;
    difficulty: Difficulty | null;
}

export function getRandomLettersFromTier(tier: string[], count: number): string[] {
    const shuffled = [...tier];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
}

export function selectLettersForBoard(mix: { tier1: number; tier2: number; tier3: number }, boardSize: number): string[] {
    const letters: string[] = [];
    letters.push(...getRandomLettersFromTier(TIER_1, mix.tier1));
    letters.push(...getRandomLettersFromTier(TIER_2, mix.tier2));
    letters.push(...getRandomLettersFromTier(TIER_3, mix.tier3));
    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters;
}

export function getPlayerPool(removal: { tier1: number; tier2: number; tier3: number }): Set<string> {
    const available = new Set(ALL_LETTERS);
    const toRemove = [
        ...getRandomLettersFromTier(TIER_1, removal.tier1),
        ...getRandomLettersFromTier(TIER_2, removal.tier2),
        ...getRandomLettersFromTier(TIER_3, removal.tier3)
    ];
    toRemove.forEach(l => available.delete(l));
    return available;
}

export function getPrefillCellCount(range: [number, number]): number {
    return range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
}