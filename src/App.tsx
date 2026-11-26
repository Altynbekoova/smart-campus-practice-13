import { useState, useMemo } from 'react';
import {
  Clock,
  Building2,
  Users,
  Ban,
  CheckCircle2,
  XCircle,
  CalendarClock,
  RefreshCw,
  DoorClosed,
  FlaskConical,
} from 'lucide-react';
import { SAMPLE_ROOMS } from './data';
import Practice12 from './views/Practice12';
import { MAX_BOOKING_MINUTES } from './lib/bookingPolicy';
import { checkAvailability, fmt, timeToMinutes } from './lib/validation';
import type { CheckResult } from './lib/validation';
import { filterRooms, getEquipmentOptions } from './lib/roomFilter';
import type { Room } from './types';

function parseAttendeeInput(text: string): { minCapacity: number | null; valid: boolean } {
  const trimmed = text.trim();
  if (trimmed === '') return { minCapacity: null, valid: true };
  const count = Number(trimmed);
  return Number.isInteger(count) && count >= 1
    ? { minCapacity: count, valid: true }
    : { minCapacity: null, valid: false };
}

function matchRooms(rooms: Room[], attendeeText: string, equipment: string[]): Room[] {
  const { minCapacity, valid } = parseAttendeeInput(attendeeText);
  return valid ? filterRooms(rooms, { minCapacity, equipment }) : [];
}

function App() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  if (view === 'practice12') {
    return <Practice12 />;
  }

  return <Checker />;
}

