import type { Room } from '../types';
import { MAX_BOOKING_MINUTES } from './bookingPolicy';

export type CheckResult =
  | { status: 'available' }
  | { status: 'unavailable'; reason: string };

export function checkAvailability(
  room: Room,
  start: number,
  end: number,
  currentTime: number
): CheckResult {
  if (isNaN(start) || isNaN(end) || isNaN(currentTime)) {
    return { status: 'unavailable', reason: 'Please enter valid start and end times.' };
  }

  // AC1: 0 ≤ start < end ≤ 1440, and start must be strictly after current time
  if (start < 0 || end > 1440) {
    return { status: 'unavailable', reason: 'Times must be between 00:00 and 24:00.' };
  }
  if (start >= end) {
    return { status: 'unavailable', reason: 'Start time must be earlier than end time.' };
  }
  if (start <= currentTime) {
    return { status: 'unavailable', reason: 'Start time must be after the current time.' };
  }

  // AC2: reject bookings longer than 120 minutes
  if (end - start > MAX_BOOKING_MINUTES) {
    return { status: 'unavailable', reason: `Bookings cannot be longer than ${MAX_BOOKING_MINUTES} minutes.` };
  }

  // AC3: reject when room is blocked
  if (room.blocked) {
    return { status: 'unavailable', reason: 'This room is currently blocked and cannot be booked.' };
  }

  // AC4: reject overlapping intervals (touching endpoints allowed)
  const overlap = room.bookings.find((b) => start < b.end && end > b.start);
  if (overlap) {
    return {
      status: 'unavailable',
      reason: `Overlaps an existing booking (${fmt(overlap.start)}–${fmt(overlap.end)} by ${overlap.bookedBy}).`,
    };
  }

  // AC5: available — does not modify booking data
  return { status: 'available' };
}

export function fmt(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

export function timeToMinutes(t: string): number {
  const match = TIME_PATTERN.exec(t);
  if (!match) return NaN;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h === 24 && m === 0) return 1440;
  if (h > 23 || m > 59) return NaN;
  return h * 60 + m;
}

export function minutesToTime(min: number): string {
  return fmt(min);
}
