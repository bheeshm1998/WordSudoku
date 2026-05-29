export enum Difficulty {
    Easy = 'easy',
    Medium = 'medium',
    Hard = 'hard'
}

export const DIFFICULTY_LEVELS = [Difficulty.Easy, Difficulty.Medium, Difficulty.Hard];

export const BOARD_SIZES = [5, 7, 9];

// Pre-filled cell counts based on board size and difficulty
export const DIFFICULTY_PREFILLED_CONFIG: Record<Difficulty, Record<number, number>> = {
    [Difficulty.Easy]: {
        5: 12,
        7: 22,
        9: 35
    },
    [Difficulty.Medium]: {
        5: 9,
        7: 16,
        9: 26
    },
    [Difficulty.Hard]: {
        5: 6,
        7: 11,
        9: 18
    }
};

// Letter sets for puzzle generation based on difficulty
// Easy: avoid letters that form many common words (A-E-I-N-S-T)
// Medium: balanced random selection
// Hard: letters with more "near-word" risk
export const DIFFICULTY_LETTER_SETS: Record<Difficulty, string[]> = {
    [Difficulty.Easy]: [
        "BDFGHLMO",    // Hard consonants, fewer words
        "CDFKMPQR",    // More uncommon combinations
        "BGHJKNPQ",    // Avoiding vowels early
        "DFGKLMPW",    // Complex starting combos
    ],
    [Difficulty.Medium]: [
        "AEIOURSTLN",  // Original balanced set
        "AEIOURSTNI",  // Slightly modified
        "AEIOURSTLC",  // Different ending
        "AEIOURSTLM",  // Another variant
    ],
    [Difficulty.Hard]: [
        "AEIOURSFGP",  // Mix vowels with tricky consonants
        "AEIOURTZBC",  // Z and other challenging letters
        "AEIOURQXJK",  // Q and X for complexity
        "AEIOURVYHW",  // Y and W variations
    ]
};

export const BOARD_SIZE_CONFIGS: Record<number, { initialWord: string }> = {
    5: { initialWord: "AETIONSUEI" },
    7: { initialWord: "AEIOURSTLIN" },
    9: { initialWord: "AEIOURSTLNCGD" },
};

export let BOARD_SIZE = 5;
export let DIFFICULTY = Difficulty.Medium;
export let NUM_OF_PREFILLED_CELLS = 9;
export let INITIALIZING_WORD = "AETIONSUEI";

export function updateBoardConfig(size: number, difficulty: Difficulty = Difficulty.Medium) {
    BOARD_SIZE = size;
    DIFFICULTY = difficulty;
    NUM_OF_PREFILLED_CELLS = DIFFICULTY_PREFILLED_CONFIG[difficulty][size];
    INITIALIZING_WORD = getLetterSetForDifficulty(difficulty);
}

export function getLetterSetForDifficulty(difficulty: Difficulty): string {
    const sets = DIFFICULTY_LETTER_SETS[difficulty];
    return sets[Math.floor(Math.random() * sets.length)];
}

export type ThemeName = 'green' | 'blue' | 'neon' | 'dark';

export const THEME_NAMES: ThemeName[] = ['green', 'blue', 'neon', 'dark'];

export const THEME_LABELS: Record<ThemeName, string> = {
    green: 'Forest',
    blue: 'Ocean',
    neon: 'Neon',
    dark: 'Midnight'
};

interface ThemePalette {
    blockedCell: string;
    activeCell: string;
    inactiveCell: string;
    duplicateCharCell: string;
    duplicateCharCellLocked: string;
    // Five-stop gradient used for highlighting a discovered word, from the
    // "anchor" end (most saturated) to the trailing end (faded).
    wordGradientStops: string[];
}

