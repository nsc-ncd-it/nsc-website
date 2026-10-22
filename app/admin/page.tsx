'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import MathText from '../../components/MathText';
import ConfirmDialog from '../../components/ConfirmDialog';

type Exam = {
  id: string;
  title: string;
  duration_minutes: number;
  is_live: boolean;
  results_published: boolean;
};

type KeyRow = { correct_option: string };

type Question = {
  id: string;
  position: number;
  marks: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  image_url: string | null;
  answer_keys: KeyRow | KeyRow[] | null;
};

type ResultRow = {
  id: string;
  student_name: string;
  roll: string;
  section: string;
  membership_id: string;
  department: string;
  score: number | null;
  total: number | null;
  started_at: string;
  submitted_at: string | null;
};

type Tab = 'exams' | 'questions' | 'results';

type ConfirmState = {
  title: string;
  message: string;
  confirmText: string;
  danger: boolean;
  onConfirm: () => Promise<void>;
} | null;

const fieldCls =
  'w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-sky-500';

const primaryBtn =
  'px-6 py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 transition-all rounded-xl text-slate-950 font-black text-sm';

const ghostBtn =
  'px-4 py-2 border border-slate-700 hover:border-sky-500 transition-all rounded-xl text-slate-300 font-bold text-sm';

const dangerBtn =
  'px-4 py-2 border border-red-500/40 hover:bg-red-500/10 transition-all rounded-xl text-red-400 font-bold text-sm';

function getCorrect(q: Question): string {
  if (Array.isArray(q.answer_keys)) {
    return q.answer_keys[0]?.correct_option ?? '?';
  }
  return q.answer_keys?.correct_option ?? '?';
}

