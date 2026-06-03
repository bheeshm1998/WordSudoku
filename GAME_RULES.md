# Word Sudoku — Game Rules Specification

## 1. Overview

Word Sudoku is a letter-based board game played on a grid. The player fills empty cells with letters such that no letter repeats in any row or column, and no contiguous sequence of letters in any row or column forms a meaningful English word of 2 or more letters.

---

## 2. Board Sizes

Two board sizes are supported:

- **5×5** — 25 cells total, uses exactly 5 distinct letters
- **9×9** — 81 cells total, uses exactly 9 distinct letters

The phrase "distinct letters" means the entire board uses only N unique letters (N=5 or N=9), but each of those letters appears multiple times across the board — exactly once per row and once per column, following Sudoku placement rules.

---

## 3. Game Modes

| Board Size | Available Modes |
|------------|----------------|
| 5×5 | One default mode only (no difficulty label) |
| 9×9 | Three modes: EASY, MEDIUM, HARD |

---

## 4. Core Rules (Apply to All Modes and Board Sizes)

1. The board starts with some cells pre-filled. The player must fill all remaining empty cells.
2. Each letter must appear **exactly once per row** and **exactly once per column** (standard Sudoku constraint, using letters instead of numbers).
3. No contiguous sequence of letters — reading left-to-right, right-to-left, top-to-bottom, or bottom-to-top — within any single row or column may form a valid English word of **2 or more letters**.
4. The total set of letters used across the entire board is fixed per game: **exactly 5 distinct letters for a 5×5 board**, and **exactly 9 distinct letters for a 9×9 board**.
5. The player may only use letters from the **player pool** (defined per mode) when filling empty cells.

---

## 5. Letter Tier Classification

Letters are classified into three tiers based on their frequency of occurrence in short English words (words of 2–6 letters). This classification drives difficulty tuning.

| Tier | Description | Letters |
|------|-------------|---------|
| Tier 1 | Most frequently occurring in short English words | E, A, T, O, S, I, N, R, H, W, Y, B, F, M |
| Tier 2 | Moderately occurring in short English words | D, L, U, G, P, K, C |
| Tier 3 | Least frequently occurring in short English words | V, J, X, Q, Z |

**Tier counts:** Tier 1 = 14 letters, Tier 2 = 7 letters, Tier 3 = 5 letters. Total = 26 letters.

**Design rationale:** Tier 1 letters are the most dangerous in this game because they most readily combine into recognizable short words. Tier 3 letters are the safest because they rarely appear in short words and are unlikely to form meaningful combinations.

---

## 6. Difficulty System — The Three Knobs

Difficulty in the 9×9 board is controlled by three independent parameters, referred to as knobs. Each knob is set differently per mode.

| Knob | What It Controls |
|------|-----------------|
| Knob 1 | Which letters are selected for pre-filling the board |
| Knob 2 | How many cells are pre-filled |
| Knob 3 | The pool of letters the player is allowed to use when filling empty cells |

**Why these three knobs together determine difficulty:**

- Knob 1 sets the danger level of the fixed environment. Pre-filling with Tier 1 letters surrounds empty cells with word-forming letters.
- Knob 2 sets how constrained the player is. More pre-filled cells means fewer empty cells and less freedom to maneuver.
- Knob 3 sets the danger level of the player's toolkit. A smaller pool restricted to Tier 1 letters removes the player's ability to escape into safe letter choices.

---

## 7. Mode Specifications (9×9 Board Only)

### 7.1 EASY Mode

**Knob 1 — Pre-fill letter selection:**
Select exactly 9 letters as follows:
- 4 letters chosen at random from Tier 3
- 3 letters chosen at random from Tier 2
- 2 letters chosen at random from Tier 1

These 9 letters form the complete letter set for this game instance. All pre-filled cells and all player-filled cells use only these 9 letters.

**Knob 2 — Pre-fill count:**
Pre-fill a randomly chosen number of cells in the range **[20, 24]** (inclusive).

**Knob 3 — Player pool:**
The player pool contains **22 letters** (4 letters removed from the full alphabet of 26).
Removal breakdown:
- Remove 2 letters at random from Tier 1
- Remove 1 letter at random from Tier 2
- Remove 1 letter at random from Tier 3

The player may only place letters from this 22-letter pool into empty cells.

---

### 7.2 MEDIUM Mode

**Knob 1 — Pre-fill letter selection:**
Select exactly 9 letters as follows:
- 1 letter chosen at random from Tier 3
- 4 letters chosen at random from Tier 2
- 4 letters chosen at random from Tier 1

**Knob 2 — Pre-fill count:**
Pre-fill a randomly chosen number of cells in the range **[24, 28]** (inclusive).

**Knob 3 — Player pool:**
The player pool contains **18 letters** (8 letters removed from the full alphabet of 26).
Removal breakdown:
- Remove 2 letters at random from Tier 1
- Remove 3 letters at random from Tier 2
- Remove 3 letters at random from Tier 3

---

### 7.3 HARD Mode

**Knob 1 — Pre-fill letter selection:**
Select exactly 9 letters as follows:
- 0 letters from Tier 3
- 3 letters chosen at random from Tier 2
- 6 letters chosen at random from Tier 1

**Knob 2 — Pre-fill count:**
Pre-fill a randomly chosen number of cells in the range **[28, 32]** (inclusive).

**Knob 3 — Player pool:**
The player pool contains **14 letters** (12 letters removed from the full alphabet of 26).
Removal breakdown:
- Remove 4 letters at random from Tier 1
- Remove 4 letters at random from Tier 2
- Remove 4 letters at random from Tier 3

---

## 8. Mode Comparison Summary

| Parameter | EASY | MEDIUM | HARD |
|-----------|------|--------|------|
| Pre-fill letter mix (T1 / T2 / T3) | 2 / 3 / 4 | 4 / 4 / 1 | 6 / 3 / 0 |
| Pre-fill cell count | 20–25 | 30–35 | 40–45 |
| Player pool size | 22 letters | 18 letters | 14 letters |
| Letters removed from pool (T1 / T2 / T3) | 2 / 1 / 1 | 2 / 3 / 3 | 4 / 4 / 4 |

---

## 9. 5×5 Board — Default Mode

The 5×5 board has a single default mode with no difficulty label. It follows the same core rules as above with the following fixed parameters:

- Exactly **5 distinct letters** are used for the entire board
- Letter selection: weighted toward Tier 2 and Tier 3 (safe letters) to minimize word-formation risk
- Pre-fill count: **12–14 cells** out of 25 (inclusive)
- Player pool: full 26 letters available (no restriction)

The 5×5 mode serves as the onboarding experience. Its purpose is to teach the core mechanic — no repeats in rows/columns, no words forming — without difficulty pressure.

---

## 10. Glossary

| Term | Definition |
|------|------------|
| Distinct letters | The fixed set of N unique letters used across the entire board for a given game instance |
| Pre-filled cells | Cells whose letters are set by the system at game start and cannot be changed by the player |
| Player pool | The subset of the 26-letter alphabet from which the player is permitted to choose letters when filling empty cells |
| Contiguous sequence | An unbroken run of adjacent cells in the same row or column, read in any of the four directions: left-to-right, right-to-left, top-to-bottom, bottom-to-top |
| Valid word | Any meaningful English word of 2 or more letters |
| Tier | A classification of letters by their frequency of occurrence in short English words (2–6 letters) |