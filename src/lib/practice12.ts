import type { Room } from '../types';
import { SAMPLE_ROOMS } from '../data';
import { checkAvailability, fmt } from './validation';

export type ReasonCode =
  | 'AVAILABLE'
  | 'INVALID_INPUT'
  | 'START_NOT_IN_FUTURE'
  | 'EXCEEDS_MAX_DURATION'
  | 'ROOM_BLOCKED'
  | 'OVERLAPS_EXISTING_BOOKING';

export interface Practice12Result {
  available: boolean;
  code: ReasonCode;
  message: string;
}

export const LAB_ROOM_ID = 'room-101';
export const LAB_ROOM_NAME = 'Engineering Lab A';
// Fixed clock for repeatable checks: 10:00, just after the first booking ends.
export const FIXED_CURRENT_MINUTES = 600;

export function getEngineeringLabA(): Room {
  const room = SAMPLE_ROOMS.find((r) => r.id === LAB_ROOM_ID);
  if (!room) throw new Error(`${LAB_ROOM_NAME} fixture missing`);
  return { ...room, bookings: room.bookings.map((b) => ({ ...b })) };
}

export function withBlockedFlag(room: Room, blocked: boolean): Room {
  return blocked === room.blocked ? room : { ...room, blocked };
}

export function toReasonCode(reason: string): ReasonCode {
  if (reason.startsWith('Overlaps')) return 'OVERLAPS_EXISTING_BOOKING';
  if (reason.startsWith('This room is currently blocked')) return 'ROOM_BLOCKED';
  if (reason.startsWith('Bookings cannot be longer')) return 'EXCEEDS_MAX_DURATION';
  if (reason.startsWith('Start time must be after')) return 'START_NOT_IN_FUTURE';
  return 'INVALID_INPUT';
}

export function evaluate(
  room: Room,
  start: number,
  end: number,
  currentTime: number
): Practice12Result {
  const res = checkAvailability(room, start, end, currentTime);
  if (res.status === 'available') {
    return {
      available: true,
      code: 'AVAILABLE',
      message: `${room.name} is free ${fmt(start)}–${fmt(end)}.`,
    };
  }
  return { available: false, code: toReasonCode(res.reason), message: res.reason };
}

export interface Practice12Case {
  id: string;
  label: string;
  start: number;
  end: number;
  blocked: boolean;
  expected: { available: boolean; code: ReasonCode };
}

// Shared expected cases: used by the in-app panel and the automated tests.
export const PRACTICE12_CASES: Practice12Case[] = [
  { id: 'free', label: 'Free slot 10:30–11:30', start: 630, end: 690, blocked: false, expected: { available: true, code: 'AVAILABLE' } },
  { id: 'overlap', label: 'Overlaps 13:00–14:00 booking', start: 750, end: 810, blocked: false, expected: { available: false, code: 'OVERLAPS_EXISTING_BOOKING' } },
  { id: 'blocked', label: 'Room blocked', start: 630, end: 690, blocked: true, expected: { available: false, code: 'ROOM_BLOCKED' } },
  { id: 'zero', label: 'Zero duration', start: 630, end: 630, blocked: false, expected: { available: false, code: 'INVALID_INPUT' } },
  { id: '121', label: '121 minutes exceeds limit', start: 630, end: 751, blocked: false, expected: { available: false, code: 'EXCEEDS_MAX_DURATION' } },
  { id: 'past', label: 'Start before current time', start: 480, end: 540, blocked: false, expected: { available: false, code: 'START_NOT_IN_FUTURE' } },
  { id: 'adjacent', label: 'Exact adjacency 12:00–13:00', start: 720, end: 780, blocked: false, expected: { available: true, code: 'AVAILABLE' } },
];

export function runCase(
  c: Practice12Case,
  currentTime: number = FIXED_CURRENT_MINUTES
): { result: Practice12Result; pass: boolean } {
  const room = withBlockedFlag(getEngineeringLabA(), c.blocked);
  const result = evaluate(room, c.start, c.end, currentTime);
  return {
    result,
    pass: result.available === c.expected.available && result.code === c.expected.code,
  };
}

export function displayInterval(start: number, end: number): { start: string; end: string } {
  return { start: fmt(start), end: fmt(end) };
}

export function fixtureUnchanged(): boolean {
  const snapshot = structuredClone(SAMPLE_ROOMS);
  PRACTICE12_CASES.forEach((c) => runCase(c));
  return JSON.stringify(SAMPLE_ROOMS) === JSON.stringify(snapshot);
}
