import type { Room } from '../types';

export interface RoomFilter {
  minCapacity: number | null;
  equipment: string[];
}

export function filterRooms(rooms: Room[], filter: RoomFilter): Room[] {
  return rooms.filter((room) => {
    if (filter.minCapacity !== null && room.capacity < filter.minCapacity) return false;
    return filter.equipment.every((item) => room.equipment.includes(item));
  });
}

export function getEquipmentOptions(rooms: Room[]): string[] {
  return [...new Set(rooms.flatMap((room) => room.equipment))].sort();
}
