Word based board game

Board size: 5x5 and 9x9

For the 9x9 board size -> three modes -> EASY MEDIUM HARD modes will be there

For the 5x5 board size -> Only one default mode will be there

Rules:
    There will be some pre-filled cells in the board
    The user needs to fill the rest of the cells of the board
    Any letter should not repeat in a row or in a column
    No combination of continuous letters should form a valid word (word having a meaning) of 2 or more letters.
    A total of 9 distinct letters to be used for prefilling in a 9x9 board and 5 in the case of 5x5 board. The board can contain multiple instances of the same letter with the constraint that the letter should not repeat in a row or column

Letter Distribution in English Language
Tier1 -> Letters that occur most commonly in English language:  E, A, T, O, S, I, N, R, H, W, Y, B, F, M
Tier2 -> Letters that occur less commonly in English language:  D, L, U, G, P, K, C
Tier3 -> Letters that occur the lest commonly in English language: V, J, X, Q, Z

Difficult level
    There are three ways in which the difficulty level is manifested in the 9x9 board size. A combination of these ways -> say 3 knobs
    Knob 1 -> Choosing what letters to be used for pre-filling the board
    Knob 2 -> Choosing how many letters to use for pre-filling the board
    Knob 3 -> Choosing the pool of letters which the user can use to fill the empty cells with letters. (lesser pool size for hard mode and vice versa)

EASY mode algorithm
    Knob 1 -> Choose any 4 random letters from tier-3, 3 random letters from tier-2 and 2 random letters from tier-1
    Knob 2 -> 20-25 cells to be prefilled -> both inclusive -> selected randomly
    Knob 3 -> Pool of 22 letters. (4 letters removed from the actual pool of 26 letters) with 2 letters removed at random from tier 1, 1 from tier 2 and 1 from tier 3

MEDIUM mode algorithm
    Knob 1 -> Choose any 1 random letters from tier-3, 4 random letters from tier-2 and 4 random letters from tier-1
    Knob 2 -> 30-35 cells to be prefilled -> both inclusive -> selected randomly
    Knob 3 -> Pool of 18 letters. (8 letters removed from the actual pool of 26 letters) with 2 letters removed at random from tier 1, 3 from tier 2 and 3 from tier 3

HARD mode algorithm
    Knob 1 -> Choose any 3 random letters from tier-2 and 5 random letters from tier-1
    Knob 2 -> 40-45 cells to be prefilled -> both inclusive -> selected randomly
    Knob 3 -> Pool of 14 letters. (12 letters removed from the actual pool of 26 letters) with  letters removed at random from tier 1, 4 from tier 2 and 4 from tier 3







