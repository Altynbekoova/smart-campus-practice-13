import { describe, it, expect } from 'vitest';
import { checkAvailability, timeToMinutes } from './validation';
import type { Room } from '../types';
import { SAMPLE_ROOMS } from '../data';

const CURRENT_TIME = 540;

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 'room-1',
    name: 'Test Room',
    building: 'Building A',
    capacity: 30,
    blocked: false,
    equipment: [],
    bookings: [{ id: 'b1', start: 600, end: 660, bookedBy: 'Alice' }],
    ...overrides,
  };
}

function expectAvailable(result: ReturnType<typeof checkAvailability>): void {
  expect(result.status).toBe('available');
}

function expectUnavailable(result: ReturnType<typeof checkAvailability>): void {
  expect(result.status).toBe('unavailable');
  if (result.status === 'unavailable') {
    expect(typeof result.reason).toBe('string');
    expect(result.reason.length).toBeGreaterThan(0);
  }
}

describe('checkAvailability', () => {
  describe('AC4: overlapping intervals (touching endpoints allowed)', () => {
    it('T01: 660–720 touching after existing booking → available', () => {
      const room = makeRoom();
      const result = checkAvailability(room, 660, 720, CURRENT_TIME);
      expectAvailable(result);
    });

    it('T08: 570–600 touching before existing booking → available', () => {
      const room = makeRoom();
      const result = checkAvailability(room, 570, 600, CURRENT_TIME);
      expectAvailable(result);
    });

    it('T09: 630–690 partial overlap with existing booking → unavailable', () => {
      const room = makeRoom();
      const result = checkAvailability(room, 630, 690, CURRENT_TIME);
      expectUnavailable(result);
    });

    it('T10: 570–690 contains existing booking → unavailable', () => {
      const room = makeRoom();
      const result = checkAvailability(room, 570, 690, CURRENT_TIME);
      expectUnavailable(result);
    });

    it('T11: 615–645 inside existing booking → unavailable', () => {
      const room = makeRoom();
      const result = checkAvailability(room, 615, 645, CURRENT_TIME);
      expectUnavailable(result);
    });

    it('T12: 600–660 identical to existing booking → unavailable', () => {
      const room = makeRoom();
      const result = checkAvailability(room, 600, 660, CURRENT_TIME);
      expectUnavailable(result);
    });

    it('T14: 630–690 with no existing bookings → available', () => {
      const room = makeRoom({ bookings: [] });
      const result = checkAvailability(room, 630, 690, CURRENT_TIME);
      expectAvailable(result);
    });
  });

  describe('AC1: valid time range and start after current time', () => {
    it('T29: 510–540 starts before current time → unavailable', () => {
      const room = makeRoom({ bookings: [] });
      expect(checkAvailability(room, 510, 540, CURRENT_TIME)).toEqual({
        status: 'unavailable',
        reason: 'Start time must be after the current time.',
      });
    });

    it('T02: 540–570 starts at current time → unavailable', () => {
      const room = makeRoom();
      const result = checkAvailability(room, 540, 570, CURRENT_TIME);
      expectUnavailable(result);
    });

    it('T03: 720–720 zero duration → unavailable', () => {
      const room = makeRoom();
      const result = checkAvailability(room, 720, 720, CURRENT_TIME);
      expectUnavailable(result);
    });

    it('T04: 750–720 reversed interval → unavailable', () => {
      const room = makeRoom();
      const result = checkAvailability(room, 750, 720, CURRENT_TIME);
      expectUnavailable(result);
    });

    it('T05: 1380–1441 end outside day → unavailable', () => {
      const room = makeRoom();
      const result = checkAvailability(room, 1380, 1441, CURRENT_TIME);
      expectUnavailable(result);
    });

    it('T16: negative start time → unavailable', () => {
      const room = makeRoom();
      const result = checkAvailability(room, -30, 600, CURRENT_TIME);
      expectUnavailable(result);
    });

    it('T18: 541–600 start one minute after current time → available', () => {
      const room = makeRoom({ bookings: [] });
      const result = checkAvailability(room, 541, 600, CURRENT_TIME);
      expectAvailable(result);
    });

    it('T19: 1320–1440 end at day boundary (1440), 120 min → available', () => {
      const room = makeRoom({ bookings: [] });
      const result = checkAvailability(room, 1320, 1440, CURRENT_TIME);
      expectAvailable(result);
    });

    it('T20: 0–30 start at zero with currentTime=-1 → available', () => {
      const room = makeRoom({ bookings: [] });
      const result = checkAvailability(room, 0, 30, -1);
      expectAvailable(result);
    });
  });

  describe('AC2: booking duration limit', () => {
    it('T06: 720–840 exactly 120 minutes → available', () => {
      const room = makeRoom();
      const result = checkAvailability(room, 720, 840, CURRENT_TIME);
      expectAvailable(result);
    });

    it('T07: 720–841 121 minutes → unavailable', () => {
      const room = makeRoom();
      const result = checkAvailability(room, 720, 841, CURRENT_TIME);
      expectUnavailable(result);
    });
  });

  describe('AC3: blocked room', () => {
    it('T13: 660–720 with blocked room → unavailable', () => {
      const room = makeRoom({ blocked: true });
      const result = checkAvailability(room, 660, 720, CURRENT_TIME);
      expectUnavailable(result);
    });
  });

  describe('Invalid input handling', () => {
    it('T17: NaN start time → unavailable', () => {
      const room = makeRoom();
      const result = checkAvailability(room, NaN, 600, CURRENT_TIME);
      expectUnavailable(result);
    });

    it('T21: NaN end time → unavailable', () => {
      const room = makeRoom();
      const result = checkAvailability(room, 600, NaN, CURRENT_TIME);
      expectUnavailable(result);
    });

    it('T25: NaN currentTime does not bypass start-after-now check → unavailable', () => {
      const room = makeRoom({ bookings: [] });
      const result = checkAvailability(room, 600, 660, NaN);
      expectUnavailable(result);
    });

    it('T26: NaN currentTime with otherwise-valid past start → unavailable', () => {
      const room = makeRoom({ bookings: [] });
      const result = checkAvailability(room, 300, 360, NaN);
      expectUnavailable(result);
    });
  });

  describe('AC5: no mutation of booking data', () => {
    it('T30: sample fixtures remain unchanged after available and overlapping requests', () => {
      const room = SAMPLE_ROOMS.find(({ id }) => id === 'room-102')!;
      const before = structuredClone(SAMPLE_ROOMS);
      const bookings = room.bookings;

      expectAvailable(checkAvailability(room, 660, 720, CURRENT_TIME));
      expectUnavailable(checkAvailability(room, 630, 690, CURRENT_TIME));

      expect(SAMPLE_ROOMS).toEqual(before);
      expect(room.bookings).toBe(bookings);
    });

    it('T15: bookings array unchanged after checking availability (available path)', () => {
      const room = makeRoom();
      const originalBookings = room.bookings.map((b) => ({ ...b }));
      checkAvailability(room, 660, 720, CURRENT_TIME);
      expect(room.bookings).toHaveLength(originalBookings.length);
      expect(room.bookings).toEqual(originalBookings);
    });

    it('T22: bookings array and blocked flag unchanged after unavailable result (overlap path)', () => {
      const room = makeRoom();
      const originalBookings = room.bookings.map((b) => ({ ...b }));
      const originalBlocked = room.blocked;
      checkAvailability(room, 630, 690, CURRENT_TIME);
      expect(room.bookings).toEqual(originalBookings);
      expect(room.blocked).toBe(originalBlocked);
    });

    it('T23: blocked flag unchanged after checking a blocked room', () => {
      const room = makeRoom({ blocked: true });
      const originalBlocked = room.blocked;
      const originalBookings = room.bookings.map((b) => ({ ...b }));
      checkAvailability(room, 660, 720, CURRENT_TIME);
      expect(room.blocked).toBe(originalBlocked);
      expect(room.bookings).toEqual(originalBookings);
    });
  });

  describe('Reason message quality', () => {
    it('T24: overlap reason includes existing booking time range and booker name', () => {
      const room = makeRoom();
      const result = checkAvailability(room, 630, 690, CURRENT_TIME);
      expectUnavailable(result);
      if (result.status === 'unavailable') {
        expect(result.reason).toContain('10:00');
        expect(result.reason).toContain('11:00');
        expect(result.reason).toContain('Alice');
      }
    });

    it('T27: reversed interval reason clearly states start must be earlier than end', () => {
      const room = makeRoom({ bookings: [] });
      const result = checkAvailability(room, 750, 720, CURRENT_TIME);
      expectUnavailable(result);
      if (result.status === 'unavailable') {
        expect(result.reason).toContain('Start time must be earlier than end time');
      }
    });

    it('T28: equal start and end reason clearly states start must be earlier than end', () => {
      const room = makeRoom({ bookings: [] });
      const result = checkAvailability(room, 720, 720, CURRENT_TIME);
      expectUnavailable(result);
      if (result.status === 'unavailable') {
        expect(result.reason).toContain('Start time must be earlier than end time');
      }
    });
  });
});

describe('timeToMinutes: strict HH:MM parsing', () => {
  it('returns NaN for malformed or out-of-range times', () => {
    for (const value of ['', '10:', '10', '10:30:45', '1:30', '10.30', ' 10:30', '10:30 ', '24:01', '23:60', '25:00', '-1:00', 'ab:cd']) {
      expect(timeToMinutes(value), value).toBeNaN();
    }
  });

  it('parses valid times and the 24:00 day-end boundary', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('08:00')).toBe(480);
    expect(timeToMinutes('23:59')).toBe(1439);
    expect(timeToMinutes('24:00')).toBe(1440);
  });
});
