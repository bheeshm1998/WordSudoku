# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

The repo has two independent npm projects at the root:

- [code/](code/) — the Angular 14 word-sudoku app (the actual game). All `npm` / `ng` commands below must be run from this directory.
- [dictionary-utility/](dictionary-utility/) — a one-off Node script that calls `dictionaryapi.dev` to filter a raw word list down to dictionary-validated 3–5 letter words. Its output is what gets shipped as [code/src/assets/final_words.txt](code/src/assets/final_words.txt). Re-run only when regenerating the word list.

## Common commands (run from `code/`)

```bash
npm install            # one-time
npm start              # ng serve --port 4001 --open  (note: NOT the default 4200)
npm run build          # ng build (defaults to production configuration)
npm run watch          # ng build --watch --configuration development
npm test               # ng test  (Karma + Jasmine)
npx ng test --include='**/board.component.spec.ts'   # run a single spec file
npx ng test --watch=false --browsers=ChromeHeadless  # single CI-style run
```

TypeScript is strict (`strict`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `strictTemplates`); expect template type errors, not just code errors.

## Regenerating the word list (`dictionary-utility/`)

```bash
cd dictionary-utility
npm install
# put raw candidate words (one per line) in input.txt
node main.js           # writes dictionary-validated words to output.txt
# manually copy output.txt → ../code/src/assets/final_words.txt
```

`main.js` filters to length 3–5 and only keeps words where `dictionaryapi.dev` returns 200. It is sequential and slow; expect long runtimes for large inputs.

## Game rules (the invariants the code enforces)

A solved board is one where, for every row and every column:

1. No character repeats within that row/column (any duplicate among 3+ contiguous cells fails — the duplicate-cell check in [board.component.ts](code/src/app/board/board.component.ts) considers every substring of length ≥3).
2. No contiguous substring of length ≥3 forms an English word **in either direction** (forward or reversed). The word list is `ALL_WORDS`, loaded once from `assets/final_words.txt`.

The board starts with `NUM_OF_PREFILLED_CELLS` locked cells (filled from a shuffled `INITIALIZING_WORD`). The user fills the remaining cells; a fully-filled board is auto-validated on every input.

## Architecture

Angular 14 module-based app (no standalone components). Single route, single page.

- [src/app/board/board.component.ts](code/src/app/board/board.component.ts) — **the entire game lives here**. Owns the `Cell[][]` board, the timer (`setInterval`, 100 ms tick), the localStorage best-score logic (`bestScore` key), prefill seeding, and the full row/column validation loop. New game rules belong here.
- [src/app/cell/cell.component.ts](code/src/app/cell/cell.component.ts) — a single editable square. Emits `cellClick` and `cellValueChange`; the parent `BoardComponent` decides what those mean. The cell uppercases input and keeps only the last typed character so an "input" replaces the existing letter.
- [src/app/word-meaning/word-meaning.component.ts](code/src/app/word-meaning/word-meaning.component.ts) — modal that displays a definition fetched on demand when the player asks "see meaning" for the colliding word.
- [src/app/services/dictionary.service.ts](code/src/app/services/dictionary.service.ts) — wraps `https://api.dictionaryapi.dev/api/v2/entries/en/<word>` and shapes the response into the `WordMeaning` interface in [model.ts](code/src/app/model.ts).
- [src/app/services/file-service.service.ts](code/src/app/services/file-service.service.ts) — generic `HttpClient.get` for static text assets. Used to load the word list.
- [src/app/constants.ts](code/src/app/constants.ts) — `BOARD_SIZE`, `NUM_OF_PREFILLED_CELLS`, `INITIALIZING_WORD`, the `GRADIENT` palette used to color a discovered word across cells, `CELL_COLOR` states, and the `WORDS_FILE_PATH`. Tune game difficulty here.
- [src/app/utils/utility-methods.ts](code/src/app/utils/utility-methods.ts) — index helpers; `getAListOfRandomIndicesDistributedUniformly` picks prefill positions from either even-only or odd-only cell indices to spread them across the board.

### Things to know before changing validation logic

- Word loading splits on `\r\n` (CRLF). If you regenerate `final_words.txt` on a non-Windows machine, fix the split or normalize line endings — otherwise `ALL_WORDS` will be empty and validation will silently always pass.
- `wordAlreadyExists` is a linear scan over `ALL_WORDS` and runs inside an O(BOARD_SIZE² × substring²) double loop. It's fine for `BOARD_SIZE = 5`; if you bump board size (the [idea.txt](code/src/app/idea.txt) backlog mentions 9×9), index `ALL_WORDS` into a `Set` first.
- `colorExistingWord` uses the `GRADIENT` map keyed `leftToRight_0..4` / `rightToLeft_0..4` / `topToBottom_0..4` / `bottomToTop_0..4`. The gradient only has 5 stops, so the existing-word highlighting is implicitly tied to `BOARD_SIZE = 5`. Increase the gradient table if you increase the board.
- Best score is persisted in `localStorage` under the key `"bestScore"` as the formatted `MM:SS.t` string. The comparison in `checkIfRecordBroke` parses this back; keep the format if you change the timer.
