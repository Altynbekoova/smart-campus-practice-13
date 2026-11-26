import type { Room } from './types';

export const SAMPLE_ROOMS: Room[] = [
  {
    id: 'room-101',
    name: 'Engineering Lab A',
    building: 'Block C',
    capacity: 40,
    blocked: false,
    equipment: ['Projector', 'Whiteboard', 'Lab benches'],
    bookings: [
      { id: 'b1', start: 540, end: 600, bookedBy: 'Dr. Chen' },
      { id: 'b2', start: 780, end: 840, bookedBy: 'Prof. Lopez' },
    ],
  },
  {
    id: 'room-102',
    name: 'Lecture Hall 2',
    building: 'Block A',
    capacity: 120,
    blocked: false,
    equipment: ['Projector', 'Microphone', 'Whiteboard'],
    bookings: [
      { id: 'b3', start: 600, end: 660, bookedBy: 'Dept. of Physics' },
    ],
  },
  {
    id: 'room-103',
    name: 'Seminar Room B',
    building: 'Block B',
    capacity: 20,
    blocked: true,
    equipment: ['Whiteboard', 'Video conferencing'],
    bookings: [],
  },
  {
    id: 'room-104',
    name: 'Computer Lab 1',
    building: 'Block D',
    capacity: 35,
    blocked: false,
    equipment: ['Computers', 'Projector'],
    bookings: [
      { id: 'b4', start: 480, end: 540, bookedBy: 'Ms. Patel' },
      { id: 'b5', start: 900, end: 960, bookedBy: 'Mr. Okoro' },
    ],
  },
];
