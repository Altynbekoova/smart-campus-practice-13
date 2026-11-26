import { describe, it, expect } from 'vitest';
import { filterRooms, getEquipmentOptions } from './roomFilter';
import { SAMPLE_ROOMS } from '../data';

const ids = (rooms: { id: string }[]) => rooms.map((r) => r.id);

describe('filterRooms', () => {
  it('F1: capacity equal to requested attendees matches', () => {
    expect(ids(filterRooms(SAMPLE_ROOMS, { minCapacity: 40, equipment: [] }))).toEqual([
      'room-101',
      'room-102',
    ]);
  });

  it('F1: capacity below requested attendees is excluded', () => {
    expect(ids(filterRooms(SAMPLE_ROOMS, { minCapacity: 36, equipment: [] }))).toEqual([
      'room-101',
      'room-102',
    ]);
  });

  it('F2: room missing one of two selected equipment items is excluded', () => {
    expect(
      ids(filterRooms(SAMPLE_ROOMS, { minCapacity: null, equipment: ['Projector', 'Microphone'] }))
    ).toEqual(['room-102']);
  });

  it('F2: room must have every selected equipment item', () => {
    expect(
      ids(filterRooms(SAMPLE_ROOMS, { minCapacity: null, equipment: ['Projector', 'Lab benches'] }))
    ).toEqual(['room-101']);
  });

  it('F2: no equipment selected matches every room', () => {
    expect(ids(filterRooms(SAMPLE_ROOMS, { minCapacity: null, equipment: [] }))).toEqual([
      'room-101',
      'room-102',
      'room-103',
      'room-104',
    ]);
  });

  it('F4: no matches returns an empty list', () => {
    expect(filterRooms(SAMPLE_ROOMS, { minCapacity: 150, equipment: [] })).toEqual([]);
  });

  it('does not modify the input rooms', () => {
    const before = structuredClone(SAMPLE_ROOMS);
    filterRooms(SAMPLE_ROOMS, { minCapacity: 40, equipment: ['Projector'] });
    expect(SAMPLE_ROOMS).toEqual(before);
  });
});

describe('getEquipmentOptions', () => {
  it('returns unique equipment names in alphabetical order', () => {
    expect(getEquipmentOptions(SAMPLE_ROOMS)).toEqual([
      'Computers',
      'Lab benches',
      'Microphone',
      'Projector',
      'Video conferencing',
      'Whiteboard',
    ]);
  });
});
