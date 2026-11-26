import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, FlaskConical, Clock, Lock, Unlock } from 'lucide-react';
import {
  PRACTICE12_CASES,
  LAB_ROOM_NAME,
  getEngineeringLabA,
  resolveLiveRequest,
  runCase,
} from '../lib/practice12';
import { fmt } from '../lib/validation';
import type { Practice12Result } from '../lib/practice12';

const codeStyles: Record<Practice12Result['code'], string> = {
  AVAILABLE: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  OVERLAPS_EXISTING_BOOKING: 'text-red-700 bg-red-50 border-red-200',
  ROOM_BLOCKED: 'text-amber-700 bg-amber-50 border-red-200',
  EXCEEDS_MAX_DURATION: 'text-red-700 bg-red-50 border-red-200',
  START_NOT_IN_FUTURE: 'text-red-700 bg-red-50 border-red-200',
  INVALID_INPUT: 'text-slate-700 bg-slate-50 border-slate-200',
};

// Local ISO-style local time value for a Date, minute-accurate.
function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Practice12() {
  const [when, setWhen] = useState<string>(() => toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000)));
  const [durationMin, setDurationMin] = useState(60);
  const [blocked, setBlocked] = useState(false);

  const room = useMemo(() => getEngineeringLabA(), []);

  // One request: the full local timestamp decides, then the same-day room rule applies.
  const live = useMemo(
    () => resolveLiveRequest({ whenLocal: when, durationMin, blocked, now: new Date() }, room),
    [when, durationMin, blocked, room]
  );
  const result = live.result;

  const shownStart = live.ok ? fmt(live.start) : '--:--';
  const shownEnd = live.ok ? fmt(live.end) : '--:--';

  const panelCases = useMemo(() => PRACTICE12_CASES.map((c) => ({ ...c, ...runCase(c) })), []);
  const fixtureOk = useMemo(() => {
    const before = JSON.stringify(room);
    PRACTICE12_CASES.forEach((c) => runCase(c));
    return JSON.stringify(room) === before;
  }, [room]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 text-slate-800">
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center gap-3">
          <div className="bg-sky-500 rounded-xl p-2.5 shadow-md">
            <FlaskConical className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Practice #13 — Isolated View</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {LAB_ROOM_NAME} only. Real current time for the live check; fixed clock only in the panel below.
            </p>
        </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <a
          href="/?view=checker"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back from Practice #13 to room checker
        </a>

        {/* Inputs */}
        <section className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700">Booking request</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="p12-start" className="block text-xs font-medium text-slate-500 mb-1.5">
                Start date and time (local)
              </label>
              <input
                id="p12-start"
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition"
              />
            </div>
            <div>
              <label htmlFor="p12-duration" className="block text-xs font-medium text-slate-500 mb-1.5">
                Duration (minutes, 1–120)
              </label>
              <input
                id="p12-duration"
                type="number"
                min={1}
                max={120}
                step={1}
                inputMode="numeric"
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition"
              />
            </div>
            <div>
              <span className="block text-xs font-medium text-slate-500 mb-1.5">Room state</span>
              <button
                onClick={() => setBlocked((b) => !b)}
                className={[
                  'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                  blocked
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
                ].join(' ')}
              >
                {blocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                {blocked ? 'Blocked' : 'Open'}
              </button>
            </div>
          </div>
          {!live.ok && (
            <p className="mt-3 text-xs text-red-600 font-medium">{live.result.message}</p>
          )}
        </section>

        {/* Result */}
        {result && (
          <section className={`rounded-2xl border p-5 transition-all duration-300 ${codeStyles[result.code]}`}>
            <div className="flex items-start gap-3">
              {result.available ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold text-lg">{result.available ? 'Available' : 'Unavailable'}</p>
                <p className="text-xs font-mono mt-0.5 opacity-80">
                  available: {String(result.available)} · code: {result.code}
                </p>
                <p className="text-sm mt-1">
                  {shownStart}–{shownEnd}: {result.message}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Eight-case verification panel (fixed clock) */}
        <section className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Verification panel (8 cases, fixed clock 10:00)</h2>
          <p className="text-xs text-slate-400 mb-3">
            Expected vs observed. Live form above uses the real current time; this panel uses a deterministic clock.
          </p>
          <ul className="space-y-2">
            {panelCases.map((c) => (
              <li
                key={c.id}
                className={[
                  'flex items-center justify-between rounded-lg px-4 py-2.5 border text-sm',
                  c.pass ? 'border-emerald-100 bg-emerald-50' : 'border-red-200 bg-red-50',
                ].join(' ')}
              >
                <span className="text-slate-700">
                  {c.label}
                  <span className="block text-xs text-slate-400 font-mono">
                    expected {c.expected.available ? 'available' : 'unavailable'} / {c.expected.code}
                  </span>
                </span>
                <span className="flex items-center gap-2 font-mono text-xs text-right">
                  <span>
                    observed {c.result.available ? 'available' : 'unavailable'} / {c.result.code}
                  </span>
                  <span
                    className={[
                      'px-1.5 py-0.5 rounded font-bold',
                      c.pass ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white',
                    ].join(' ')}
                  >
                    {c.pass ? 'PASS' : 'FAIL'}
                  </span>
                </span>
              </li>
            ))}
            <li
              className={[
                'flex items-center justify-between rounded-lg px-4 py-2.5 border text-sm',
                fixtureOk ? 'border-emerald-100 bg-emerald-50' : 'border-red-200 bg-red-50',
              ].join(' ')}
            >
              <span className="text-slate-700">
                Fixture unchanged after all checks
                <span className="block text-xs text-slate-400 font-mono">expected unchanged / observed {fixtureOk ? 'unchanged' : 'modified'}</span>
              </span>
              <span
                className={[
                  'px-1.5 py-0.5 rounded font-bold text-xs',
                  fixtureOk ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white',
                ].join(' ')}
              >
                {fixtureOk ? 'PASS' : 'FAIL'}
              </span>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}

export default Practice12;
