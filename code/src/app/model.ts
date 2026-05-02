export interface Cell {
    row: number,
    col: number,
    letter: string;
    isActive: boolean;
    isLocked: boolean;
    background: string;
    hasConflict?: boolean;
    isInSelectedRow?: boolean;
    isInSelectedCol?: boolean;
} 

export interface WordValidation {
    hasDuplicates: boolean,
    wordAlreadyExists: boolean,
    duplicateCharacter: string,
    doesReverseExist: boolean
}

export interface WordMeaning{
    word: string,
    meanings?: Meaning[];
}

export interface Meaning {
    partOfSpeech: string;
    definitions: Definition[];
}

export interface Definition{
    definition: string;
    example: string;
}