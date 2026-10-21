'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import MathText from '../../components/MathText';

// =========================
// SETTINGS (you can change these)
// =========================

const SECTIONS = ['Castor', 'Sirius', 'Libra', 'Electra'];

const DEPARTMENTS = [
  'Olympiad',
  'IT',
  'Media',
  'Robotics',
  'Photography',
  'Project',
];

// true  = leaving the tab submits the exam instantly
// false = leaving the tab is allowed
const SUBMIT_ON_TAB_LEAVE = true;

// The warning sound plays when this many seconds are left
const WARNING_AT_SECONDS = 10;

// =========================

type Exam = {
  id: string;
  title: string;
  duration_minutes: number;
};

type Question = {
  id: string;
  position: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  image_url: string | null;
};

type ExamSession = {
  resultId: string;
  examId: string;
  startedAtMs: number;
  durationSec: number;
};

type LookupRow = {
  exam_title: string;
  name: string;
  score: number;
  total: number;
};

type Stage =
  | 'loading'
  | 'noexam'
  | 'register'
  | 'exam'
  | 'submitted'
  | 'closed';

const shell =
  'min-h-screen bg-[#05070A] text-white flex items-center justify-center px-4 py-10';

const fieldCls =
  'w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-sky-500';

const primaryBtn =
  'px-10 py-4 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 transition-all rounded-2xl text-slate-950 font-black uppercase tracking-widest text-sm';

const ghostBtn =
  'px-8 py-3 border border-slate-700 hover:border-sky-500 transition-all rounded-2xl text-slate-300 font-bold text-sm';