export default function AdminPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [tab, setTab] = useState<Tab>('exams');
  const [message, setMessage] = useState('');

  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const ask = (state: NonNullable<ConfirmState>) => setConfirmState(state);

  const runConfirm = async () => {
    if (!confirmState) return;
    setConfirmBusy(true);
    await confirmState.onConfirm();
    setConfirmBusy(false);
    setConfirmState(null);
  };

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);

  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState('25');

  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correct, setCorrect] = useState('A');
  const [marks, setMarks] = useState('1');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // =========================
  // LOGIN STATE
  // =========================

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setAuthChecked(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }

    supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .then(({ data }) => setIsAdmin(!!data && data.length > 0));
  }, [userId]);

  // =========================
  // LOAD DATA
  // =========================

  const loadExams = useCallback(async () => {
    const { data } = await supabase
      .from('exams')
      .select('id,title,duration_minutes,is_live,results_published')
      .order('created_at', { ascending: false });

    const list = (data || []) as Exam[];
    setExams(list);

    setSelectedExamId((current) => current || (list[0]?.id ?? ''));
  }, []);

  const loadQuestions = useCallback(async (examId: string) => {
    if (!examId) {
      setQuestions([]);
      return;
    }

    const { data } = await supabase
      .from('questions')
      .select('*, answer_keys(correct_option)')
      .eq('exam_id', examId)
      .order('position', { ascending: true });

    setQuestions((data || []) as Question[]);
  }, []);

  const loadResults = useCallback(async (examId: string) => {
    if (!examId) {
      setResults([]);
      return;
    }

    const { data } = await supabase
      .from('results')
      .select('*')
      .eq('exam_id', examId)
      .order('score', { ascending: false, nullsFirst: false })
      .order('submitted_at', { ascending: true });

    setResults((data || []) as ResultRow[]);
  }, []);

  useEffect(() => {
    if (isAdmin) loadExams();
  }, [isAdmin, loadExams]);

  useEffect(() => {
    if (isAdmin && selectedExamId) {
      loadQuestions(selectedExamId);
      loadResults(selectedExamId);
    }
  }, [isAdmin, selectedExamId, loadQuestions, loadResults]);

  // =========================
  // ACTIONS
  // =========================

  const login = async () => {
    setLoginError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) setLoginError('Wrong email or password.');
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const flash = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const createExam = async () => {
    const title = newTitle.trim();
    const duration = parseInt(newDuration, 10);

    if (!title || !duration || duration < 1) {
      flash('Enter an exam name and a duration in minutes.');
      return;
    }

    const { data, error } = await supabase
      .from('exams')
      .insert({ title, duration_minutes: duration })
      .select('id')
      .single();

    if (error) {
      flash('Could not create the exam.');
      return;
    }

    setNewTitle('');
    await loadExams();
    if (data) setSelectedExamId(data.id as string);
    flash('Exam created. Now add questions.');
  };

  const makeLive = async (examId: string) => {
    await supabase.from('exams').update({ is_live: false }).eq('is_live', true);
    await supabase.from('exams').update({ is_live: true }).eq('id', examId);
    await loadExams();
    flash('This exam is now LIVE.');
  };

  const stopLive = async (examId: string) => {
    await supabase.from('exams').update({ is_live: false }).eq('id', examId);
    await loadExams();
    flash('Exam stopped.');
  };

  const togglePublish = async (exam: Exam) => {
    await supabase
      .from('exams')
      .update({ results_published: !exam.results_published })
      .eq('id', exam.id);

    await loadExams();
    flash(
      exam.results_published
        ? 'Results hidden from members.'
        : 'Results published. Members can see them now.'
    );
  };

  const deleteExam = (exam: Exam) => {
    ask({
      title: 'Delete this exam?',
      message: `"${exam.title}" will be deleted together with all its questions and results. This cannot be undone.`,
      confirmText: 'Delete exam',
      danger: true,
      onConfirm: () => doDeleteExam(exam),
    });
  };

  const doDeleteExam = async (exam: Exam) => {
    await supabase.from('exams').delete().eq('id', exam.id);
    setSelectedExamId('');
    await loadExams();
    flash('Exam deleted.');
  };

  const resetForm = () => {
    setQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setImageUrl('');
    setCorrect('A');
  };

  const startEdit = (q: Question) => {
    const right = getCorrect(q);

    setEditingId(q.id);
    setQText(q.question_text);
    setOptA(q.option_a);
    setOptB(q.option_b);
    setOptC(q.option_c);
    setOptD(q.option_d);
    setCorrect(['A', 'B', 'C', 'D'].includes(right) ? right : 'A');
    setMarks(String(q.marks || 1));
    setImageUrl(q.image_url ?? '');

    setTimeout(() => {
      document
        .getElementById('question-form')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
    setMarks('1');
  };

  const addQuestion = async () => {
    if (!selectedExamId) {
      flash('Create or select an exam first.');
      return;
    }

    if (!qText.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      flash('Fill the question and all four options.');
      return;
    }

    const marksValue = parseInt(marks, 10);

    if (!marksValue || marksValue < 1) {
      flash('Marks must be 1 or more.');
      return;
    }

    // ----- Editing an existing question -----
    if (editingId) {
      setSaving(true);

      const { error: updateError } = await supabase
        .from('questions')
        .update({
          marks: marksValue,
          question_text: qText.trim(),
          option_a: optA.trim(),
          option_b: optB.trim(),
          option_c: optC.trim(),
          option_d: optD.trim(),
          image_url: imageUrl.trim() || null,
        })
        .eq('id', editingId);

      if (updateError) {
        setSaving(false);
        flash('Could not update the question.');
        return;
      }

      const { error: keyUpdateError } = await supabase
        .from('answer_keys')
        .upsert(
          { question_id: editingId, correct_option: correct },
          { onConflict: 'question_id' }
        );

      if (keyUpdateError) {
        setSaving(false);
        flash('The question was updated, but the correct answer could not be saved. Try again.');
        return;
      }

      setEditingId(null);
      resetForm();
      setMarks('1');
      setSaving(false);

      await loadQuestions(selectedExamId);
      flash('Question updated.');
      return;
    }

    // ----- Adding a new question -----
    setSaving(true);

    const { data, error } = await supabase
      .from('questions')
      .insert({
        exam_id: selectedExamId,
        position: questions.length + 1,
        marks: marksValue,
        question_text: qText.trim(),
        option_a: optA.trim(),
        option_b: optB.trim(),
        option_c: optC.trim(),
        option_d: optD.trim(),
        image_url: imageUrl.trim() || null,
      })
      .select('id')
      .single();

    if (error || !data) {
      setSaving(false);
      flash('Could not save the question.');
      return;
    }

    const { error: keyError } = await supabase
      .from('answer_keys')
      .insert({ question_id: data.id, correct_option: correct });

    if (keyError) {
      await supabase.from('questions').delete().eq('id', data.id);
      setSaving(false);
      flash('Could not save the correct answer. Try again.');
      return;
    }

    setQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setImageUrl('');
    setCorrect('A');
    setSaving(false);

    await loadQuestions(selectedExamId);
    flash('Question added.');
  };

  const deleteQuestion = (q: Question) => {
    ask({
      title: 'Delete this question?',
      message:
        'This question and its correct answer will be removed from the exam.',
      confirmText: 'Delete question',
      danger: true,
      onConfirm: () => doDeleteQuestion(q),
    });
  };

  const doDeleteQuestion = async (q: Question) => {
    if (editingId === q.id) cancelEdit();

    await supabase.from('questions').delete().eq('id', q.id);

    // keep the numbering tidy
    const remaining = questions.filter((x) => x.id !== q.id);
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].position !== i + 1) {
        await supabase
          .from('questions')
          .update({ position: i + 1 })
          .eq('id', remaining[i].id);
      }
    }

    await loadQuestions(selectedExamId);
    flash('Question deleted.');
  };

  const deleteResult = (r: ResultRow) => {
    ask({
      title: 'Delete this attempt?',
      message: `${r.student_name} (${r.membership_id}) will be able to take the exam again.`,
      confirmText: 'Delete attempt',
      danger: true,
      onConfirm: () => doDeleteResult(r),
    });
  };

  const doDeleteResult = async (r: ResultRow) => {
    await supabase.from('results').delete().eq('id', r.id);
    await loadResults(selectedExamId);
    flash('Attempt deleted.');
  };

  const downloadCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    const lines = [
      [
        'Rank',
        'Name',
        'Roll',
        'Section',
        'Membership ID',
        'Department',
        'Score',
        'Total',
        'Submitted at',
      ]
        .map(esc)
        .join(','),
    ];

    results.forEach((r, i) => {
      lines.push(
        [
          r.submitted_at ? i + 1 : '',
          r.student_name,
          r.roll,
          r.section,
          r.membership_id,
          r.department,
          r.score ?? '',
          r.total ?? '',
          r.submitted_at ? new Date(r.submitted_at).toLocaleString() : 'Not submitted',
        ]
          .map(esc)
          .join(',')
      );
    });

    const blob = new Blob(['\uFEFF' + lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // =========================
  // SCREENS
  // =========================

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-[#05070A] text-white flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-[#05070A] text-white flex items-center justify-center px-4">
        <div className="glass border border-sky-500/20 rounded-[2rem] p-10 max-w-md w-full">
          <h1 className="font-display text-4xl font-black mb-6 text-center">
            ADMIN LOGIN
          </h1>

          <div className="space-y-4">
            <input
              className={fieldCls}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className={fieldCls}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') login();
              }}
            />
          </div>

          {loginError && (
            <p className="text-red-400 text-sm mt-4">{loginError}</p>
          )}

          <button className={`${primaryBtn} w-full mt-6`} onClick={login}>
            Log in
          </button>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#05070A] text-white flex items-center justify-center px-4">
        <div className="glass border border-red-500/20 rounded-[2rem] p-10 max-w-md w-full text-center">
          <h1 className="font-display text-3xl font-black mb-4">
            NOT AN ADMIN
          </h1>
          <p className="text-slate-400 mb-6">
            This account is not on the admin list.
          </p>
          <button className={ghostBtn} onClick={logout}>
            Log out
          </button>
        </div>
      </main>
    );
  }

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const submittedCount = results.filter((r) => r.submitted_at).length;

  const scored = results.filter((r) => r.score !== null);
  const average =
    scored.length > 0
      ? (scored.reduce((sum, r) => sum + (r.score || 0), 0) / scored.length).toFixed(1)
      : '-';

  return (
    <main className="min-h-screen bg-[#05070A] text-white">
      <div className="sticky top-0 z-40 bg-slate-950 border-b border-slate-800 px-4 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-black">NSC Exam Admin</h1>

        <div className="flex flex-wrap items-center gap-3">
          <select
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm max-w-[260px]"
            value={selectedExamId}
            onChange={(e) => {
              setSelectedExamId(e.target.value);
              cancelEdit();
            }}
          >
            {exams.length === 0 && <option value="">No exams yet</option>}
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>

          <button className={ghostBtn} onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.title ?? ''}
        message={confirmState?.message ?? ''}
        confirmText={confirmState?.confirmText}
        danger={confirmState?.danger}
        busy={confirmBusy}
        onConfirm={runConfirm}
        onCancel={() => {
          if (!confirmBusy) setConfirmState(null);
        }}
      />

      {message && (
        <div className="fixed top-20 right-4 z-50 bg-sky-500 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg">
          {message}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-8">
          {(['exams', 'questions', 'results'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl font-bold text-sm capitalize ${
                tab === t
                  ? 'bg-sky-500 text-slate-950'
                  : 'border border-slate-700 text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ================= EXAMS ================= */}
        {tab === 'exams' && (
          <div className="space-y-8">
            <div className="glass border border-slate-800 rounded-3xl p-6">
              <h2 className="text-xl font-black mb-4">Create a new exam</h2>

              <div className="grid md:grid-cols-[1fr_160px_auto] gap-3">
                <input
                  className={fieldCls}
                  placeholder="Exam name"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />

                <input
                  className={fieldCls}
                  type="number"
                  min={1}
                  placeholder="Minutes"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                />

                <button className={primaryBtn} onClick={createExam}>
                  Create
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {exams.length === 0 && (
                <p className="text-slate-400">No exams yet. Create the first one above.</p>
              )}

              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="glass border border-slate-800 rounded-3xl p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black">{exam.title}</h3>
                      <p className="text-slate-400 text-sm mt-1">
                        {exam.duration_minutes} minutes
                      </p>

                      <div className="flex gap-2 mt-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            exam.is_live
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {exam.is_live ? 'LIVE' : 'Not live'}
                        </span>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            exam.results_published
                              ? 'bg-sky-500/20 text-sky-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {exam.results_published
                            ? 'Results published'
                            : 'Results hidden'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {exam.is_live ? (
                        <button className={ghostBtn} onClick={() => stopLive(exam.id)}>
                          Stop exam
                        </button>
                      ) : (
                        <button className={primaryBtn} onClick={() => makeLive(exam.id)}>
                          Make live
                        </button>
                      )}

                      <button className={ghostBtn} onClick={() => togglePublish(exam)}>
                        {exam.results_published ? 'Hide results' : 'Publish results'}
                      </button>

                      <button className={dangerBtn} onClick={() => deleteExam(exam)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= QUESTIONS ================= */}
        {tab === 'questions' && (
          <div className="space-y-8">
            {!selectedExam ? (
              <p className="text-slate-400">Create an exam first (Exams tab).</p>
            ) : (
              <>
                <div
                  id="question-form"
                  className={`glass border rounded-3xl p-6 scroll-mt-24 ${
                    editingId ? 'border-sky-500' : 'border-slate-800'
                  }`}
                >
                  <h2 className="text-xl font-black mb-1">
                    {editingId ? 'Edit question' : 'Add a question'}
                  </h2>

                  {editingId && (
                    <div className="mb-4 rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">
                      You are editing an existing question. Change what you need
                      and press <b>Save changes</b>.
                      {results.some((r) => r.submitted_at) && (
                        <span className="block mt-1 text-amber-300">
                          Some members have already submitted this exam. Their
                          scores will not change after this edit.
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-slate-400 text-sm mb-5">
                    Exam: {selectedExam.title}. Write equations between dollar
                    signs, for example $x^2 + 5x + 6 = 0$ or $\frac{'{a}{b}'}$.
                  </p>

                  <textarea
                    className={`${fieldCls} min-h-[110px] mb-4`}
                    placeholder="Question"
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                  />

                  <div className="grid md:grid-cols-2 gap-3 mb-4">
                    <input className={fieldCls} placeholder="Option A" value={optA} onChange={(e) => setOptA(e.target.value)} />
                    <input className={fieldCls} placeholder="Option B" value={optB} onChange={(e) => setOptB(e.target.value)} />
                    <input className={fieldCls} placeholder="Option C" value={optC} onChange={(e) => setOptC(e.target.value)} />
                    <input className={fieldCls} placeholder="Option D" value={optD} onChange={(e) => setOptD(e.target.value)} />
                  </div>

                  <div className="grid md:grid-cols-[200px_160px_1fr] gap-3 mb-5">
                    <select
                      className={fieldCls}
                      value={correct}
                      onChange={(e) => setCorrect(e.target.value)}
                    >
                      <option value="A">Correct answer: A</option>
                      <option value="B">Correct answer: B</option>
                      <option value="C">Correct answer: C</option>
                      <option value="D">Correct answer: D</option>
                    </select>

                    <label className="flex items-center gap-3 text-slate-400 text-sm">
                      Marks
                      <input
                        className={fieldCls}
                        type="number"
                        min={1}
                        value={marks}
                        onChange={(e) => setMarks(e.target.value)}
                      />
                    </label>

                    <input
                      className={fieldCls}
                      placeholder="Image link (optional)"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                  </div>

                  {(qText || optA || optB || optC || optD) && (
                    <div className="border border-dashed border-slate-700 rounded-2xl p-5 mb-5">
                      <p className="text-slate-500 text-xs mb-3">
                        Preview (this is how members will see it)
                      </p>

                      <div className="mb-3">
                        <MathText text={qText} />
                      </div>

                      <div className="space-y-2 text-slate-300">
                        <div>A. <MathText text={optA} /></div>
                        <div>B. <MathText text={optB} /></div>
                        <div>C. <MathText text={optC} /></div>
                        <div>D. <MathText text={optD} /></div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button className={primaryBtn} disabled={saving} onClick={addQuestion}>
                      {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add question'}
                    </button>

                    {editingId && (
                      <button className={ghostBtn} disabled={saving} onClick={cancelEdit}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-black mb-4">
                    Questions in this exam ({questions.length}), total marks:{' '}
                    {questions.reduce((sum, q) => sum + (q.marks || 1), 0)}
                  </h2>

                  <div className="space-y-4">
                    {questions.map((q, i) => {
                      const right = getCorrect(q);

                      return (
                        <div
                          key={q.id}
                          className={`glass border rounded-3xl p-6 ${
                            editingId === q.id ? 'border-sky-500' : 'border-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <p className="text-sky-500 font-bold text-sm">
                              Question {i + 1} ({q.marks} {q.marks === 1 ? 'mark' : 'marks'})
                              {editingId === q.id && ' - editing'}
                            </p>

                            <div className="flex gap-2">
                              <button className={ghostBtn} onClick={() => startEdit(q)}>
                                Edit
                              </button>

                              <button className={dangerBtn} onClick={() => deleteQuestion(q)}>
                                Delete
                              </button>
                            </div>
                          </div>

                          <div className="mb-4">
                            <MathText text={q.question_text} />
                          </div>

                          <div className="space-y-2">
                            {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                              const key = `option_${letter.toLowerCase()}` as
                                | 'option_a'
                                | 'option_b'
                                | 'option_c'
                                | 'option_d';

                              return (
                                <div
                                  key={letter}
                                  className={`rounded-xl px-4 py-2 ${
                                    right === letter
                                      ? 'bg-green-500/15 border border-green-500/40'
                                      : 'border border-slate-800'
                                  }`}
                                >
                                  {letter}. <MathText text={q[key]} />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= RESULTS ================= */}
        {tab === 'results' && (
          <div>
            {!selectedExam ? (
              <p className="text-slate-400">Create an exam first (Exams tab).</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-black">{selectedExam.title}</h2>
                    <p className="text-slate-400 text-sm mt-1">
                      {submittedCount} submitted, {results.length - submittedCount} not
                      submitted. Average score: {average}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button className={ghostBtn} onClick={() => loadResults(selectedExamId)}>
                      Refresh
                    </button>

                    <button className={ghostBtn} onClick={downloadCsv}>
                      Download CSV
                    </button>

                    <button className={primaryBtn} onClick={() => togglePublish(selectedExam)}>
                      {selectedExam.results_published ? 'Hide results' : 'Publish results'}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto glass border border-slate-800 rounded-3xl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-slate-800">
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Roll</th>
                        <th className="px-4 py-3">Section</th>
                        <th className="px-4 py-3">Membership ID</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Score</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>

                    <tbody>
                      {results.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                            Nobody has taken this exam yet.
                          </td>
                        </tr>
                      )}

                      {results.map((r, i) => (
                        <tr key={r.id} className="border-b border-slate-900">
                          <td className="px-4 py-3 text-slate-500">
                            {r.submitted_at ? i + 1 : '-'}
                          </td>
                          <td className="px-4 py-3 font-bold">{r.student_name}</td>
                          <td className="px-4 py-3">{r.roll}</td>
                          <td className="px-4 py-3">{r.section}</td>
                          <td className="px-4 py-3">{r.membership_id}</td>
                          <td className="px-4 py-3">{r.department}</td>
                          <td className="px-4 py-3">
                            {r.submitted_at ? (
                              <span className="font-black text-sky-400">
                                {r.score} / {r.total}
                              </span>
                            ) : (
                              <span className="text-slate-500">Not submitted</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button className={dangerBtn} onClick={() => deleteResult(r)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
