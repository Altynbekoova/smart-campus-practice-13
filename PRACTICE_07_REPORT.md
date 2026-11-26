# Practice 07 Report: Testing AI-Generated Code

## 1. Project Information

- **Project name:** Smart Campus Room Availability Checker
- **Technology stack:** React 18, TypeScript, Vite, Tailwind CSS
- **File under test:** `src/lib/validation.ts`
- **Function under test:** `checkAvailability(room, start, end, currentTime)`
- **Test file:** `src/lib/validation.test.ts`
- **Original test backup:** `src/lib/validation.test.original.ts`
- **Test framework:** Vitest 2.1.9
- **Date:** 2026-10-15

## 2. Acceptance Criteria to Test Mapping

| AC | Description | Original Tests | Improved Tests |
|----|-------------|---------------|----------------|
| AC1 | 0 ≤ start < end ≤ 1440, start strictly after currentTime | T02, T03, T04, T05, T16 | T02, T03, T04, T05, T16, T18, T19, T20 |
| AC2 | Reject bookings longer than 120 minutes | T06, T07 | T06, T07 |
| AC3 | Reject when room is blocked | T13 | T13 |
| AC4 | Reject overlapping intervals (touching endpoints allowed) | T01, T08, T09, T10, T11, T12, T14 | T01, T08, T09, T10, T11, T12, T14 |
| AC5 | No mutation of booking data | T15 | T15, T22, T23 |
| — | Invalid input handling | T17 | T17, T21 |
| — | Reason message quality | — | T24 |

## 3. Original vs Improved Test Comparison

### Original suite: 17 tests

| Test | Input | Expected | Result |
|------|-------|----------|--------|
| T01 | 660–720, touching after booking | available | PASS |
| T02 | 540–570, starts at current time (540) | unavailable | PASS |
| T03 | 720–720, zero duration | unavailable | PASS |
| T04 | 750–720, reversed interval | unavailable | PASS |
| T05 | 1380–1441, end outside day | unavailable | PASS |
| T06 | 720–840, exactly 120 minutes | available | PASS |
| T07 | 720–841, 121 minutes | unavailable | PASS |
| T08 | 570–600, touching before booking | available | PASS |
| T09 | 630–690, partial overlap | unavailable | PASS |
| T10 | 570–690, contains existing booking | unavailable | PASS |
| T11 | 615–645, inside existing booking | unavailable | PASS |
| T12 | 600–660, identical to existing booking | unavailable | PASS |
| T13 | 660–720, room blocked | unavailable | PASS |
| T14 | 630–690, no existing bookings | available | PASS |
| T15 | Bookings array unchanged after check | (no mutation) | PASS |
| T16 | Negative start time (-30) | unavailable | PASS |
| T17 | NaN start time | unavailable | PASS |

**Original result: 17/17 passed, 0 failed**

### Improved suite: 24 tests (7 new tests added)

| Test | Input | Expected | Result |
|------|-------|----------|--------|
| T01–T17 | (same as original) | (same) | PASS |
| T18 | 541–600, start one minute after current time, no bookings | available | PASS |
| T19 | 1320–1440, end at day boundary (1440), 120 min duration | available | PASS |
| T20 | 0–30, start at zero with currentTime=-1 | available | PASS |
| T21 | NaN end time (start=600) | unavailable | PASS |
| T22 | Bookings + blocked unchanged after unavailable (overlap) result | (no mutation) | PASS |
| T23 | Blocked flag + bookings unchanged after checking blocked room | (no mutation) | PASS |
| T24 | Overlap reason contains time range and booker name | (reason check) | PASS |

**Improved result: 24/24 passed, 0 failed**

### New tests added and rationale

| Test | Purpose |
|------|---------|
| T18 | Boundary: start exactly 1 minute after currentTime (541 vs 540) verifies strict `>` comparison |
| T19 | Boundary: end=1440 (valid day maximum) confirms upper limit is inclusive |
| T20 | Boundary: start=0 (valid day minimum) with currentTime=-1 confirms lower limit is inclusive |
| T21 | NaN end time — original suite only tested NaN start, leaving half of the NaN guard uncovered |
| T22 | Mutation check on unavailable path — original T15 only verified no mutation on the available path |
| T23 | Mutation check on blocked path — verifies `blocked` flag and bookings are unchanged when room is blocked |
| T24 | Reason message quality — verifies the overlap reason includes formatted times and booker name, not just a non-empty string |

## 4. Test Review Decisions

### Decision 1: Added boundary tests for AC1 inclusive limits

The original suite tested out-of-range values (T05: end=1441, T16: start=-30) but never confirmed that the boundary values themselves are accepted. T19 tests end=1440 (the valid maximum) and T20 tests start=0 (the valid minimum). Without these, a mutation that changed `end > 1440` to `end >= 1440` or `start < 0` to `start <= 0` would go undetected. These boundary tests close that gap.

### Decision 2: Added NaN end test (T21) to complete invalid-input coverage