function Checker() {
  const [rooms] = useState<Room[]>(SAMPLE_ROOMS);
  const [attendeeInput, setAttendeeInput] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(SAMPLE_ROOMS[0].id);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [currentTimeStr, setCurrentTimeStr] = useState('08:00');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);

  const equipmentOptions = useMemo(() => getEquipmentOptions(rooms), [rooms]);
  const matchingRooms = matchRooms(rooms, attendeeInput, selectedEquipment);
  const attendeeValid = parseAttendeeInput(attendeeInput).valid;
  const selectedRoom = matchingRooms.find((r) => r.id === selectedRoomId) ?? null;

  const currentTime = timeToMinutes(currentTimeStr);

  const syncSelection = (nextMatches: Room[]) => {
    if (!nextMatches.some((r) => r.id === selectedRoomId)) {
      setSelectedRoomId(nextMatches[0]?.id ?? null);
    }
    setResult(null);
    setShowSchedule(false);
  };

  const handleAttendeeChange = (value: string) => {
    setAttendeeInput(value);
    syncSelection(matchRooms(rooms, value, selectedEquipment));
  };

  const toggleEquipment = (item: string) => {
    const next = selectedEquipment.includes(item)
      ? selectedEquipment.filter((e) => e !== item)
      : [...selectedEquipment, item];
    setSelectedEquipment(next);
    syncSelection(matchRooms(rooms, attendeeInput, next));
  };

  const handleCheck = () => {
    if (!selectedRoom) return;
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    const res = checkAvailability(selectedRoom, start, end, currentTime);
    setResult(res);
    setShowSchedule(true);
  };

  const handleReset = () => {
    setStartTime('');
    setEndTime('');
    setResult(null);
    setShowSchedule(false);
  };

  const minTimeAttr = currentTimeStr;
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const durationMin = !isNaN(startMin) && !isNaN(endMin) ? endMin - startMin : null;
  const endTimeMin = startTime || minTimeAttr;
  const exceedsDurationLimit = durationMin !== null && durationMin > MAX_BOOKING_MINUTES;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 text-slate-800">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 rounded-xl p-2.5 shadow-md">
              <DoorClosed className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Smart Campus Room Checker</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Check room availability before you book.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Current time selector */}
        <section className="mb-6 rounded-2xl bg-white shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-slate-500" />
            <label className="text-sm font-semibold text-slate-700">
              Current campus time
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={currentTimeStr}
              onChange={(e) => {
                setCurrentTimeStr(e.target.value);
                setResult(null);
              }}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition"
            />
            <span className="text-sm text-slate-500">
              {isNaN(currentTime) ? (
                <span className="text-red-600 font-medium">Please set a valid current time.</span>
              ) : (
                <>
                  = <span className="font-mono font-semibold text-slate-700">{fmt(currentTime)}</span> ({currentTime} min)
                </>
              )}
            </span>
          </div>
        </section>

        {/* Room filters */}
        <section className="mb-6 rounded-2xl bg-white shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700">Filter rooms</h2>
          </div>

          <label htmlFor="attendee-count" className="block text-xs font-medium text-slate-500 mb-1.5">
            Number of attendees
          </label>
          <input
            id="attendee-count"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={attendeeInput}
            onChange={(e) => handleAttendeeChange(e.target.value)}
            placeholder="Any"
            className="w-full sm:w-40 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition"
          />
          {!attendeeValid && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">Enter a whole number of 1 or more.</p>
          )}

          <fieldset className="mt-4">
            <legend className="block text-xs font-medium text-slate-500 mb-2">Required equipment</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {equipmentOptions.map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEquipment.includes(item)}
                    onChange={() => toggleEquipment(item)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
                  />
                  {item}
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        {/* Room selection cards */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
            Select a room
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {matchingRooms.length === 0 ? (
              <div className="sm:col-span-2 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                No rooms match these filters. Lower the attendee count or remove an equipment item.
              </div>
            ) : matchingRooms.map((room) => {
              const isSelected = room.id === selectedRoomId;
              return (
                <button
                  key={room.id}
                  onClick={() => {
                    setSelectedRoomId(room.id);
                    setResult(null);
                    setShowSchedule(false);
                  }}
                  className={[
                    'text-left rounded-xl border p-4 transition-all duration-200',
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">{room.name}</h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" /> {room.building}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {room.capacity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5">{room.equipment.join(' · ')}</p>
                    </div>
                    {room.blocked && (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full whitespace-nowrap">
                        <Ban className="w-3.5 h-3.5" /> Blocked
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Booking interval form */}
        <section className="mb-6 rounded-2xl bg-white shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="w-5 h-5 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700">Booking interval</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Start time</label>
              <input
                type="time"
                value={startTime}
                min={minTimeAttr}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setResult(null);
                }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition"
                placeholder="HH:MM"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">End time</label>
              <input
                type="time"
                value={endTime}
                min={endTimeMin}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setResult(null);
                }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition"
                placeholder="HH:MM"
              />
            </div>
          </div>

          {durationMin !== null && (
            <div className="mt-3 text-sm">
              {durationMin > 0 ? (
                <span className={exceedsDurationLimit ? 'text-red-600 font-medium' : 'text-emerald-600 font-medium'}>
                  Duration: {durationMin} min{exceedsDurationLimit ? ` — exceeds ${MAX_BOOKING_MINUTES}-minute limit` : ''}
                </span>
              ) : (
                <span className="text-red-600 font-medium">End time must be after start time.</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={handleCheck}
              disabled={!startTime || !endTime || !selectedRoom}
              className="flex-1 sm:flex-none bg-emerald-600 text-white text-sm font-semibold rounded-lg px-6 py-2.5 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Check Availability
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Reset
            </button>
          </div>
        </section>

        {/* Result banner */}
        {result && selectedRoom && (
          <section
            className={[
              'mb-6 rounded-2xl border p-5 transition-all duration-300',
              result.status === 'available'
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-red-300 bg-red-50',
            ].join(' ')}
          >
            <div className="flex items-start gap-3">
              {result.status === 'available' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p
                  className={[
                    'font-bold text-lg',
                    result.status === 'available' ? 'text-emerald-700' : 'text-red-700',
                  ].join(' ')}
                >
                  {result.status === 'available' ? 'Available' : 'Unavailable'}
                </p>
                {result.status === 'unavailable' && (
                  <p className="text-sm text-red-600 mt-0.5">{result.reason}</p>
                )}
                {result.status === 'available' && (
                  <p className="text-sm text-emerald-600 mt-0.5">
                    {selectedRoom.name} is free from{' '}
                    <span className="font-mono font-semibold">{fmt(timeToMinutes(startTime))}</span>{' '}
                    to{' '}
                    <span className="font-mono font-semibold">{fmt(timeToMinutes(endTime))}</span>.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Room schedule */}
        {showSchedule && selectedRoom && (
          <section className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
              Existing schedule — {selectedRoom.name}
            </h2>
            {selectedRoom.bookings.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No existing bookings for this room.</p>
            ) : (
              <ul className="space-y-2">
                {selectedRoom.bookings.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-100"
                  >
                    <span className="font-mono text-sm font-medium text-slate-700">
                      {fmt(b.start)} – {fmt(b.end)}
                    </span>
                    <span className="text-xs text-slate-500">{b.bookedBy}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-slate-400">
        <a
          href="/?view=practice12"
          className="inline-flex items-center gap-1 mr-4 text-sky-600 hover:text-sky-800 transition-colors"
        >
          <FlaskConical className="w-3.5 h-3.5" /> Practice 12 view
        </a>
        Fictional sample data for demonstration only.
      </footer>
    </div>
  );
}

export default App;
