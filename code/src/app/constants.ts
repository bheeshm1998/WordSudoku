export const BOARD_SIZE = 5;
export const NUM_OF_PREFILLED_CELLS = 10;

export const WORDS_FILE_PATH = 'assets/final_words.txt';

export const GRADIENT: any = {
    leftToRight_0: `linear-gradient(90deg, rgba(255,137,90,1) 0%, rgba(255,148,106,1) 100%)`,
    leftToRight_1: `linear-gradient(90deg, rgba(255,148,106,1) 0%, rgba(254,167,134,1) 100%)`,
    leftToRight_2: `linear-gradient(90deg, rgba(254,167,134,1) 0%, rgba(251,181,156,1) 100%)`,
    leftToRight_3: `linear-gradient(90deg, rgba(251,181,156,1) 0%, rgba(255,206,189,1) 100%)`,
    leftToRight_4: `linear-gradient(90deg, rgba(255,206,189,1) 0%, rgba(255,225,217,1) 100%)`,

    rightToLeft_0: `linear-gradient(-90deg, rgba(255,137,90,1) 0%, rgba(255,148,106,1) 100%)`,
    rightToLeft_1: `linear-gradient(-90deg, rgba(255,148,106,1) 0%, rgba(254,167,134,1) 100%)`,
    rightToLeft_2: `linear-gradient(-90deg, rgba(254,167,134,1) 0%, rgba(251,181,156,1) 100%)`,
    rightToLeft_3: `linear-gradient(-90deg, rgba(251,181,156,1) 0%, rgba(255,206,189,1) 100%)`,
    rightToLeft_4: `linear-gradient(-90deg, rgba(255,206,189,1) 0%, rgba(255,225,217,1) 100%)`,

    topToBottom_0: `linear-gradient(180deg, rgba(255,137,90,1) 0%, rgba(255,148,106,1) 100%)`,
    topToBottom_1: `linear-gradient(180deg, rgba(255,148,106,1) 0%, rgba(254,167,134,1) 100%)`,
    topToBottom_2: `linear-gradient(180deg, rgba(254,167,134,1) 0%, rgba(251,181,156,1) 100%)`,
    topToBottom_3: `linear-gradient(180deg, rgba(251,181,156,1) 0%, rgba(255,206,189,1) 100%)`,
    topToBottom_4: `linear-gradient(180deg, rgba(255,206,189,1) 0%, rgba(255,225,217,1) 100%)`,

    bottomToTop_0: `linear-gradient(0deg, rgba(255,137,90,1) 0%, rgba(255,148,106,1) 100%)`,
    bottomToTop_1: `linear-gradient(0deg, rgba(255,148,106,1) 0%, rgba(254,167,134,1) 100%)`,
    bottomToTop_2: `linear-gradient(0deg, rgba(254,167,134,1) 0%, rgba(251,181,156,1) 100%)`,
    bottomToTop_3: `linear-gradient(0deg, rgba(251,181,156,1) 0%, rgba(255,206,189,1) 100%)`,
    bottomToTop_4: `linear-gradient(0deg, rgba(255,206,189,1) 0%, rgba(255,225,217,1) 100%)`,
}

export const INITIALIZING_WORD = "AETIONSUEI";

export const CELL_COLOR: any = {
    BLOCKED_CELL: "#618264",
    ACTIVE_CELL: "#B0D9B1",
    INACTIVE_CELL: "#D0E7D2",
    DUPLICATE_CHAR_CELL: "rgba(251, 81, 111, 0.82)",
}

export const FAILURE_INFO = {
    DUPLICATE: "duplicate",
    WORD_EXISTS: "wordExists"
}

export const START_TIME_TEXT = "00:00.0";
export const BEST_SCORE_DEFAULT_STRING = "-";