The original suite had T17 for NaN start but nothing for NaN end. The function checks `isNaN(start) || isNaN(end)` — if someone mutated this to `isNaN(start)` only, T17 would still pass but the bug would go undetected. T21 closes this gap by passing a valid start with NaN end.

### Decision 3: Added mutation checks on unavailable paths (T22, T23)

The original T15 only verified the bookings array was unchanged after an available result. If the function accidentally mutated data on the unavailable path (e.g., adding a booking when an overlap is detected), T15 would not catch it. T22 checks the overlap path and T23 checks the blocked-room path, both verifying the bookings array and blocked flag remain unchanged.

### Decision 4: Added reason message content assertion (T24)

The original `expectUnavailable` helper only checked that `reason` was a non-empty string. This would pass even if the reason said "Error" with no useful detail. T24 verifies the overlap reason specifically contains the formatted time range ("10:00", "11:00") and the booker's name ("Alice"), ensuring the message is actually informative.

## 5. Test Framework and Run Command

- **Framework:** Vitest 2.1.9 (installed as devDependency)
- **Configuration:** `test` block in `vite.config.ts` with `globals: true` and `environment: 'node'`
- **Run command:** `npx vitest run` (or `npm test`)

## 6. Test Execution Results

### Original suite (17 tests)

```
 RUN  v2.1.9 /tmp/cc-agent/71831341/project

 ✓ src/lib/validation.test.ts (17 tests) 48ms

 Test Files  1 passed (1)
      Tests  17 passed (17)
   Start at  10:36:36
   Duration  2.50s
```

### Improved suite (24 tests)

```
 RUN  v2.1.9 /tmp/cc-agent/71831341/project

 ✓ src/lib/validation.test.ts (24 tests) 72ms

 Test Files  1 passed (1)
      Tests  24 passed (24)
   Start at  10:43:29
   Duration  2.52s
```

- **Total tests:** 24
- **Passed:** 24
- **Failed:** 0
- **Errors:** None

## 7. Mutation Testing Results

Each mutation was introduced one at a time. Tests were not modified during any mutation trial. After each trial, the correct code was restored before applying the next mutation.

| Mutation ID | Defect Description | Failed Tests | Detected? |
|-------------|-------------------|--------------|-----------|
| M1 | Changed `end - start > 120` to `end - start >= 120` (rejects exactly-120-min bookings) | T06, T19 | Yes |
| M2 | Changed overlap logic from `start < b.end && end > b.start` to `start <= b.end && end >= b.start` (touching endpoints incorrectly rejected) | T01, T08 | Yes |
| M3 | Removed the blocked-room check entirely (commented out `if (room.blocked)` block) | T13 | Yes |

### M1 Details

- **Defect:** `end - start >= 120` instead of `end - start > 120`
- **Effect:** Bookings of exactly 120 minutes are incorrectly rejected
- **Failed tests:** T06 (720–840, exactly 120 min, expected available), T19 (1320–1440, exactly 120 min, expected available)
- **Detected:** Yes — 2 tests caught the defect

### M2 Details

- **Defect:** `start <= b.end && end >= b.start` instead of `start < b.end && end > b.start`
- **Effect:** Bookings that merely touch an existing booking (sharing an endpoint) are incorrectly rejected as overlapping
- **Failed tests:** T01 (660–720 touching after, expected available), T08 (570–600 touching before, expected available)
- **Detected:** Yes — 2 tests caught the defect

### M3 Details

- **Defect:** Blocked-room check completely removed
- **Effect:** Blocked rooms can be booked without rejection
- **Failed tests:** T13 (660–720 with blocked room, expected unavailable)
- **Detected:** Yes — 1 test caught the defect

### Final verification after restoring correct code

```
 RUN  v2.1.9 /tmp/cc-agent/71831341/project

 ✓ src/lib/validation.test.ts (24 tests) 72ms

 Test Files  1 passed (1)
      Tests  24 passed (24)
   Start at  10:43:29
   Duration  2.52s
```

All 24 tests pass with the correct, restored code.

## 8. Remaining Limitations

1. **No UI integration tests:** These tests cover the pure validation function only. They do not test React components, user interactions, or how validation results are displayed in the UI.
2. **No test for multiple existing bookings:** All tests use at most one existing booking. A room with two or more bookings could reveal edge cases in the overlap detection loop.
3. **No test for very large currentTime values:** All tests use currentTime=540 (or -1 for T20). A test with currentTime near 1440 could reveal boundary interactions.
4. **No automated mutation testing tool:** Mutations were applied manually one at a time. A tool like Stryker could systematically generate and evaluate mutations.
5. **No test for non-integer time values:** All tests use integer minute values. The function does not explicitly reject floats (e.g., 540.5), and no test covers this.
6. **Reason message coverage is limited:** T24 checks the overlap reason message content, but no test verifies the specific wording of the blocked-room, duration, or time-range reason messages.