export default function ExamPage() {
  const [stage, setStage] = useState<Stage>('loading');
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    name: '',
    roll: '',
    section: '',
    membershipId: '',
    department: '',
  });

  const [showLookup, setShowLookup] = useState(false);
  const [lookupForm, setLookupForm] = useState({ membershipId: '', roll: '' });
  const [lookupResults, setLookupResults] = useState<LookupRow[] | null>(null);
  const [lookupError, setLookupError] = useState('');

  const offsetRef = useRef(0);
  const sessionRef = useRef<ExamSession | null>(null);
  const answersRef = useRef<Record<string, string>>({});
  const submittingRef = useRef(false);
  const warnedRef = useRef(false);

  const nowMs = useCallback(() => Date.now() + offsetRef.current, []);

  const leaveFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.()?.catch(() => {});
    }
  };

  // =========================
  // SUBMIT
  // =========================

  const submitExam = useCallback(async () => {
    const s = sessionRef.current;

    if (!s || submittingRef.current) return;

    submittingRef.current = true;

    const { error: rpcError } = await supabase.rpc('submit_exam', {
      p_result_id: s.resultId,
      p_answers: answersRef.current,
    });

    if (rpcError) {
      submittingRef.current = false;
      setError(
        'Submission failed. Check your internet connection. It will retry automatically.'
      );
      return;
    }

    localStorage.setItem(`nsc_done_${s.examId}`, '1');
    localStorage.removeItem(`nsc_session_${s.examId}`);
    localStorage.removeItem(`nsc_answers_${s.examId}`);

    sessionRef.current = null;
    setError('');
    leaveFullscreen();
    setStage('submitted');
  }, []);

  // =========================
  // LOAD QUESTIONS AND ENTER EXAM
  // =========================

  const enterExam = useCallback(
    async (s: ExamSession) => {
      const saved = JSON.parse(
        localStorage.getItem(`nsc_answers_${s.examId}`) || '{}'
      ) as Record<string, string>;

      const { data, error: rpcError } = await supabase.rpc('get_questions', {
        p_result_id: s.resultId,
      });

      if (rpcError) {
        const msg = rpcError.message || '';

        if (msg.includes('ALREADY_SUBMITTED')) {
          localStorage.setItem(`nsc_done_${s.examId}`, '1');
          localStorage.removeItem(`nsc_session_${s.examId}`);
          setStage('submitted');
          return;
        }

        if (msg.includes('TIME_UP')) {
          sessionRef.current = s;
          answersRef.current = saved;
          await submitExam();
          return;
        }

        setError('Could not load the questions. Please refresh the page.');
        setStage('closed');
        return;
      }

      sessionRef.current = s;
      answersRef.current = saved;
      setAnswers(saved);
      setQuestions(data as Question[]);
      setStage('exam');
    },
    [submitExam]
  );

  // =========================
  // FIRST LOAD
  // =========================

  useEffect(() => {
    const load = async () => {
      const { data: serverTime } = await supabase.rpc('server_time');

      if (serverTime) {
        offsetRef.current = new Date(serverTime as string).getTime() - Date.now();
      }

      const { data } = await supabase
        .from('exams')
        .select('id,title,duration_minutes')
        .eq('is_live', true)
        .limit(1);

      if (!data || data.length === 0) {
        setStage('noexam');
        return;
      }

      const ex = data[0] as Exam;
      setExam(ex);

      if (localStorage.getItem(`nsc_done_${ex.id}`)) {
        setStage('submitted');
        return;
      }

      const savedSession = localStorage.getItem(`nsc_session_${ex.id}`);

      if (savedSession) {
        await enterExam(JSON.parse(savedSession) as ExamSession);
        return;
      }

      setStage('register');
    };

    load();
  }, [enterExam]);

  // =========================
  // TIMER
  // =========================

  useEffect(() => {
    if (stage !== 'exam') return;

    const tick = () => {
      const s = sessionRef.current;
      if (!s) return;

      const left =
        s.durationSec - Math.floor((nowMs() - s.startedAtMs) / 1000);

      setTimeLeft(Math.max(left, 0));

      if (left <= WARNING_AT_SECONDS && left > 0 && !warnedRef.current) {
        warnedRef.current = true;
        try {
          new Audio('/sounds/warning.mp3').play().catch(() => {});
        } catch {
          // sound is optional
        }
      }

      if (left <= 0) {
        submitExam();
      }
    };

    tick();
    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
  }, [stage, nowMs, submitExam]);

  // =========================
  // ANTI CHEAT
  // =========================

  useEffect(() => {
    if (stage !== 'exam') return;

    const handleVisibility = () => {
      if (document.hidden && SUBMIT_ON_TAB_LEAVE) {
        submitExam();
      }
    };

    const block = (e: Event) => e.preventDefault();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
      }

      if (
        e.ctrlKey &&
        ['c', 'v', 'x', 'u', 's', 'p'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('contextmenu', block);
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('paste', block);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('paste', block);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [stage, submitExam]);

  // =========================
  // ACTIONS
  // =========================

  const startExam = async () => {
    setError('');

    if (!exam) return;

    const name = form.name.trim();
    const roll = form.roll.trim();
    const membershipId = form.membershipId.trim();

    if (!name || !roll || !membershipId || !form.section || !form.department) {
      setError('Please fill in every field.');
      return;
    }

    setBusy(true);

    document.documentElement.requestFullscreen?.()?.catch(() => {});

    const { data, error: rpcError } = await supabase.rpc('start_exam', {
      p_exam_id: exam.id,
      p_name: name,
      p_roll: roll,
      p_section: form.section,
      p_membership_id: membershipId,
      p_department: form.department,
    });

    setBusy(false);

    if (rpcError) {
      leaveFullscreen();
      const msg = rpcError.message || '';

      if (msg.includes('ALREADY_ATTEMPTED')) {
        setStage('closed');
        return;
      }

      if (msg.includes('EXAM_NOT_LIVE')) {
        setStage('noexam');
        return;
      }

      setError('Could not start the exam. Please try again.');
      return;
    }

    const row = (Array.isArray(data) ? data[0] : data) as {
      out_result_id: string;
      out_started_at: string;
      out_duration: number;
    };

    const s: ExamSession = {
      resultId: row.out_result_id,
      examId: exam.id,
      startedAtMs: new Date(row.out_started_at).getTime(),
      durationSec: row.out_duration * 60,
    };

    localStorage.setItem(`nsc_session_${exam.id}`, JSON.stringify(s));

    await enterExam(s);
  };

  const chooseAnswer = (questionId: string, option: string) => {
    const next = { ...answersRef.current, [questionId]: option };
    answersRef.current = next;
    setAnswers(next);

    const s = sessionRef.current;
    if (s) {
      localStorage.setItem(`nsc_answers_${s.examId}`, JSON.stringify(next));
    }
  };

  const confirmSubmit = () => {
    const unanswered = questions.length - Object.keys(answers).length;

    const message =
      unanswered > 0
        ? `You have ${unanswered} unanswered question(s). Submit anyway?`
        : 'Submit your answers now? You cannot change them after this.';

    if (window.confirm(message)) {
      submitExam();
    }
  };

  const checkResult = async () => {
    setLookupError('');
    setLookupResults(null);

    if (!lookupForm.membershipId.trim() || !lookupForm.roll.trim()) {
      setLookupError('Enter both your Membership ID and roll.');
      return;
    }

    setBusy(true);

    const { data, error: rpcError } = await supabase.rpc('check_results', {
      p_membership_id: lookupForm.membershipId,
      p_roll: lookupForm.roll,
    });

    setBusy(false);

    if (rpcError) {
      setLookupError('Something went wrong. Please try again.');
      return;
    }

    setLookupResults((data || []) as LookupRow[]);
  };

  // =========================
  // RESULT LOOKUP SCREEN
  // =========================

  if (showLookup && stage !== 'exam') {
    return (
      <main className={shell}>
        <div className="glass border border-sky-500/20 rounded-[2rem] p-8 md:p-12 max-w-xl w-full">
          <h1 className="font-display text-4xl font-black mb-2 text-center">
            CHECK RESULT
          </h1>

          <p className="text-slate-400 text-center mb-8">
            Results appear here after the club publishes them.
          </p>

          <div className="space-y-4">
            <input
              className={fieldCls}
              placeholder="Membership ID"
              value={lookupForm.membershipId}
              onChange={(e) =>
                setLookupForm({ ...lookupForm, membershipId: e.target.value })
              }
            />

            <input
              className={fieldCls}
              placeholder="Roll"
              value={lookupForm.roll}
              onChange={(e) =>
                setLookupForm({ ...lookupForm, roll: e.target.value })
              }
            />
          </div>

          {lookupError && (
            <p className="text-red-400 mt-4 text-sm">{lookupError}</p>
          )}

          <div className="flex gap-3 justify-center mt-8">
            <button className={ghostBtn} onClick={() => setShowLookup(false)}>
              Back
            </button>

            <button className={primaryBtn} disabled={busy} onClick={checkResult}>
              {busy ? 'Checking...' : 'Check'}
            </button>
          </div>

          {lookupResults && lookupResults.length === 0 && (
            <p className="text-slate-400 text-center mt-8">
              No published result found. Either the results are not published
              yet, or the Membership ID and roll do not match.
            </p>
          )}

          {lookupResults && lookupResults.length > 0 && (
            <div className="mt-8 space-y-4">
              {lookupResults.map((r, i) => (
                <div
                  key={i}
                  className="border border-slate-800 rounded-2xl p-5 text-center"
                >
                  <p className="text-slate-400 text-sm">{r.exam_title}</p>
                  <p className="text-lg font-bold mt-1">{r.name}</p>
                  <p className="text-4xl font-black text-sky-400 mt-2">
                    {r.score} / {r.total}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  // =========================
  // LOADING
  // =========================

  if (stage === 'loading') {
    return (
      <main className={shell}>
        <p className="text-slate-400 text-lg">Loading...</p>
      </main>
    );
  }

  // =========================
  // NO LIVE EXAM
  // =========================

  if (stage === 'noexam') {
    return (
      <main className={shell}>
        <div className="glass border border-slate-800 rounded-[2rem] p-12 text-center max-w-xl">
          <h1 className="font-display text-5xl font-black mb-6">
            NO LIVE
            <span className="text-gradient"> EXAM</span>
          </h1>

          <p className="text-slate-400 text-lg mb-8">
            There is currently no live exam available.
          </p>

          <button className={ghostBtn} onClick={() => setShowLookup(true)}>
            Check my result
          </button>
        </div>
      </main>
    );
  }

  // =========================
  // CLOSED (already attempted or error)
  // =========================

  if (stage === 'closed') {
    return (
      <main className={shell}>
        <div className="glass border border-red-500/20 rounded-[2rem] p-12 text-center max-w-2xl">
          <h1 className="font-display text-6xl font-black mb-6">
            EXAM
            <span className="text-red-500"> CLOSED</span>
          </h1>

          <p className="text-slate-300 text-xl mb-4">
            {error || 'You have already attended this examination.'}
          </p>

          <p className="text-slate-500 mb-8">
            Multiple attempts are not allowed.
          </p>

          <button className={ghostBtn} onClick={() => setShowLookup(true)}>
            Check my result
          </button>
        </div>
      </main>
    );
  }

  // =========================
  // SUBMITTED
  // =========================

  if (stage === 'submitted') {
    return (
      <main className={shell}>
        <div className="glass border border-sky-500/20 rounded-[2rem] p-12 text-center max-w-2xl">
          <h1 className="font-display text-5xl md:text-6xl font-black mb-6">
            ANSWERS
            <span className="text-gradient"> SUBMITTED</span>
          </h1>

          <p className="text-slate-300 text-xl mb-4">
            Your answers have been received.
          </p>

          <p className="text-slate-500 mb-8">
            Your result will be visible after the club publishes the results.
          </p>

          <button className={ghostBtn} onClick={() => setShowLookup(true)}>
            Check my result
          </button>
        </div>
      </main>
    );
  }

  // =========================
  // REGISTRATION + RULES
  // =========================

  if (stage === 'register' && exam) {
    return (
      <main className={shell}>
        <div className="glass border border-sky-500/20 rounded-[2rem] p-8 md:p-12 max-w-3xl w-full">
          <p className="text-sky-500 uppercase tracking-[0.3em] text-sm font-bold mb-4 text-center">
            Live Examination
          </p>

          <h1 className="font-display text-4xl md:text-5xl font-black mb-8 text-center">
            {exam.title}
          </h1>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <input
              className={fieldCls}
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              className={fieldCls}
              placeholder="Roll"
              value={form.roll}
              onChange={(e) => setForm({ ...form, roll: e.target.value })}
            />

            <select
              className={fieldCls}
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
            >
              <option value="">Select section</option>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <input
              className={fieldCls}
              placeholder="Membership ID"
              value={form.membershipId}
              onChange={(e) =>
                setForm({ ...form, membershipId: e.target.value })
              }
            />

            <select
              className={`${fieldCls} md:col-span-2`}
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            >
              <option value="">Select your department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 text-slate-300 mb-8 text-center">
            <p>Duration: {exam.duration_minutes} minutes</p>
            <p>
              The timer starts when you press Start and cannot be paused.
              Refreshing the page will not reset it.
            </p>
            {SUBMIT_ON_TAB_LEAVE && (
              <p>Leaving the tab will instantly submit your exam.</p>
            )}
            <p>Multiple attempts are not allowed.</p>
          </div>

          {error && <p className="text-red-400 mb-4 text-center">{error}</p>}

          <div className="flex flex-wrap gap-3 justify-center">
            <button className={ghostBtn} onClick={() => setShowLookup(true)}>
              Check my result
            </button>

            <button className={primaryBtn} disabled={busy} onClick={startExam}>
              {busy ? 'Starting...' : 'Start Exam'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // =========================
  // LIVE EXAM
  // =========================

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const answeredCount = Object.keys(answers).length;

  return (
    <main className="min-h-screen bg-[#05070A] text-white select-none">
      <div className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800 px-4 md:px-6 py-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg md:text-2xl font-black truncate">
            {exam?.title}
          </h1>
          <p className="text-slate-400 text-sm">
            Answered {answeredCount} / {questions.length}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={confirmSubmit}
            className="hidden sm:block px-5 py-2 bg-sky-500 hover:bg-sky-400 rounded-xl text-slate-950 font-black text-sm"
          >
            Submit
          </button>

          <div
            className={`px-5 py-2 rounded-xl font-bold text-lg border transition-all ${
              timeLeft <= WARNING_AT_SECONDS
                ? 'bg-red-500 text-white border-red-500 animate-pulse'
                : 'bg-red-500/20 border-red-500 text-red-400'
            }`}
          >
            {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border-b border-red-500/30 text-red-300 text-center py-2 text-sm">
          {error}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {questions.map((q, index) => (
          <div
            key={q.id}
            className="glass border border-slate-800 rounded-3xl p-6 md:p-8"
          >
            <p className="text-sky-500 font-bold text-sm mb-3">
              Question {index + 1}
            </p>

            <div className="text-lg md:text-xl leading-relaxed mb-5">
              <MathText text={q.question_text} />
            </div>

            {q.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={q.image_url}
                alt={`Question ${index + 1}`}
                className="max-w-full rounded-xl mb-5"
              />
            )}

            <div className="space-y-3">
              {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                const key = `option_${letter.toLowerCase()}` as
                  | 'option_a'
                  | 'option_b'
                  | 'option_c'
                  | 'option_d';

                const selected = answers[q.id] === letter;

                return (
                  <button
                    key={letter}
                    onClick={() => chooseAnswer(q.id, letter)}
                    className={`w-full text-left flex items-start gap-4 rounded-2xl border px-5 py-4 transition-all ${
                      selected
                        ? 'border-sky-500 bg-sky-500/15'
                        : 'border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <span
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                        selected
                          ? 'bg-sky-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {letter}
                    </span>

                    <span className="pt-0.5">
                      <MathText text={q[key]} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="text-center pt-4 pb-16">
          <button className={primaryBtn} onClick={confirmSubmit}>
            Submit Answers
          </button>
        </div>
      </div>
    </main>
  );
}
