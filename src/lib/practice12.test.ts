import { describe, it, expect } from 'vitest';
import {
  PRACTICE12_CASES,
  evaluate,
  fixtureUnchanged,
  getEngineeringLabA,
  resolveLiveRequest,
  runCase,
  withBlockedFlag,
  displayInterval,
  FIXED_CURRENT_MINUTES,
} from './practice12';
import { SAMPLE_ROOMS } from '../data';

// Fixed clock: 10:00. Shared expected cases with the in-app verification panel.
const CURRENT = FIXED_CURRENT_MINUTES;

function toLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

describe('Practice 12: shared eight-case verification', () => {
  it('runs every shared case and matches the expected availability and code', () => {
    const results = PRACTICE12_CASES.map((c) => ({ id: c.id, ...runCase(c) }));
    for (const { id, pass } of results) {
      expect(pass, `case ${id}`).toBe(true);
    }
    // free + adjacency available; the other five unavailable
    const available = results.filter((r) => r.result.available).map((r) => r.id);
    expect(available.sort()).toEqual(['adjacent', 'free']);
  });

  it('case free: 10:30–11:30 is available', () => {
    const room = getEngineeringLabA();
    expect(evaluate(room, 630, 690, CURRENT)).toMatchObject({
      available: true,
      code: 'AVAILABLE',
    });
  });

  it('case overlap: 12:30–13:30 overlaps the 13:00–14:00 booking', () => {
    const room = getEngineeringLabA();
    expect(evaluate(room, 750, 810, CURRENT)).toMatchObject({
      available: false,
      code: 'OVERLAPS_EXISTING_BOOKING',
    });
  });

  it('case blocked: blocked room is unavailable regardless of free slot', () => {
    const room = withBlockedFlag(getEngineeringLabA(), true);
    expect(evaluate(room, 630, 690, CURRENT)).toMatchObject({
      available: false,
      code: 'ROOM_BLOCKED',
    });
  });

  it('case zero: zero duration is rejected', () => {
    const room = getEngineeringLabA();
    expect(evaluate(room, 630, 630, CURRENT)).toMatchObject({
      available: false,
      code: 'INVALID_INPUT',
    });
  });

  it('case 121: 121 minutes exceeds the 120-minute limit', () => {
    const room = getEngineeringLabA();
    expect(evaluate(room, 630, 751, CURRENT)).toMatchObject({
      available: false,
      code: 'EXCEEDS_MAX_DURATION',
    });
  });

  it('case past: start before the fixed current time is rejected', () => {
    const room = getEngineeringLabA();
    expect(evaluate(room, 480, 540, CURRENT)).toMatchObject({
      available: false,
      code: 'START_NOT_IN_FUTURE',
    });
  });

  it('case adjacent: 12:00–13:00 touches the 13:00–14:00 booking and is available', () => {
    const room = getEngineeringLabA();
    expect(evaluate(room, 720, 780, CURRENT)).toMatchObject({
      available: true,
      code: 'AVAILABLE',
    });
  });

  it('case unchanged fixture: bookings and flags survive every check', () => {
    expect(fixtureUnchanged()).toBe(true);
    const room = getEngineeringLabA();
    expect(room.bookings).toHaveLength(2);
    expect(room.blocked).toBe(false);
    // Fixture source array still holds the same booking rows.
    expect(SAMPLE_ROOMS[0].bookings).toHaveLength(2);
  });

  it('accepts an explicit start time and displays the same interval it checked', () => {
    const room = getEngineeringLabA();
    const res = evaluate(room, 660, 720, CURRENT); // 11:00–12:00, free window
    expect(res.available).toBe(true);
    expect(res.code).toBe('AVAILABLE');
    expect(displayInterval(660, 720)).toEqual({ start: '11:00', end: '12:00' });
  });

  it('requires the start to be strictly after the current time', () => {
    const room = getEngineeringLabA();
    expect(evaluate(room, CURRENT, CURRENT + 60, CURRENT).available).toBe(false);
    expect(evaluate(room, CURRENT + 1, CURRENT + 61, CURRENT).available).toBe(true);
  });

  it('derives the displayed interval from the same request used for the overlap check', () => {
    // 12:00–13:00 touches the 13:00–14:00 booking: checked and shown as identical interval.
    const room = getEngineeringLabA();
    const res = evaluate(room, 720, 780, CURRENT);
    expect(res.available).toBe(true);
    expect(displayInterval(720, 780)).toEqual({ start: '12:00', end: '13:00' });
  });

  it('rejects yesterday at a later clock hour (full timestamp, not minute-of-day)', () => {
    const room = getEngineeringLabA();
    const now = new Date(2026, 10, 26, 9, 0); // today 09:00
    const yesterdayLaterHour = new Date(2026, 10, 25, 15, 0); // yesterday 15:00 > 09:00 by clock only
    const out = resolveLiveRequest(
      { whenLocal: toLocal(yesterdayLaterHour), durationMin: 60, blocked: false, now },
      room
    );
    expect(out.ok).toBe(false);
    expect(out.result.available).toBe(false);
    expect(out.result.code).toBe('START_NOT_IN_FUTURE');
  });

  it('accepts tomorrow earlier than today’s clock hour (00:00 on a future day works)', () => {
    const room = getEngineeringLabA();
    const now = new Date(2026, 10, 26, 9, 0); // today 09:00
    const tomorrowEarly = new Date(2026, 10, 27, 0, 0); // tomorrow 00:00, earlier clock time than now
    const out = resolveLiveRequest(
      { whenLocal: toLocal(tomorrowEarly), durationMin: 60, blocked: false, now },
      room
    );
    expect(out.ok).toBe(true);
    expect(out.result.available).toBe(true);
    expect(out.result.code).toBe('AVAILABLE');
    expect(out).toMatchObject({ start: 0, end: 60 });
  });

  it('rejects a start exactly at now (strictly future)', () => {
    const room = getEngineeringLabA();
    const now = new Date(2026, 10, 26, 9, 0);
    const exactNow = new Date(2026, 10, 26, 9, 0);
    const out = resolveLiveRequest(
      { whenLocal: toLocal(exactNow), durationMin: 60, blocked: false, now },
      room
    );
    expect(out.ok).toBe(false);
    expect(out.result.code).toBe('START_NOT_IN_FUTURE');
  });

  it('applies the same-day overlap rule on a future day, not against today’s minute-of-day', () => {
    const room = getEngineeringLabA();
    const now = new Date(2026, 10, 26, 9, 0); // today 09:00
    // Next week 13:30–14:30 overlaps the 13:00–14:00 booking on that day.
    const futureOverlap = new Date(2026, 11, 3, 13, 30);
    const out = resolveLiveRequest(
      { whenLocal: toLocal(futureOverlap), durationMin: 60, blocked: false, now },
      room
    );
    expect(out.ok).toBe(true);
    expect(out.result.available).toBe(false);
    expect(out.result.code).toBe('OVERLAPS_EXISTING_BOOKING');
    // And a future-day slot earlier than today's clock time is not rejected by the past rule.
    const futureEarly = new Date(2026, 11, 3, 8, 0); // 08:00, earlier than today's 09:00 clock time
    const ok = resolveLiveRequest(
      { whenLocal: toLocal(futureEarly), durationMin: 60, blocked: false, now },
      room
    );
    expect(ok.result.available).toBe(true);
    expect(ok.result.code).toBe('AVAILABLE');
  });
});
