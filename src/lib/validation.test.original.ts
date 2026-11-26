import { describe, it, expect } from 'vitest';
import { checkAvailability } from './validation';
import type { Room } from '../types';

const CURRENT_TIME = 540;

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 'room-1',
    name: 'Test Room',
    building: 'Building A',
    capacity: 30,
    blocked: false,
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
  });

  describe('AC5: no mutation of booking data', () => {
    it('T15: bookings array unchanged after checking availability', () => {
      const room = makeRoom();
      const originalBookings = room.bookings.map((b) => ({ ...b }));
      checkAvailability(room, 660, 720, CURRENT_TIME);
      expect(room.bookings).toHaveLength(originalBookings.length);
      expect(room.bookings).toEqual(originalBookings);
    });
  });
});
