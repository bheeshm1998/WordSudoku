import {
    BOARD_SIZES as CONFIG_BOARD_SIZES,
    BOARD_SIZE_CONFIG,
    BoardSize,
    DIFFICULTIES as CONFIG_DIFFICULTIES,
    DIFFICULTY_KNOB_CONFIG,
    Difficulty,
    GameConfig,
    getPlayerPool,
    getPrefillCellCount,
    selectLettersForBoard,
    TIER_1,
    TIER_2,
    TIER_3
} from './config/game-config';

export { Difficulty, BoardSize, TIER_1, TIER_2, TIER_3 };
export const DIFFICULTY_LEVELS = CONFIG_DIFFICULTIES;
export const BOARD_SIZES = CONFIG_BOARD_SIZES;

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

export let BOARD_SIZE: BoardSize = 5;
export let DIFFICULTY: Difficulty | null = null;
export let NUM_OF_PREFILLED_CELLS = 12;
export let INITIALIZING_WORD = "";
export let PLAYER_POOL: Set<string> = new Set();

export function updateBoardConfig(size: BoardSize, difficulty: Difficulty | null) {
    BOARD_SIZE = size;

    if (size === 5) {
        DIFFICULTY = null;
        const config = BOARD_SIZE_CONFIG[5];
        NUM_OF_PREFILLED_CELLS = getPrefillCellCount(config.prefillCellRange);
        const safeLetters = selectLettersForBoard({ tier1: 1, tier2: 2, tier3: 2 }, 5);
        INITIALIZING_WORD = safeLetters.join('');
        PLAYER_POOL = new Set(['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']);
    } else {
        DIFFICULTY = difficulty;
        if (difficulty) {
            const knobConfig = DIFFICULTY_KNOB_CONFIG[difficulty];
            NUM_OF_PREFILLED_CELLS = getPrefillCellCount(knobConfig.prefillCellRange);
            const letters = selectLettersForBoard(knobConfig.prefillLetterMix, 9);
            INITIALIZING_WORD = letters.join('');
            PLAYER_POOL = getPlayerPool(knobConfig.playerPoolRemoval);
        }
    }
}

export function getLetterSetForDifficulty(difficulty: Difficulty | null): string {
    return INITIALIZING_WORD;
}

export function getCurrentBoardSize(): BoardSize {
    return BOARD_SIZE;
}

export function getCurrentDifficulty(): Difficulty | null {
    return DIFFICULTY;
}

export function getCurrentNumPrefilledCells(): number {
    return NUM_OF_PREFILLED_CELLS;
}

export function getPlayerPoolLetters(): Set<string> {
    return PLAYER_POOL;
}

export function applyThemePalette(name: ThemeName): void {
    const palette = THEME_PALETTES[name];
    CELL_COLOR.BLOCKED_CELL = palette.blockedCell;
    CELL_COLOR.ACTIVE_CELL = palette.activeCell;
    CELL_COLOR.INACTIVE_CELL = palette.inactiveCell;
    CELL_COLOR.DUPLICATE_CHAR_CELL = palette.duplicateCharCell;
    CELL_COLOR.DUPLICATE_CHAR_CELL_LOCKED = palette.duplicateCharCellLocked;
    const grad = buildGradient(palette.wordGradientStops);
    for (const k of Object.keys(GRADIENT)) {
        delete GRADIENT[k];
    }
    Object.assign(GRADIENT, grad);
}