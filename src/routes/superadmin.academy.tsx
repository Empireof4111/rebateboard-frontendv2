import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  PageHeader, Panel, StatCard,
} from "@/components/superadmin/AdminUI";
import { Modal, Field, fieldCls, ConfirmDialog, toast } from "@/components/superadmin/AdminActions";
import {
  useFaculties, saveCurriculum, resetCurriculum, courseTotals,
  type Faculty, type Program, type Course, type Module, type Lesson, type QuizQuestion,
  type Level, type AccessTier,
} from "@/lib/academy-data";
import {
  Plus, Edit3, Trash2, ChevronRight, BookOpen, GraduationCap, Layers,
  Sparkles, RotateCcw, Search, Eye, FileQuestion, PlayCircle,
  ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/superadmin/academy")({
  component: AcademyAdmin,
});

const rid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 7)}`;

function AcademyAdmin() {
  const faculties = useFaculties();
  const [q, setQ] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  // Editor state
  const [editFaculty, setEditFaculty] = useState<Faculty | null>(null);
  const [editProgram, setEditProgram] = useState<{ facId: string; program: Program } | null>(null);
  const [editCourse, setEditCourse] = useState<{ facId: string; pgId: string; course: Course } | null>(null);
  const [delTarget, setDelTarget] = useState<{ kind: "faculty" | "program" | "course"; ids: string[]; label: string } | null>(null);

  const stats = useMemo(() => {
    const courses = faculties.flatMap((f) => f.programs.flatMap((p) => p.courses));
    const lessons = courses.reduce((s, c) => s + courseTotals(c).lessons, 0);
    const free = courses.filter((c) => c.access === "free").length;
    const paid = courses.length - free;
    return { faculties: faculties.length, programs: faculties.flatMap((f) => f.programs).length, courses: courses.length, lessons, free, paid };
  }, [faculties]);

  /* mutations */
  const writeFaculties = (next: Faculty[]) => saveCurriculum(next);

  const upsertFaculty = (fac: Faculty) => {
    const exists = faculties.some((f) => f.id === fac.id);
    writeFaculties(exists ? faculties.map((f) => f.id === fac.id ? fac : f) : [...faculties, fac]);
    toast.success(`Faculty "${fac.title}" saved`);
  };

  const upsertProgram = (facId: string, prog: Program) => {
    writeFaculties(faculties.map((f) => {
      if (f.id !== facId) return f;
      const exists = f.programs.some((p) => p.id === prog.id);
      return { ...f, programs: exists ? f.programs.map((p) => p.id === prog.id ? prog : p) : [...f.programs, prog] };
    }));
    toast.success(`Program "${prog.title}" saved`);
  };

  const upsertCourse = (facId: string, pgId: string, course: Course) => {
    writeFaculties(faculties.map((f) => {
      if (f.id !== facId) return f;
      return {
        ...f,
        programs: f.programs.map((p) => {
          if (p.id !== pgId) return p;
          const exists = p.courses.some((c) => c.id === course.id);
          return { ...p, courses: exists ? p.courses.map((c) => c.id === course.id ? course : c) : [...p.courses, course] };
        }),
      };
    }));
    toast.success(`Course "${course.title}" saved`);
  };

  const removeTarget = () => {
    if (!delTarget) return;
    if (delTarget.kind === "faculty") {
      writeFaculties(faculties.filter((f) => f.id !== delTarget.ids[0]));
    } else if (delTarget.kind === "program") {
      const [facId, pgId] = delTarget.ids;
      writeFaculties(faculties.map((f) => f.id !== facId ? f : { ...f, programs: f.programs.filter((p) => p.id !== pgId) }));
    } else {
      const [facId, pgId, courseId] = delTarget.ids;
      writeFaculties(faculties.map((f) => f.id !== facId ? f : {
        ...f,
        programs: f.programs.map((p) => p.id !== pgId ? p : { ...p, courses: p.courses.filter((c) => c.id !== courseId) }),
      }));
    }
    toast.success(`Deleted ${delTarget.label}`);
    setDelTarget(null);
  };

  const filteredFaculties = useMemo(() => {
    if (!q.trim()) return faculties;
    const term = q.toLowerCase();
    return faculties
      .map((f) => ({
        ...f,
        programs: f.programs
          .map((p) => ({
            ...p,
            courses: p.courses.filter((c) =>
              c.title.toLowerCase().includes(term) ||
              p.title.toLowerCase().includes(term) ||
              f.title.toLowerCase().includes(term)
            ),
          }))
          .filter((p) => p.courses.length > 0),
      }))
      .filter((f) => f.programs.length > 0);
  }, [faculties, q]);

  return (
    <div>
      <PageHeader
        title="Academy Curriculum"
        subtitle="Manage faculties, programs, courses, modules, lessons & quizzes — exactly as users see them."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setResetOpen(true)}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white ring-1 ring-white/10 hover:bg-white/15"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
            </button>
            <button
              onClick={() => setEditFaculty({
                id: rid("fac"), slug: rid("fac"), title: "", emoji: "🎓", tagline: "",
                color: "from-fuchsia-500 to-violet-600", programs: [],
              })}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" /> New faculty
            </button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-6">
        <StatCard label="Faculties" value={String(stats.faculties)} delta="" tone="flat" />
        <StatCard label="Programs" value={String(stats.programs)} delta="" tone="flat" />
        <StatCard label="Courses" value={String(stats.courses)} delta={`${stats.free} free · ${stats.paid} paid`} tone="up" />
        <StatCard label="Lessons" value={String(stats.lessons)} delta="" tone="flat" />
        <StatCard label="Free" value={String(stats.free)} delta="users earn RR" tone="up" />
        <StatCard label="Paid" value={String(stats.paid)} delta="cash or RR unlock" tone="flat" />
      </div>

      <Panel title="Curriculum tree">
        <div className="mb-4 glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search faculty, program or course…"
            className="w-full bg-transparent text-white outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-3">
          {filteredFaculties.map((f) => (
            <FacultyRow
              key={f.id}
              faculty={f}
              onEditFaculty={() => setEditFaculty(f)}
              onDeleteFaculty={() => setDelTarget({ kind: "faculty", ids: [f.id], label: f.title })}
              onAddProgram={() =>
                setEditProgram({ facId: f.id, program: { id: rid("pg"), title: "", level: "Beginner", summary: "", courses: [] } })
              }
              onEditProgram={(p) => setEditProgram({ facId: f.id, program: p })}
              onDeleteProgram={(p) => setDelTarget({ kind: "program", ids: [f.id, p.id], label: p.title })}
              onAddCourse={(p) =>
                setEditCourse({ facId: f.id, pgId: p.id, course: blankCourse() })
              }
              onEditCourse={(p, c) => setEditCourse({ facId: f.id, pgId: p.id, course: c })}
              onDeleteCourse={(p, c) => setDelTarget({ kind: "course", ids: [f.id, p.id, c.id], label: c.title })}
            />
          ))}
          {filteredFaculties.length === 0 && (
            <div className="grid place-items-center rounded-2xl bg-white/5 py-12 text-sm text-muted-foreground">
              No faculties match. Try clearing the search or create a new faculty.
            </div>
          )}
        </div>
      </Panel>

      {editFaculty && (
        <FacultyModal
          faculty={editFaculty}
          onClose={() => setEditFaculty(null)}
          onSave={(f) => { upsertFaculty(f); setEditFaculty(null); }}
        />
      )}
      {editProgram && (
        <ProgramModal
          program={editProgram.program}
          onClose={() => setEditProgram(null)}
          onSave={(p) => { upsertProgram(editProgram.facId, p); setEditProgram(null); }}
        />
      )}
      {editCourse && (
        <CourseModal
          course={editCourse.course}
          onClose={() => setEditCourse(null)}
          onSave={(c) => { upsertCourse(editCourse.facId, editCourse.pgId, c); setEditCourse(null); }}
        />
      )}

      <ConfirmDialog
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={removeTarget}
        title={`Delete ${delTarget?.kind} "${delTarget?.label}"?`}
        message="This removes it from every user's Academy view immediately."
        confirmText="Delete"
      />
      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => { resetCurriculum(); toast.success("Curriculum reset to defaults"); setResetOpen(false); }}
        title="Reset entire curriculum?"
        message="All custom faculties, programs, courses, modules and lessons will be replaced with the original seed."
        confirmText="Reset all"
      />
    </div>
  );
}

/* ─────────── faculty row (collapsible) ─────────── */

function FacultyRow({
  faculty, onEditFaculty, onDeleteFaculty, onAddProgram, onEditProgram, onDeleteProgram, onAddCourse, onEditCourse, onDeleteCourse,
}: {
  faculty: Faculty;
  onEditFaculty: () => void;
  onDeleteFaculty: () => void;
  onAddProgram: () => void;
  onEditProgram: (p: Program) => void;
  onDeleteProgram: (p: Program) => void;
  onAddCourse: (p: Program) => void;
  onEditCourse: (p: Program, c: Course) => void;
  onDeleteCourse: (p: Program, c: Course) => void;
}) {
  const [open, setOpen] = useState(true);
  const totalCourses = faculty.programs.reduce((s, p) => s + p.courses.length, 0);

  return (
    <div className="overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10">
      <div className={`flex items-center justify-between gap-3 bg-gradient-to-r ${faculty.color} bg-opacity-10 p-4`}>
        <button onClick={() => setOpen((s) => !s)} className="flex flex-1 items-center gap-3 text-left">
          {open ? <ChevronDown className="h-4 w-4 text-white/70" /> : <ChevronRight className="h-4 w-4 text-white/70" />}
          <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${faculty.color} text-xl shadow-lg`}>
            {faculty.emoji}
          </div>
          <div>
            <div className="text-sm font-bold text-white">{faculty.title}</div>
            <div className="text-[11px] text-white/60">{faculty.tagline || <em className="text-white/40">No tagline</em>}</div>
            <div className="mt-1 text-[10px] text-white/40">{faculty.programs.length} programs · {totalCourses} courses · /{faculty.slug}</div>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <IconBtn icon={Plus} label="Add program" onClick={onAddProgram} tone="primary" />
          <IconBtn icon={Edit3} label="Edit faculty" onClick={onEditFaculty} />
          <IconBtn icon={Trash2} label="Delete faculty" onClick={onDeleteFaculty} tone="danger" />
        </div>
      </div>

      {open && (
        <div className="space-y-2 p-3">
          {faculty.programs.length === 0 && (
            <div className="rounded-xl bg-white/[0.02] py-6 text-center text-xs text-muted-foreground">
              No programs yet. Click <span className="font-bold text-white">Add program</span> to start.
            </div>
          )}
          {faculty.programs.map((p) => (
            <ProgramRow
              key={p.id}
              program={p}
              onEdit={() => onEditProgram(p)}
              onDelete={() => onDeleteProgram(p)}
              onAddCourse={() => onAddCourse(p)}
              onEditCourse={(c) => onEditCourse(p, c)}
              onDeleteCourse={(c) => onDeleteCourse(p, c)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProgramRow({
  program, onEdit, onDelete, onAddCourse, onEditCourse, onDeleteCourse,
}: {
  program: Program;
  onEdit: () => void; onDelete: () => void;
  onAddCourse: () => void;
  onEditCourse: (c: Course) => void;
  onDeleteCourse: (c: Course) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="overflow-hidden rounded-xl bg-white/[0.04] ring-1 ring-white/10">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <button onClick={() => setOpen((s) => !s)} className="flex flex-1 items-center gap-2 text-left">
          {open ? <ChevronDown className="h-3.5 w-3.5 text-white/60" /> : <ChevronRight className="h-3.5 w-3.5 text-white/60" />}
          <Layers className="h-3.5 w-3.5 text-fuchsia-300" />
          <div className="text-xs font-bold text-white">{program.title || <em className="text-white/40">Untitled program</em>}</div>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-white/60">{program.level}</span>
          <span className="text-[10px] text-white/40">· {program.courses.length} courses</span>
        </button>
        <div className="flex items-center gap-1">
          <IconBtn icon={Plus} label="Add course" onClick={onAddCourse} tone="primary" />
          <IconBtn icon={Edit3} label="Edit program" onClick={onEdit} />
          <IconBtn icon={Trash2} label="Delete program" onClick={onDelete} tone="danger" />
        </div>
      </div>

      {open && (
        <div className="space-y-1.5 px-3 pb-3">
          {program.courses.length === 0 && (
            <div className="rounded-lg bg-black/20 py-4 text-center text-[11px] text-muted-foreground">
              No courses in this program yet.
            </div>
          )}
          {program.courses.map((c) => {
            const totals = courseTotals(c);
            return (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-black/30 px-3 py-2 ring-1 ring-white/5">
                <div className="flex flex-1 items-center gap-2 text-left">
                  <span className="text-lg">{c.cover}</span>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-white">{c.title || <em className="text-white/40">Untitled course</em>}</div>
                    <div className="flex flex-wrap gap-1.5 text-[10px] text-white/50">
                      <span className="rounded-full bg-white/10 px-1.5 py-0.5">{c.level}</span>
                      <span className={`rounded-full px-1.5 py-0.5 ${c.access === "paid" ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                        {c.access === "paid" ? "PAID" : "FREE"}
                      </span>
                      <span className="inline-flex items-center gap-0.5"><Layers className="h-2.5 w-2.5" />{totals.modules}m</span>
                      <span className="inline-flex items-center gap-0.5"><BookOpen className="h-2.5 w-2.5" />{totals.lessons}l</span>
                      <span className="inline-flex items-center gap-0.5"><FileQuestion className="h-2.5 w-2.5" />{c.finalExam.length}q exam</span>
                      <span className="text-emerald-300">+{c.rrReward}RR</span>
                      {c.access === "paid" && <span className="text-amber-300">${c.priceUsd} / {c.priceRr}RR</span>}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <IconBtn icon={Edit3} label="Edit course" onClick={() => onEditCourse(c)} />
                  <IconBtn icon={Trash2} label="Delete course" onClick={() => onDeleteCourse(c)} tone="danger" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IconBtn({ icon: Icon, label, onClick, tone = "neutral" }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; tone?: "neutral" | "danger" | "primary" }) {
  const cls =
    tone === "danger" ? "bg-rose-500/15 text-rose-300 ring-rose-400/30 hover:bg-rose-500/25"
    : tone === "primary" ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white ring-fuchsia-400/40 hover:opacity-90"
    : "bg-white/10 text-white ring-white/10 hover:bg-white/15";
  return (
    <button onClick={onClick} title={label} className={`grid h-7 w-7 place-items-center rounded-md ring-1 ${cls}`}>
      <Icon className="h-3 w-3" />
    </button>
  );
}

/* ─────────── faculty modal ─────────── */

const COLOR_PRESETS = [
  { label: "Fuchsia → Violet", value: "from-fuchsia-500 to-violet-600" },
  { label: "Emerald → Cyan", value: "from-emerald-500 to-cyan-600" },
  { label: "Amber → Orange", value: "from-amber-500 to-orange-600" },
  { label: "Rose → Pink", value: "from-rose-500 to-pink-600" },
  { label: "Sky → Indigo", value: "from-sky-500 to-indigo-600" },
  { label: "Lime → Green", value: "from-lime-500 to-green-600" },
];

function FacultyModal({ faculty, onClose, onSave }: { faculty: Faculty; onClose: () => void; onSave: (f: Faculty) => void }) {
  const [form, setForm] = useState<Faculty>(faculty);
  return (
    <Modal
      open
      onClose={onClose}
      title={faculty.title ? `Edit faculty · ${faculty.title}` : "New faculty"}
      subtitle="Faculties are the top-level categories users see (e.g. Forex, Crypto)."
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
          <button
            onClick={() => {
              if (!form.title.trim()) return toast.error("Title required");
              if (!form.slug.trim()) return toast.error("Slug required");
              onSave(form);
            }}
            className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white"
          >Save faculty</button>
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Emoji">
          <input className={fieldCls + " text-center text-2xl"} value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} maxLength={2} />
        </Field>
        <Field label="Title" span={2}>
          <input className={fieldCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Faculty of Forex" />
        </Field>
        <div className="md:col-span-3"><Field label="Slug (URL)">
          <input className={fieldCls} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder="forex" />
        </Field></div>
        <div className="md:col-span-3"><Field label="Tagline">
          <input className={fieldCls} value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="From your first pip to professional execution models." />
        </Field></div>
        <div className="md:col-span-3"><Field label="Color theme">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setForm({ ...form, color: c.value })}
                className={`flex items-center gap-2 rounded-lg p-2 text-left text-[11px] ring-1 transition ${form.color === c.value ? "ring-fuchsia-400/60" : "ring-white/10 hover:ring-white/20"}`}
              >
                <div className={`h-6 w-6 rounded-md bg-gradient-to-br ${c.value}`} />
                <span className="text-white/80">{c.label}</span>
              </button>
            ))}
          </div>
        </Field></div>
      </div>
    </Modal>
  );
}

/* ─────────── program modal ─────────── */

function ProgramModal({ program, onClose, onSave }: { program: Program; onClose: () => void; onSave: (p: Program) => void }) {
  const [form, setForm] = useState<Program>(program);
  return (
    <Modal
      open
      onClose={onClose}
      title={program.title ? `Edit program · ${program.title}` : "New program"}
      subtitle="Programs group related courses inside a faculty (e.g. Beginner Track, Pro Track)."
      size="md"
      footer={
        <>
          <button onClick={onClose} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
          <button
            onClick={() => {
              if (!form.title.trim()) return toast.error("Title required");
              onSave(form);
            }}
            className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white"
          >Save program</button>
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Title" span={2}>
          <input className={fieldCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Forex Beginner Track" />
        </Field>
        <Field label="Level">
          <select className={fieldCls} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as Level })}>
            <option>Beginner</option><option>Intermediate</option><option>Pro</option>
          </select>
        </Field>
        <div className="md:col-span-3"><Field label="Summary">
          <textarea rows={3} className={fieldCls} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="What this program teaches and who it's for." />
        </Field></div>
      </div>
    </Modal>
  );
}

/* ─────────── course modal (rich, with modules + lessons + quizzes + exam) ─────────── */

function blankCourse(): Course {
  return {
    id: rid("course"),
    title: "", tagline: "", cover: "📘",
    level: "Beginner", access: "free",
    priceUsd: 0, priceRr: 0, rrReward: 50,
    estHours: 1, rating: 4.7, enrolled: 0,
    authors: ["RebateBoard Academy"],
    outcomes: [],
    modules: [],
    finalExam: [],
  };
}

type CourseTab = "details" | "modules" | "exam" | "preview";

function CourseModal({ course, onClose, onSave }: { course: Course; onClose: () => void; onSave: (c: Course) => void }) {
  const [form, setForm] = useState<Course>({
    ...course,
    outcomes: course.outcomes ?? [],
    modules: course.modules ?? [],
    finalExam: course.finalExam ?? [],
    authors: course.authors ?? ["RebateBoard Academy"],
  });
  const [tab, setTab] = useState<CourseTab>("details");

  const totals = courseTotals(form);

  /* module helpers */
  const addModule = () => setForm({
    ...form,
    modules: [...form.modules, { id: rid("mod"), title: `Module ${form.modules.length + 1}`, summary: "", lessons: [], quiz: [] }],
  });
  const patchModule = (mid: string, patch: Partial<Module>) =>
    setForm({ ...form, modules: form.modules.map((m) => m.id === mid ? { ...m, ...patch } : m) });
  const removeModule = (mid: string) =>
    setForm({ ...form, modules: form.modules.filter((m) => m.id !== mid) });

  const addLesson = (mid: string) =>
    patchModule(mid, {
      lessons: [
        ...(form.modules.find((m) => m.id === mid)?.lessons ?? []),
        { id: rid("les"), title: "", durationMin: 8, summary: "", body: "" },
      ],
    });
  const patchLesson = (mid: string, lid: string, patch: Partial<Lesson>) => {
    const m = form.modules.find((x) => x.id === mid);
    if (!m) return;
    patchModule(mid, { lessons: m.lessons.map((l) => l.id === lid ? { ...l, ...patch } : l) });
  };
  const removeLesson = (mid: string, lid: string) => {
    const m = form.modules.find((x) => x.id === mid);
    if (!m) return;
    patchModule(mid, { lessons: m.lessons.filter((l) => l.id !== lid) });
  };

  const addQuizQ = (mid: string) => {
    const m = form.modules.find((x) => x.id === mid);
    if (!m) return;
    patchModule(mid, {
      quiz: [...m.quiz, { id: rid("q"), q: "", options: ["", "", "", ""], correctIndex: 0, explain: "" }],
    });
  };
  const patchQuizQ = (mid: string, qid: string, patch: Partial<QuizQuestion>) => {
    const m = form.modules.find((x) => x.id === mid);
    if (!m) return;
    patchModule(mid, { quiz: m.quiz.map((q) => q.id === qid ? { ...q, ...patch } : q) });
  };
  const removeQuizQ = (mid: string, qid: string) => {
    const m = form.modules.find((x) => x.id === mid);
    if (!m) return;
    patchModule(mid, { quiz: m.quiz.filter((q) => q.id !== qid) });
  };

  /* final exam helpers */
  const addExamQ = () => setForm({
    ...form,
    finalExam: [...form.finalExam, { id: rid("fx"), q: "", options: ["", "", "", ""], correctIndex: 0, explain: "" }],
  });
  const patchExamQ = (qid: string, patch: Partial<QuizQuestion>) =>
    setForm({ ...form, finalExam: form.finalExam.map((q) => q.id === qid ? { ...q, ...patch } : q) });
  const removeExamQ = (qid: string) => setForm({ ...form, finalExam: form.finalExam.filter((q) => q.id !== qid) });

  return (
    <Modal
      open
      onClose={onClose}
      title={course.title ? `Edit course · ${course.title}` : "New course"}
      subtitle="Build the course exactly as users will see it: modules → lessons → module quiz → final exam → certificate."
      size="xl"
      footer={
        <>
          <button onClick={onClose} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
          <button
            onClick={() => {
              if (!form.title.trim()) return toast.error("Course title is required");
              if (form.access === "paid" && form.priceUsd <= 0 && form.priceRr <= 0)
                return toast.error("Paid course needs a price (USD or RR)");
              onSave(form);
            }}
            className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white"
          >Save course</button>
        </>
      }
    >
      {/* Tabs */}
      <div className="-mt-2 mb-4 flex flex-wrap gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10">
        {([
          { id: "details", label: "Details", icon: GraduationCap },
          { id: "modules", label: `Modules (${form.modules.length})`, icon: Layers },
          { id: "exam", label: `Final exam (${form.finalExam.length})`, icon: FileQuestion },
          { id: "preview", label: "Preview", icon: Eye },
        ] as const).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${tab === t.id ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white" : "text-white/60 hover:text-white"}`}
            >
              <Icon className="h-3 w-3" /> {t.label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2 px-2 text-[10px] text-white/50">
          <Layers className="h-3 w-3" />{totals.modules}
          <BookOpen className="h-3 w-3" />{totals.lessons}
          <FileQuestion className="h-3 w-3" />{form.modules.reduce((s, m) => s + m.quiz.length, 0) + form.finalExam.length}
        </div>
      </div>

      {tab === "details" && (
        <DetailsTab form={form} setForm={setForm} />
      )}

      {tab === "modules" && (
        <ModulesTab
          form={form}
          addModule={addModule}
          patchModule={patchModule}
          removeModule={removeModule}
          addLesson={addLesson}
          patchLesson={patchLesson}
          removeLesson={removeLesson}
          addQuizQ={addQuizQ}
          patchQuizQ={patchQuizQ}
          removeQuizQ={removeQuizQ}
        />
      )}

      {tab === "exam" && (
        <ExamTab
          questions={form.finalExam}
          add={addExamQ}
          patch={patchExamQ}
          remove={removeExamQ}
        />
      )}

      {tab === "preview" && (
        <PreviewTab course={form} />
      )}
    </Modal>
  );
}

function DetailsTab({ form, setForm }: { form: Course; setForm: (c: Course) => void }) {
  const setOutcomes = (text: string) => setForm({ ...form, outcomes: text.split("\n").map((s) => s.trim()).filter(Boolean) });
  const setAuthors = (text: string) => setForm({ ...form, authors: text.split(",").map((s) => s.trim()).filter(Boolean) });
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Field label="Cover (emoji)">
        <input className={fieldCls + " text-center text-2xl"} value={form.cover} onChange={(e) => setForm({ ...form, cover: e.target.value })} maxLength={2} />
      </Field>
      <div className="md:col-span-3"><Field label="Title">
        <input className={fieldCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Forex 101 — From Zero to First Live Trade" />
      </Field></div>
      <div className="md:col-span-4"><Field label="Tagline">
        <input className={fieldCls} value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Pairs, pips, lots, leverage, sessions — explained without jargon." />
      </Field></div>

      <Field label="Level">
        <select className={fieldCls} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as Level })}>
          <option>Beginner</option><option>Intermediate</option><option>Pro</option>
        </select>
      </Field>
      <Field label="Access">
        <select className={fieldCls} value={form.access} onChange={(e) => setForm({ ...form, access: e.target.value as AccessTier })}>
          <option value="free">Free</option><option value="paid">Paid</option>
        </select>
      </Field>
      <Field label="Est. hours">
        <input type="number" min={0} step={0.5} className={fieldCls} value={form.estHours} onChange={(e) => setForm({ ...form, estHours: Number(e.target.value) || 0 })} />
      </Field>
      <Field label="RR earned on completion">
        <input type="number" min={0} className={fieldCls} value={form.rrReward} onChange={(e) => setForm({ ...form, rrReward: Number(e.target.value) || 0 })} />
      </Field>

      {form.access === "paid" && (
        <>
          <Field label="Price (USD)">
            <input type="number" min={0} className={fieldCls} value={form.priceUsd} onChange={(e) => setForm({ ...form, priceUsd: Number(e.target.value) || 0 })} />
          </Field>
          <Field label="Unlock cost (RR)">
            <input type="number" min={0} className={fieldCls} value={form.priceRr} onChange={(e) => setForm({ ...form, priceRr: Number(e.target.value) || 0 })} />
          </Field>
          <Field label="Rating (display)">
            <input type="number" min={0} max={5} step={0.1} className={fieldCls} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) || 0 })} />
          </Field>
          <Field label="Enrolled (display)">
            <input type="number" min={0} className={fieldCls} value={form.enrolled} onChange={(e) => setForm({ ...form, enrolled: Number(e.target.value) || 0 })} />
          </Field>
        </>
      )}

      <div className="md:col-span-4"><Field label="Authors (comma-separated)">
        <input className={fieldCls} value={(form.authors ?? []).join(", ")} onChange={(e) => setAuthors(e.target.value)} placeholder="RebateBoard Academy, Guest Pro" />
      </Field></div>

      <div className="md:col-span-4"><Field label="Learning outcomes (one per line)">
        <textarea rows={4} className={fieldCls} value={(form.outcomes ?? []).join("\n")} onChange={(e) => setOutcomes(e.target.value)} placeholder={"Read any FX quote confidently\nSize positions in lots and pips"} />
      </Field></div>
    </div>
  );
}

function ModulesTab({
  form, addModule, patchModule, removeModule, addLesson, patchLesson, removeLesson, addQuizQ, patchQuizQ, removeQuizQ,
}: {
  form: Course;
  addModule: () => void;
  patchModule: (mid: string, patch: Partial<Module>) => void;
  removeModule: (mid: string) => void;
  addLesson: (mid: string) => void;
  patchLesson: (mid: string, lid: string, patch: Partial<Lesson>) => void;
  removeLesson: (mid: string, lid: string) => void;
  addQuizQ: (mid: string) => void;
  patchQuizQ: (mid: string, qid: string, patch: Partial<QuizQuestion>) => void;
  removeQuizQ: (mid: string, qid: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          Each module contains lessons and a short quiz. Users must pass each module quiz before unlocking the next.
        </p>
        <button onClick={addModule} className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1 text-[10px] font-bold text-white">
          <Plus className="h-3 w-3" /> Add module
        </button>
      </div>

      {form.modules.length === 0 && (
        <div className="rounded-xl bg-white/5 py-10 text-center text-xs text-muted-foreground">
          No modules yet. Add the first module to start building lessons.
        </div>
      )}

      {form.modules.map((m, idx) => (
        <ModuleEditor
          key={m.id}
          index={idx}
          module={m}
          onPatch={(p) => patchModule(m.id, p)}
          onRemove={() => removeModule(m.id)}
          onAddLesson={() => addLesson(m.id)}
          onPatchLesson={(lid, p) => patchLesson(m.id, lid, p)}
          onRemoveLesson={(lid) => removeLesson(m.id, lid)}
          onAddQuiz={() => addQuizQ(m.id)}
          onPatchQuiz={(qid, p) => patchQuizQ(m.id, qid, p)}
          onRemoveQuiz={(qid) => removeQuizQ(m.id, qid)}
        />
      ))}
    </div>
  );
}

function ModuleEditor({
  index, module: m, onPatch, onRemove, onAddLesson, onPatchLesson, onRemoveLesson, onAddQuiz, onPatchQuiz, onRemoveQuiz,
}: {
  index: number;
  module: Module;
  onPatch: (p: Partial<Module>) => void;
  onRemove: () => void;
  onAddLesson: () => void;
  onPatchLesson: (lid: string, p: Partial<Lesson>) => void;
  onRemoveLesson: (lid: string) => void;
  onAddQuiz: () => void;
  onPatchQuiz: (qid: string, p: Partial<QuizQuestion>) => void;
  onRemoveQuiz: (qid: string) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="overflow-hidden rounded-xl bg-white/[0.03] ring-1 ring-white/10">
      <div className="flex items-center gap-2 bg-white/[0.04] px-3 py-2">
        <button onClick={() => setOpen((s) => !s)} className="grid h-6 w-6 place-items-center rounded-md bg-white/10 text-white/70">
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        <span className="text-[10px] font-mono text-muted-foreground">M{index + 1}</span>
        <input
          value={m.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          placeholder="Module title"
          className="flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/30"
        />
        <span className="text-[10px] text-white/40">{m.lessons.length}L · {m.quiz.length}Q</span>
        <button onClick={onRemove} className="grid h-6 w-6 place-items-center rounded-md bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30" title="Remove module">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {open && (
        <div className="space-y-3 p-3">
          <textarea
            rows={2}
            value={m.summary}
            onChange={(e) => onPatch({ summary: e.target.value })}
            placeholder="One-sentence module summary shown to users…"
            className={fieldCls}
          />

          {/* Lessons */}
          <div className="rounded-lg bg-black/20 p-3 ring-1 ring-white/5">
            <div className="mb-2 flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white"><PlayCircle className="h-3 w-3 text-emerald-300" /> Lessons</div>
              <button onClick={onAddLesson} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/15">
                <Plus className="h-3 w-3" /> Add lesson
              </button>
            </div>
            <div className="space-y-2">
              {m.lessons.length === 0 && <p className="py-2 text-center text-[11px] text-muted-foreground">No lessons.</p>}
              {m.lessons.map((l, i) => (
                <div key={l.id} className="rounded-lg bg-white/[0.04] p-2 ring-1 ring-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground">L{i + 1}</span>
                    <input
                      value={l.title}
                      onChange={(e) => onPatchLesson(l.id, { title: e.target.value })}
                      placeholder="Lesson title"
                      className="flex-1 bg-transparent text-xs font-bold text-white outline-none placeholder:text-white/30"
                    />
                    <input
                      type="number" min={1}
                      value={l.durationMin}
                      onChange={(e) => onPatchLesson(l.id, { durationMin: Number(e.target.value) || 0 })}
                      className="w-14 rounded-md bg-black/30 px-2 py-1 text-center text-[11px] text-white ring-1 ring-white/10 outline-none"
                      title="Minutes"
                    />
                    <span className="text-[10px] text-white/40">min</span>
                    <button onClick={() => onRemoveLesson(l.id)} className="grid h-6 w-6 place-items-center rounded-md bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <input
                      value={l.summary}
                      onChange={(e) => onPatchLesson(l.id, { summary: e.target.value })}
                      placeholder="Short summary (one line)"
                      className={fieldCls + " text-xs"}
                    />
                    <input
                      value={l.videoUrl ?? ""}
                      onChange={(e) => onPatchLesson(l.id, { videoUrl: e.target.value })}
                      placeholder="Video URL (optional)"
                      className={fieldCls + " text-xs"}
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={l.body}
                    onChange={(e) => onPatchLesson(l.id, { body: e.target.value })}
                    placeholder="Lesson body — explain the concept clearly. Plain text or markdown-lite."
                    className={fieldCls + " mt-2 text-xs"}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Module quiz */}
          <div className="rounded-lg bg-black/20 p-3 ring-1 ring-white/5">
            <div className="mb-2 flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white"><FileQuestion className="h-3 w-3 text-amber-300" /> Module quiz</div>
              <button onClick={onAddQuiz} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/15">
                <Plus className="h-3 w-3" /> Add question
              </button>
            </div>
            <div className="space-y-2">
              {m.quiz.length === 0 && <p className="py-2 text-center text-[11px] text-muted-foreground">No questions yet.</p>}
              {m.quiz.map((q, i) => (
                <QuizQuestionEditor
                  key={q.id}
                  index={i}
                  question={q}
                  onPatch={(p) => onPatchQuiz(q.id, p)}
                  onRemove={() => onRemoveQuiz(q.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExamTab({
  questions, add, patch, remove,
}: {
  questions: QuizQuestion[];
  add: () => void;
  patch: (qid: string, p: Partial<QuizQuestion>) => void;
  remove: (qid: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          Final exam unlocks the certificate and the RR completion reward. Aim for 5–10 questions.
        </p>
        <button onClick={add} className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1 text-[10px] font-bold text-white">
          <Plus className="h-3 w-3" /> Add question
        </button>
      </div>
      <div className="space-y-2">
        {questions.length === 0 && (
          <div className="rounded-xl bg-white/5 py-10 text-center text-xs text-muted-foreground">No exam questions yet.</div>
        )}
        {questions.map((q, i) => (
          <QuizQuestionEditor
            key={q.id}
            index={i}
            question={q}
            onPatch={(p) => patch(q.id, p)}
            onRemove={() => remove(q.id)}
          />
        ))}
      </div>
    </div>
  );
}

function QuizQuestionEditor({
  index, question, onPatch, onRemove,
}: {
  index: number;
  question: QuizQuestion;
  onPatch: (p: Partial<QuizQuestion>) => void;
  onRemove: () => void;
}) {
  const setOption = (oi: number, val: string) => {
    const next = [...question.options];
    next[oi] = val;
    onPatch({ options: next });
  };
  const addOption = () => onPatch({ options: [...question.options, ""] });
  const removeOption = (oi: number) => {
    if (question.options.length <= 2) return;
    const next = question.options.filter((_, i) => i !== oi);
    onPatch({
      options: next,
      correctIndex: question.correctIndex >= next.length ? 0 : question.correctIndex,
    });
  };

  return (
    <div className="rounded-lg bg-white/[0.04] p-3 ring-1 ring-white/5">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[10px] font-mono text-muted-foreground">Q{index + 1}</span>
        <input
          value={question.q}
          onChange={(e) => onPatch({ q: e.target.value })}
          placeholder="Question prompt"
          className="flex-1 bg-transparent text-xs font-bold text-white outline-none placeholder:text-white/30"
        />
        <button onClick={onRemove} className="grid h-6 w-6 place-items-center rounded-md bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <div className="space-y-1.5">
        {question.options.map((opt, oi) => (
          <div key={oi} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPatch({ correctIndex: oi })}
              title="Mark correct"
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ring-1 transition ${question.correctIndex === oi ? "bg-emerald-500 text-black ring-emerald-400" : "bg-white/5 text-white/40 ring-white/10 hover:bg-white/10"}`}
            >
              {question.correctIndex === oi ? "✓" : String.fromCharCode(65 + oi)}
            </button>
            <input
              value={opt}
              onChange={(e) => setOption(oi, e.target.value)}
              placeholder={`Option ${String.fromCharCode(65 + oi)}`}
              className="flex-1 rounded-md bg-black/30 px-2 py-1 text-xs text-white ring-1 ring-white/10 outline-none placeholder:text-white/30"
            />
            <button onClick={() => removeOption(oi)} disabled={question.options.length <= 2} className="grid h-5 w-5 place-items-center rounded-md bg-white/5 text-white/40 ring-1 ring-white/10 disabled:opacity-30">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button onClick={addOption} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[10px] text-white/70 hover:bg-white/10">
          <Plus className="h-3 w-3" /> Add option
        </button>
      </div>
      <input
        value={question.explain ?? ""}
        onChange={(e) => onPatch({ explain: e.target.value })}
        placeholder="Explanation shown after answering (optional)"
        className={fieldCls + " mt-2 text-[11px]"}
      />
    </div>
  );
}

function PreviewTab({ course }: { course: Course }) {
  const totals = courseTotals(course);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500/10 via-violet-500/5 to-cyan-500/10 p-5 ring-1 ring-white/10">
        <div className="flex items-start gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500/30 to-violet-600/30 text-3xl">{course.cover}</div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/70">{course.level}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${course.access === "paid" ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                {course.access === "paid" ? "PAID" : "FREE"}
              </span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">+{course.rrReward} RR on completion</span>
              {course.access === "paid" && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">${course.priceUsd} · {course.priceRr} RR</span>}
            </div>
            <h3 className="mt-2 text-lg font-bold text-white">{course.title || <em className="text-white/40">Untitled course</em>}</h3>
            <p className="mt-1 text-xs text-white/70">{course.tagline}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-white/60">
              <span><Layers className="mr-1 inline h-3 w-3" />{totals.modules} modules</span>
              <span><BookOpen className="mr-1 inline h-3 w-3" />{totals.lessons} lessons</span>
              <span><FileQuestion className="mr-1 inline h-3 w-3" />{course.finalExam.length} exam questions</span>
              <span>~{course.estHours}h</span>
            </div>
          </div>
        </div>
      </div>

      {(course.outcomes ?? []).length > 0 && (
        <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="mb-2 text-xs font-bold text-white inline-flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-fuchsia-300" /> What you'll learn</div>
          <ul className="space-y-1 text-xs text-white/70">
            {course.outcomes.map((o, i) => <li key={i}>• {o}</li>)}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        {course.modules.map((m, i) => (
          <div key={m.id} className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
            <div className="text-xs font-bold text-white">M{i + 1} · {m.title || <em className="text-white/40">Untitled</em>}</div>
            {m.summary && <p className="mt-0.5 text-[11px] text-white/60">{m.summary}</p>}
            <ul className="mt-2 space-y-0.5 text-[11px] text-white/70">
              {m.lessons.map((l, li) => (
                <li key={l.id} className="flex items-center justify-between">
                  <span>L{li + 1} · {l.title || <em className="text-white/40">Untitled</em>}</span>
                  <span className="text-white/40">{l.durationMin}m</span>
                </li>
              ))}
              {m.quiz.length > 0 && <li className="text-amber-300">Quiz · {m.quiz.length} questions</li>}
            </ul>
          </div>
        ))}
        {course.modules.length === 0 && (
          <div className="rounded-xl bg-white/5 py-6 text-center text-xs text-muted-foreground">Add modules to see them here.</div>
        )}
      </div>

      {course.finalExam.length > 0 && (
        <div className="rounded-xl bg-amber-500/5 p-3 ring-1 ring-amber-500/20">
          <div className="text-xs font-bold text-amber-300 inline-flex items-center gap-1.5"><FileQuestion className="h-3 w-3" /> Final exam · {course.finalExam.length} questions</div>
          <p className="mt-1 text-[11px] text-white/60">Pass to unlock certificate and RR reward.</p>
        </div>
      )}
    </div>
  );
}
