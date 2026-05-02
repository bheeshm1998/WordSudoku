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
}

export const WORDS_FILE_PATH = 'assets/final_words.txt';

export const FAILURE_INFO = {
    DUPLICATE: "duplicate",
    WORD_EXISTS: "wordExists"
}

export const START_TIME_TEXT = "00:00.0";
export const BEST_SCORE_DEFAULT_STRING = "-";