export const THEME_PALETTES: Record<ThemeName, ThemePalette> = {
    green: {
        blockedCell: "#2d6a4f",
        activeCell: "#B0D9B1",
        inactiveCell: "#D0E7D2",
        duplicateCharCell: "rgba(251, 81, 111, 0.82)",
        duplicateCharCellLocked: "rgba(190, 18, 45, 0.90)",
        wordGradientStops: [
            "rgba(255,137,90,1)",
            "rgba(255,148,106,1)",
            "rgba(254,167,134,1)",
            "rgba(251,181,156,1)",
            "rgba(255,206,189,1)",
            "rgba(255,225,217,1)",
            "rgba(255,240,235,1)",
            "rgba(255,250,245,1)",
            "rgba(255,255,255,1)"
        ]
    },
    blue: {
        blockedCell: "#1e3a8a",
        activeCell: "#bfdbfe",
        inactiveCell: "#dbeafe",
        duplicateCharCell: "rgba(244, 63, 94, 0.82)",
        duplicateCharCellLocked: "rgba(175, 12, 38, 0.90)",
        wordGradientStops: [
            "rgba(255,170,77,1)",
            "rgba(255,184,99,1)",
            "rgba(255,198,123,1)",
            "rgba(255,213,148,1)",
            "rgba(255,227,176,1)",
            "rgba(255,238,204,1)",
            "rgba(255,246,227,1)",
            "rgba(255,251,243,1)",
            "rgba(255,255,255,1)"
        ]
    },
    neon: {
        blockedCell: "#1a0a3e",
        activeCell: "#2d1b69",
        inactiveCell: "#1f0d4a",
        duplicateCharCell: "rgba(255, 45, 146, 0.85)",
        duplicateCharCellLocked: "rgba(200, 0, 90, 0.92)",
        wordGradientStops: [
            "rgba(0,255,247,1)",
            "rgba(45,212,255,1)",
            "rgba(80,180,255,1)",
            "rgba(120,150,255,1)",
            "rgba(160,130,255,1)",
            "rgba(180,120,240,1)",
            "rgba(200,130,220,1)",
            "rgba(220,160,210,1)",
            "rgba(240,200,210,1)"
        ]
    },
    dark: {
        blockedCell: "#1f2937",
        activeCell: "#475569",
        inactiveCell: "#334155",
        duplicateCharCell: "rgba(220, 38, 38, 0.85)",
        duplicateCharCellLocked: "rgba(153, 20, 20, 0.92)",
        wordGradientStops: [
            "rgba(245,158,11,1)",
            "rgba(251,176,46,1)",
            "rgba(252,194,83,1)",
            "rgba(252,211,120,1)",
            "rgba(253,224,158,1)",
            "rgba(253,234,191,1)",
            "rgba(253,242,217,1)",
            "rgba(254,248,234,1)",
            "rgba(255,253,247,1)"
        ]
    }
};

function buildGradient(stops: string[]): Record<string, string> {
    const directions: Record<string, string> = {
        leftToRight: "90deg",
        rightToLeft: "-90deg",
        topToBottom: "180deg",
        bottomToTop: "0deg"
    };
    const out: Record<string, string> = {};
    for (const dirKey of Object.keys(directions)) {
        const angle = directions[dirKey];
        for (let i = 0; i < stops.length - 1; i++) {
            out[`${dirKey}_${i}`] = `linear-gradient(${angle}, ${stops[i]} 0%, ${stops[i + 1]} 100%)`;
        }
    }
    return out;
}

export function applyThemePalette(name: ThemeName): void {
    const palette = THEME_PALETTES[name];
    CELL_COLOR.BLOCKED_CELL = palette.blockedCell;
    CELL_COLOR.ACTIVE_CELL = palette.activeCell;
    CELL_COLOR.INACTIVE_CELL = palette.inactiveCell;
    CELL_COLOR.DUPLICATE_CHAR_CELL = palette.duplicateCharCell;
    CELL_COLOR.DUPLICATE_CHAR_CELL_LOCKED = palette.duplicateCharCellLocked;
    const grad = buildGradient(palette.wordGradientStops);
    // Wipe and repopulate so previous theme keys don't linger.
    for (const k of Object.keys(GRADIENT)) {
        delete GRADIENT[k];
    }
    Object.assign(GRADIENT, grad);
}

export const GRADIENT: Record<string, string> = {
    leftToRight_0: `linear-gradient(90deg, rgba(255,137,90,1) 0%, rgba(255,148,106,1) 100%)`,
    leftToRight_1: `linear-gradient(90deg, rgba(255,148,106,1) 0%, rgba(254,167,134,1) 100%)`,
    leftToRight_2: `linear-gradient(90deg, rgba(254,167,134,1) 0%, rgba(251,181,156,1) 100%)`,
    leftToRight_3: `linear-gradient(90deg, rgba(251,181,156,1) 0%, rgba(255,206,189,1) 100%)`,
    leftToRight_4: `linear-gradient(90deg, rgba(255,206,189,1) 0%, rgba(255,225,217,1) 100%)`,
    leftToRight_5: `linear-gradient(90deg, rgba(255,225,217,1) 0%, rgba(255,240,235,1) 100%)`,
    leftToRight_6: `linear-gradient(90deg, rgba(255,240,235,1) 0%, rgba(255,250,245,1) 100%)`,
    leftToRight_7: `linear-gradient(90deg, rgba(255,250,245,1) 0%, rgba(255,255,255,1) 100%)`,
    leftToRight_8: `linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%)`,

    rightToLeft_0: `linear-gradient(-90deg, rgba(255,137,90,1) 0%, rgba(255,148,106,1) 100%)`,
    rightToLeft_1: `linear-gradient(-90deg, rgba(255,148,106,1) 0%, rgba(254,167,134,1) 100%)`,
    rightToLeft_2: `linear-gradient(-90deg, rgba(254,167,134,1) 0%, rgba(251,181,156,1) 100%)`,
    rightToLeft_3: `linear-gradient(-90deg, rgba(251,181,156,1) 0%, rgba(255,206,189,1) 100%)`,
    rightToLeft_4: `linear-gradient(-90deg, rgba(255,206,189,1) 0%, rgba(255,225,217,1) 100%)`,
    rightToLeft_5: `linear-gradient(-90deg, rgba(255,225,217,1) 0%, rgba(255,240,235,1) 100%)`,
    rightToLeft_6: `linear-gradient(-90deg, rgba(255,240,235,1) 0%, rgba(255,250,245,1) 100%)`,
    rightToLeft_7: `linear-gradient(-90deg, rgba(255,250,245,1) 0%, rgba(255,255,255,1) 100%)`,
    rightToLeft_8: `linear-gradient(-90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%)`,

    topToBottom_0: `linear-gradient(180deg, rgba(255,137,90,1) 0%, rgba(255,148,106,1) 100%)`,
    topToBottom_1: `linear-gradient(180deg, rgba(255,148,106,1) 0%, rgba(254,167,134,1) 100%)`,
    topToBottom_2: `linear-gradient(180deg, rgba(254,167,134,1) 0%, rgba(251,181,156,1) 100%)`,
    topToBottom_3: `linear-gradient(180deg, rgba(251,181,156,1) 0%, rgba(255,206,189,1) 100%)`,
    topToBottom_4: `linear-gradient(180deg, rgba(255,206,189,1) 0%, rgba(255,225,217,1) 100%)`,
    topToBottom_5: `linear-gradient(180deg, rgba(255,225,217,1) 0%, rgba(255,240,235,1) 100%)`,
    topToBottom_6: `linear-gradient(180deg, rgba(255,240,235,1) 0%, rgba(255,250,245,1) 100%)`,
    topToBottom_7: `linear-gradient(180deg, rgba(255,250,245,1) 0%, rgba(255,255,255,1) 100%)`,
    topToBottom_8: `linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%)`,

    bottomToTop_0: `linear-gradient(0deg, rgba(255,137,90,1) 0%, rgba(255,148,106,1) 100%)`,
    bottomToTop_1: `linear-gradient(0deg, rgba(255,148,106,1) 0%, rgba(254,167,134,1) 100%)`,
    bottomToTop_2: `linear-gradient(0deg, rgba(254,167,134,1) 0%, rgba(251,181,156,1) 100%)`,
    bottomToTop_3: `linear-gradient(0deg, rgba(251,181,156,1) 0%, rgba(255,206,189,1) 100%)`,
    bottomToTop_4: `linear-gradient(0deg, rgba(255,206,189,1) 0%, rgba(255,225,217,1) 100%)`,
    bottomToTop_5: `linear-gradient(0deg, rgba(255,225,217,1) 0%, rgba(255,240,235,1) 100%)`,
    bottomToTop_6: `linear-gradient(0deg, rgba(255,240,235,1) 0%, rgba(255,250,245,1) 100%)`,
    bottomToTop_7: `linear-gradient(0deg, rgba(255,250,245,1) 0%, rgba(255,255,255,1) 100%)`,
    bottomToTop_8: `linear-gradient(0deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%)`,
}

export const CELL_COLOR: any = {
    BLOCKED_CELL: "#618264",
    ACTIVE_CELL: "#B0D9B1",
    INACTIVE_CELL: "#D0E7D2",
    DUPLICATE_CHAR_CELL: "rgba(251, 81, 111, 0.82)",
    DUPLICATE_CHAR_CELL_LOCKED: "rgba(190, 18, 45, 0.90)",
}

export const WORDS_FILE_PATH = 'assets/final_words.txt';

export const FAILURE_INFO = {
    DUPLICATE: "duplicate",
    WORD_EXISTS: "wordExists"
}

export const START_TIME_TEXT = "00:00";
export const BEST_SCORE_DEFAULT_STRING = "-";