import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Award, Bot, BookOpen, Brain, Check, ChevronRight, CircleCheck, Clock, GraduationCap,
  Lock, MessageCircle, PlayCircle, Sparkles, Star, Trophy, Wallet, X, ArrowLeft,
  CheckCircle2, AlertCircle, Send, Zap, Download, FileImage, FileText, Eye, Printer,
} from "lucide-react";
import {
  Course, Faculty, Module, Lesson, QuizQuestion, getCourse,
  useAcademyStore, courseTotals, progressPct, allCourses, useFaculties,
} from "@/lib/academy-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type View =
  | { kind: "home" }
  | { kind: "faculty"; slug: string }
  | { kind: "course"; courseId: string }
  | { kind: "lesson"; courseId: string; lessonId: string }
  | { kind: "module-quiz"; courseId: string; moduleId: string }
  | { kind: "final-exam"; courseId: string }
  | { kind: "certificate"; courseId: string };

export function AcademyShell({
  preview = false,
  loginHref = "/login",
}: { preview?: boolean; loginHref?: string }) {
  const [view, setView] = useState<View>({ kind: "home" });
  const [aiOpen, setAiOpen] = useState(false);
  const store = useAcademyStore();

  // Preview mode = public page: lock interactions and route signups to login.
  const isPreview = preview;

  return (
    <div className="relative">
      {/* Breadcrumb */}
      <Breadcrumb view={view} setView={setView} />

      <div className="mt-4">
        {view.kind === "home" && <Home setView={setView} preview={isPreview} />}
        {view.kind === "faculty" && (
          <FacultyView slug={view.slug} setView={setView} preview={isPreview} />
        )}
        {view.kind === "course" && (
          <CourseDetail
            courseId={view.courseId}
            setView={setView}
            preview={isPreview}
            loginHref={loginHref}
          />
        )}
        {view.kind === "lesson" && !isPreview && (
          <LessonPlayer
            courseId={view.courseId}
            lessonId={view.lessonId}
            setView={setView}
          />
        )}
        {view.kind === "module-quiz" && !isPreview && (
          <ModuleQuizView
            courseId={view.courseId}
            moduleId={view.moduleId}
            setView={setView}
          />
        )}
        {view.kind === "final-exam" && !isPreview && (
          <FinalExamView courseId={view.courseId} setView={setView} />
        )}
        {view.kind === "certificate" && !isPreview && (
          <CertificateView courseId={view.courseId} setView={setView} />
        )}
      </div>

      {/* Floating AI tutor — only in dashboard mode */}
      {!isPreview && (
        <FloatingTutor open={aiOpen} setOpen={setAiOpen} contextView={view} />
      )}

      {/* RR balance pill (dashboard only) */}
      {!isPreview && (
        <div className="fixed bottom-6 left-6 z-40 hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-2 text-xs text-white backdrop-blur">
          <Wallet className="h-3.5 w-3.5 text-emerald-300" />
          RR balance: <span className="font-bold text-emerald-300">{store.rrBalance.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

/* ─────────── breadcrumb ─────────── */
function Breadcrumb({ view, setView }: { view: View; setView: (v: View) => void }) {
  const faculties = useFaculties();
  const crumbs: { label: string; onClick?: () => void }[] = [
    { label: "Academy", onClick: () => setView({ kind: "home" }) },
  ];
  if (view.kind === "faculty") {
    const f = faculties.find((x) => x.slug === view.slug);
    if (f) crumbs.push({ label: f.title });
  }
  if (view.kind === "course" || view.kind === "lesson" || view.kind === "module-quiz" || view.kind === "final-exam" || view.kind === "certificate") {
    const found = getCourse(view.courseId);
    if (found) {
      crumbs.push({ label: found.faculty.title, onClick: () => setView({ kind: "faculty", slug: found.faculty.slug }) });
      crumbs.push({ label: found.course.title, onClick: () => setView({ kind: "course", courseId: view.courseId }) });
    }
  }
  if (view.kind === "lesson") crumbs.push({ label: "Lesson" });
  if (view.kind === "module-quiz") crumbs.push({ label: "Module quiz" });
  if (view.kind === "final-exam") crumbs.push({ label: "Final exam" });
  if (view.kind === "certificate") crumbs.push({ label: "Certificate" });

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-white/50">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {c.onClick ? (
            <button onClick={c.onClick} className="hover:text-white">{c.label}</button>
          ) : (
            <span className="text-white/80">{c.label}</span>
          )}
          {i < crumbs.length - 1 && <ChevronRight className="h-3 w-3 text-white/30" />}
        </span>
      ))}
    </div>
  );
}

/* ─────────── home: faculties grid ─────────── */
function Home({ setView, preview }: { setView: (v: View) => void; preview: boolean }) {
  const faculties = useFaculties();
  const totals = useMemo(() => {
    const courses = allCourses();
    return {
      faculties: faculties.length,
      courses: courses.length,
      lessons: courses.reduce((s, c) => s + courseTotals(c).lessons, 0),
    };
  }, [faculties]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 via-violet-500/5 to-cyan-500/10 p-6 md:p-10">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-fuchsia-300/90">
            <Sparkles className="h-3 w-3" /> Trader University
          </div>
          <h1 className="mt-4 max-w-3xl bg-gradient-to-r from-white via-fuchsia-200 to-violet-300 bg-clip-text text-3xl font-bold leading-tight text-transparent md:text-5xl">
            The Academy that turns reading into <span className="text-emerald-300">RR rewards</span>.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/70 md:text-base">
            Pick a faculty, follow a structured program, complete modules with quizzes, and unlock a certificate.
            Free courses earn you RR. Paid courses can be unlocked with cash <em>or</em> your RR balance.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <Stat label="Faculties" value={totals.faculties} />
            <Stat label="Courses" value={totals.courses} />
            <Stat label="Lessons" value={totals.lessons} />
            <Stat label="Certificates" value="On completion" />
          </div>
        </div>
      </div>

      {/* Faculties */}
      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Faculties</h2>
            <p className="text-xs text-white/50">Choose where you want to specialize.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {faculties.map((f) => (
            <button
              key={f.id}
              onClick={() => setView({ kind: "faculty", slug: f.slug })}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-white/20"
            >
              <div className={`absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br ${f.color} opacity-20 blur-2xl transition group-hover:opacity-30`} />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${f.color} text-2xl shadow-lg`}>
                    {f.emoji}
                  </div>
                  <div>
                    <div className="text-base font-bold text-white">{f.title}</div>
                    <div className="text-[11px] text-white/50">{f.programs.length} programs · {f.programs.reduce((s, p) => s + p.courses.length, 0)} courses</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-white/70">{f.tagline}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-fuchsia-300">
                  Enter faculty <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Featured */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-white">Featured Courses</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allCourses().slice(0, 6).map((c) => (
            <CourseCard key={c.id} course={c} onOpen={() => setView({ kind: "course", courseId: c.id })} />
          ))}
        </div>
      </div>

      {preview && (
        <div className="rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-4 text-sm text-white/85">
          You're viewing a public preview. <Link to="/login" className="font-bold text-fuchsia-300 underline">Sign in</Link> to start lessons, take quizzes, earn RR, and download certificates.
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="text-base font-bold text-white">{value}</div>
    </div>
  );
}

/* ─────────── faculty view ─────────── */
function FacultyView({ slug, setView, preview }: { slug: string; setView: (v: View) => void; preview: boolean }) {
  const faculties = useFaculties();
  const f = faculties.find((x) => x.slug === slug);
  if (!f) return <p className="text-sm text-white/60">Faculty not found.</p>;

  return (
    <div className="space-y-8">
      <div className={`rounded-3xl border border-white/10 bg-gradient-to-br ${f.color} bg-opacity-10 p-6`}>
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-black/30 text-3xl">{f.emoji}</div>
          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">{f.title}</h1>
            <p className="mt-1 text-sm text-white/80">{f.tagline}</p>
          </div>
        </div>
      </div>

      {f.programs.map((p) => (
        <div key={p.id}>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{p.title}</h2>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/70">{p.level}</span>
              </div>
              <p className="text-xs text-white/50">{p.summary}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {p.courses.map((c) => (
              <CourseCard key={c.id} course={c} onOpen={() => setView({ kind: "course", courseId: c.id })} />
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={() => setView({ kind: "home" })}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:text-white"
      >
        <ArrowLeft className="h-3 w-3" /> Back to faculties
      </button>
    </div>
  );
}

/* ─────────── course card ─────────── */
function CourseCard({ course, onOpen }: { course: Course; onOpen: () => void }) {
  const totals = courseTotals(course);
  const store = useAcademyStore();
  const p = store.progress[course.id];
  const pct = progressPct(course, p);

  return (
    <button
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-left transition hover:border-white/20"
    >
      <div className="flex items-center justify-between border-b border-white/5 bg-black/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{course.cover}</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/70">{course.level}</span>
        </div>
        {course.access === "paid" ? (
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">PAID</span>
        ) : (
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">FREE</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="text-sm font-bold text-white">{course.title}</div>
        <p className="mt-1 line-clamp-2 text-[12px] text-white/60">{course.tagline}</p>

        <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-white/50">
          <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" /> {totals.lessons} lessons</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {course.estHours}h</span>
          <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-amber-300" /> {course.rating.toFixed(1)}</span>
        </div>

        <div className="mt-auto pt-4">
          {p ? (
            <>
              <div className="flex items-center justify-between text-[10px] text-white/50">
                <span>Progress</span>
                <span className="text-white/70">{pct}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                <div className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-500" style={{ width: `${pct}%` }} />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-300">
                <Trophy className="h-3 w-3" /> +{course.rrReward} RR
              </span>
              {course.access === "paid" && (
                <span className="text-[10px] text-white/60">${course.priceUsd} <span className="text-white/30">·</span> {course.priceRr} RR</span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

/* ─────────── course detail ─────────── */
function CourseDetail({
  courseId, setView, preview, loginHref,
}: { courseId: string; setView: (v: View) => void; preview: boolean; loginHref: string }) {
  const found = getCourse(courseId);
  const store = useAcademyStore();

  useEffect(() => {
    if (!preview && found) store.ensureEnrolled(courseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, preview]);

  if (!found) return <p className="text-sm text-white/60">Course not found.</p>;
  const { course } = found;
  const p = store.progress[courseId];
  const pct = progressPct(course, p);
  const unlocked = course.access === "free" || (p?.unlocked ?? false);
  const totals = courseTotals(course);

  const cantAffordRr = store.rrBalance < course.priceRr;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500/30 to-violet-600/30 text-5xl">
            {course.cover}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/70">{course.level}</span>
              {course.access === "paid"
                ? <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">PAID</span>
                : <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">FREE</span>}
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                <Trophy className="h-3 w-3" /> +{course.rrReward} RR on completion
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">{course.title}</h1>
            <p className="mt-2 text-sm text-white/70">{course.tagline}</p>

            <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-white/60">
              <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" /> {totals.modules} modules · {totals.lessons} lessons</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> ~{course.estHours}h</span>
              <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-amber-300" /> {course.rating.toFixed(1)} · {course.enrolled.toLocaleString()} enrolled</span>
              <span className="inline-flex items-center gap-1"><Award className="h-3 w-3 text-fuchsia-300" /> Certificate on final exam</span>
            </div>

            {p && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] text-white/60">
                  <span>Your progress</span><span className="font-semibold text-white">{pct}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}

            {/* Action area */}
            <div className="mt-5 flex flex-wrap gap-2">
              {preview ? (
                <Link to={loginHref} className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-2 text-sm font-bold text-white">
                  Sign in to start
                </Link>
              ) : course.access === "free" || unlocked ? (
                <button
                  onClick={() => {
                    const first = course.modules[0]?.lessons[0];
                    if (first) setView({ kind: "lesson", courseId, lessonId: first.id });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-2 text-sm font-bold text-white"
                >
                  <PlayCircle className="h-4 w-4" /> {p && p.completedLessons.length > 0 ? "Continue learning" : "Start course"}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => store.unlockWithCash(courseId)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15"
                  >
                    Unlock with cash · ${course.priceUsd}
                  </button>
                  <button
                    onClick={() => store.unlockWithRr(courseId)}
                    disabled={cantAffordRr}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                  >
                    <Wallet className="h-4 w-4" /> Unlock with {course.priceRr.toLocaleString()} RR
                  </button>
                  {cantAffordRr && (
                    <span className="self-center text-[11px] text-white/50">Your RR balance: {store.rrBalance.toLocaleString()}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Outcomes */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-sm font-bold text-white">What you'll learn</h3>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {course.outcomes.map((o, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/80">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> {o}
            </li>
          ))}
        </ul>
      </div>

      {/* Curriculum */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-sm font-bold text-white">Curriculum</h3>
        <div className="mt-3 space-y-3">
          {course.modules.map((m, mi) => {
            const quizPassed = p?.passedQuizzes.includes(`${m.id}-quiz`);
            return (
              <div key={m.id} className="rounded-xl border border-white/10 bg-black/20">
                <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-white/40">Module {mi + 1}</div>
                    <div className="text-sm font-semibold text-white">{m.title}</div>
                    <div className="text-[11px] text-white/50">{m.summary}</div>
                  </div>
                  {quizPassed && <CheckCircle2 className="h-5 w-5 text-emerald-300" />}
                </div>
                <ul>
                  {m.lessons.map((l) => {
                    const done = p?.completedLessons.includes(l.id);
                    return (
                      <li key={l.id} className="flex items-center justify-between border-b border-white/5 px-4 py-2 last:border-0">
                        <div className="flex items-center gap-2 text-sm">
                          {done ? <CircleCheck className="h-4 w-4 text-emerald-300" /> : <PlayCircle className="h-4 w-4 text-white/50" />}
                          <span className={done ? "text-white/80 line-through" : "text-white"}>{l.title}</span>
                          <span className="text-[10px] text-white/40">{l.durationMin} min</span>
                        </div>
                        {!preview && unlocked ? (
                          <button
                            onClick={() => setView({ kind: "lesson", courseId, lessonId: l.id })}
                            className="text-[11px] font-semibold text-fuchsia-300 hover:underline"
                          >
                            {done ? "Review" : "Start"}
                          </button>
                        ) : (
                          <Lock className="h-3.5 w-3.5 text-white/30" />
                        )}
                      </li>
                    );
                  })}
                  <li className="flex items-center justify-between bg-white/[0.02] px-4 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Brain className="h-4 w-4 text-fuchsia-300" />
                      <span className="text-white">Module Quiz</span>
                      <span className="text-[10px] text-white/40">{m.quiz.length} questions</span>
                    </div>
                    {!preview && unlocked ? (
                      <button
                        onClick={() => setView({ kind: "module-quiz", courseId, moduleId: m.id })}
                        className="text-[11px] font-semibold text-fuchsia-300 hover:underline"
                      >
                        {quizPassed ? "Retake" : "Take quiz"}
                      </button>
                    ) : <Lock className="h-3.5 w-3.5 text-white/30" />}
                  </li>
                </ul>
              </div>
            );
          })}

          {/* Final exam */}
          <div className="rounded-xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/10 to-violet-500/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-fuchsia-300/80">Final exam</div>
                <div className="text-sm font-semibold text-white">Unlock your certificate</div>
                <div className="text-[11px] text-white/60">Pass with 80%+ to earn +{course.access === "free" ? course.rrReward : Math.round(course.rrReward * 0.6)} RR and a verified certificate.</div>
              </div>
              {p?.finalExamPassed ? (
                <button onClick={() => setView({ kind: "certificate", courseId })} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 px-4 py-2 text-xs font-bold text-white">
                  <Award className="h-3.5 w-3.5" /> View certificate
                </button>
              ) : !preview && unlocked ? (
                <button onClick={() => setView({ kind: "final-exam", courseId })} className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white">
                  Take final exam
                </button>
              ) : (
                <Lock className="h-4 w-4 text-white/40" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── lesson player ─────────── */
const LESSON_VIDEO_POOL = [
  // Generic, evergreen trading-education videos used as fallbacks.
  "Yzic_S6PVwo", // Investopedia: How forex works
  "Pdcup4nx_C8", // Forex basics
  "G4P-vJ6BQHk", // Risk management
  "Wjc7yvDSXqM", // Prop firms explained
  "Vp4i3JqkSqw", // Trading psychology
];
function videoIdForLesson(lesson: Lesson): string {
  if (lesson.videoUrl) {
    // Accept full URLs or bare IDs.
    const m = lesson.videoUrl.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/);
    if (m) return m[1];
    if (/^[\w-]{6,}$/.test(lesson.videoUrl)) return lesson.videoUrl;
  }
  // Deterministic pick from id so the same lesson always loads the same video.
  let h = 0;
  for (let i = 0; i < lesson.id.length; i++) h = (h * 31 + lesson.id.charCodeAt(i)) >>> 0;
  return LESSON_VIDEO_POOL[h % LESSON_VIDEO_POOL.length];
}

function LessonPlayer({ courseId, lessonId, setView }: { courseId: string; lessonId: string; setView: (v: View) => void }) {
  const found = getCourse(courseId);
  const store = useAcademyStore();
  const [tab, setTab] = useState<"read" | "video">("read");
  if (!found) return null;
  const { course } = found;

  const flat: { lesson: Lesson; module: Module }[] = course.modules.flatMap((m) => m.lessons.map((l) => ({ lesson: l, module: m })));
  const idx = flat.findIndex((x) => x.lesson.id === lessonId);
  const cur = flat[idx];
  if (!cur) return null;
  const next = flat[idx + 1];
  const p = store.progress[courseId];
  const done = p?.completedLessons.includes(lessonId);
  const vid = videoIdForLesson(cur.lesson);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-fuchsia-300/80">
          <BookOpen className="h-3 w-3" /> {cur.module.title}
        </div>
        <h1 className="mt-1 text-xl font-bold text-white md:text-2xl">{cur.lesson.title}</h1>
        <div className="mt-1 text-[11px] text-white/50">{cur.lesson.durationMin} min · Lesson {idx + 1} of {flat.length}</div>

        {/* Read / Video toggle */}
        <div className="mt-4 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1 text-xs">
          <button
            onClick={() => setTab("read")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${tab === "read" ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white" : "text-white/70 hover:text-white"}`}
          >
            <BookOpen className="h-3.5 w-3.5" /> Read
          </button>
          <button
            onClick={() => setTab("video")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${tab === "video" ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white" : "text-white/70 hover:text-white"}`}
          >
            <PlayCircle className="h-3.5 w-3.5" /> Watch video
          </button>
          <span className="ml-1 hidden text-[10px] text-white/40 md:inline">Switch any time — both count.</span>
        </div>

        {tab === "video" ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black">
            <div className="relative aspect-video">
              <iframe
                key={vid}
                src={`https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1`}
                title={cur.lesson.title}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className="border-t border-white/5 bg-white/[0.02] px-3 py-2 text-[11px] text-white/60">
              Prefer reading? <button onClick={() => setTab("read")} className="font-semibold text-fuchsia-300 hover:underline">Switch to the written lesson →</button>
            </div>
          </div>
        ) : (
          <article className="mt-4 space-y-4 text-sm leading-relaxed text-white/85">
            <p className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-white/80">
              <span className="mr-1 text-[10px] uppercase tracking-wider text-fuchsia-300">Summary</span>
              {cur.lesson.summary}
            </p>
            {cur.lesson.body.split(/\n\n+/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
            <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-[12px] text-white/60">
              Want to see this explained on video instead?{" "}
              <button onClick={() => setTab("video")} className="font-semibold text-fuchsia-300 hover:underline">Watch the video version →</button>
            </div>
          </article>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => store.completeLesson(courseId, lessonId)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold ${done ? "bg-emerald-500/20 text-emerald-300" : "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white"}`}
          >
            {done ? <><Check className="h-3.5 w-3.5" /> Marked complete</> : <><Check className="h-3.5 w-3.5" /> Mark as complete</>}
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setView({ kind: "course", courseId })}
              className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/70 hover:text-white"
            >
              Back to course
            </button>
            {next ? (
              <button
                onClick={() => setView({ kind: "lesson", courseId, lessonId: next.lesson.id })}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/15"
              >
                Next lesson <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setView({ kind: "module-quiz", courseId, moduleId: cur.module.id })}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-xs font-bold text-white"
              >
                Take module quiz <Brain className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── quiz / exam ─────────── */
function QuizRunner({
  questions, passThreshold = 0.8, onPass, onCancel, title,
}: { questions: QuizQuestion[]; passThreshold?: number; onPass: () => void; onCancel: () => void; title: string }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const correct = questions.filter((q) => answers[q.id] === q.correctIndex).length;
  const score = correct / questions.length;
  const passed = score >= passThreshold;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-fuchsia-300/80">
        <Brain className="h-3 w-3" /> {title}
      </div>
      <h2 className="mt-1 text-xl font-bold text-white">Answer all {questions.length} questions</h2>
      <p className="text-[11px] text-white/50">Pass threshold: {Math.round(passThreshold * 100)}%</p>

      <div className="mt-5 space-y-5">
        {questions.map((q, i) => {
          const sel = answers[q.id];
          return (
            <div key={q.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="text-[11px] uppercase text-white/40">Question {i + 1}</div>
              <div className="mt-1 text-sm font-semibold text-white">{q.q}</div>
              <div className="mt-3 space-y-2">
                {q.options.map((opt, oi) => {
                  const chosen = sel === oi;
                  const correctChoice = submitted && oi === q.correctIndex;
                  const wrongChoice = submitted && chosen && oi !== q.correctIndex;
                  return (
                    <button
                      key={oi}
                      onClick={() => !submitted && setAnswers((a) => ({ ...a, [q.id]: oi }))}
                      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                        correctChoice ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                        : wrongChoice ? "border-rose-400/60 bg-rose-500/10 text-rose-200"
                        : chosen ? "border-fuchsia-400/60 bg-fuchsia-500/10 text-white"
                        : "border-white/10 text-white/80 hover:border-white/20"
                      }`}
                    >
                      <span className={`grid h-5 w-5 place-items-center rounded-full border ${chosen ? "border-fuchsia-400" : "border-white/30"}`}>
                        {chosen && <span className="h-2 w-2 rounded-full bg-fuchsia-400" />}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && q.explain && (
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/5 p-2 text-[11px] text-white/80">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fuchsia-300" /> {q.explain}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {submitted ? (
        <div className={`mt-5 rounded-xl border p-4 ${passed ? "border-emerald-400/40 bg-emerald-500/10" : "border-rose-400/40 bg-rose-500/10"}`}>
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            {passed ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <AlertCircle className="h-5 w-5 text-rose-300" />}
            {passed ? "You passed!" : "Not yet — try again."} Score: {Math.round(score * 100)}% ({correct}/{questions.length})
          </div>
          <div className="mt-3 flex gap-2">
            {passed ? (
              <button onClick={onPass} className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white">Continue</button>
            ) : (
              <button onClick={() => { setSubmitted(false); setAnswers({}); }} className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/15">Retry</button>
            )}
            <button onClick={onCancel} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/70 hover:text-white">Back</button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => setSubmitted(true)}
            disabled={Object.keys(answers).length !== questions.length}
            className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
          >
            Submit answers
          </button>
          <button onClick={onCancel} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/70 hover:text-white">Cancel</button>
        </div>
      )}
    </div>
  );
}

function ModuleQuizView({ courseId, moduleId, setView }: { courseId: string; moduleId: string; setView: (v: View) => void }) {
  const found = getCourse(courseId);
  const store = useAcademyStore();
  if (!found) return null;
  const m = found.course.modules.find((x) => x.id === moduleId);
  if (!m) return null;
  return (
    <QuizRunner
      title={`${m.title} — Quiz`}
      questions={m.quiz}
      onPass={() => { store.passQuiz(courseId, `${m.id}-quiz`); setView({ kind: "course", courseId }); }}
      onCancel={() => setView({ kind: "course", courseId })}
    />
  );
}

function FinalExamView({ courseId, setView }: { courseId: string; setView: (v: View) => void }) {
  const found = getCourse(courseId);
  const store = useAcademyStore();
  if (!found) return null;
  return (
    <QuizRunner
      title={`${found.course.title} — Final Exam`}
      questions={found.course.finalExam}
      onPass={() => { store.completeFinalExam(courseId); setView({ kind: "certificate", courseId }); }}
      onCancel={() => setView({ kind: "course", courseId })}
    />
  );
}

/* ─────────── certificate ─────────── */
type CertData = {
  courseTitle: string;
  facultyTitle: string;
  holderName: string;
  issued: Date;
  certId: string;
  reward: number;
};

function CertificateArtwork({ data, compact = false }: { data: CertData; compact?: boolean }) {
  // Self-contained, white-background art so PNG/PDF exports look like a printable certificate.
  return (
    <div
      className="relative mx-auto w-full overflow-hidden rounded-2xl"
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f8f5ff 50%, #f0f4ff 100%)",
        aspectRatio: "1.414 / 1", // A4 landscape proportions
        padding: compact ? 24 : 48,
        color: "#1a0a2e",
        boxShadow: "0 30px 80px -30px rgba(120,40,200,0.45)",
      }}
    >
      {/* Decorative corners */}
      <div className="pointer-events-none absolute inset-3 rounded-xl border-2" style={{ borderColor: "rgba(120,40,200,0.35)" }} />
      <div className="pointer-events-none absolute inset-5 rounded-lg border" style={{ borderColor: "rgba(120,40,200,0.18)" }} />
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(217,70,239,0.18) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(34,211,238,0.18) 0%, transparent 70%)" }}
      />

      <div className="relative flex h-full flex-col items-center justify-between text-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em]"
               style={{ background: "linear-gradient(90deg,#a21caf,#7c3aed)", color: "white" }}>
            ★ RebateBoard Academy
          </div>
          <div className="mt-4 text-[11px] uppercase tracking-[0.35em]" style={{ color: "rgba(26,10,46,0.55)" }}>
            Certificate of Completion
          </div>
        </div>

        <div className="px-6">
          <div className="text-[12px]" style={{ color: "rgba(26,10,46,0.55)" }}>This certifies that</div>
          <div className="mt-2 text-2xl font-bold md:text-4xl" style={{ fontFamily: "Georgia, serif" }}>
            {data.holderName}
          </div>
          <div className="mt-3 text-[12px]" style={{ color: "rgba(26,10,46,0.55)" }}>
            has successfully completed all modules and passed the final examination of
          </div>
          <div className="mt-2 text-lg font-bold md:text-2xl"
               style={{ background: "linear-gradient(90deg,#a21caf,#7c3aed,#0891b2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            {data.courseTitle}
          </div>
          <div className="mt-1 text-[11px]" style={{ color: "rgba(26,10,46,0.55)" }}>
            {data.facultyTitle}
          </div>
        </div>

        <div className="grid w-full max-w-2xl grid-cols-3 gap-4 text-left text-[10px]">
          <div className="rounded-lg p-2" style={{ background: "rgba(120,40,200,0.06)" }}>
            <div className="uppercase tracking-wider" style={{ color: "rgba(26,10,46,0.5)" }}>Issued</div>
            <div className="text-xs font-bold">{data.issued.toDateString()}</div>
          </div>
          <div className="rounded-lg p-2 text-center" style={{ background: "rgba(120,40,200,0.06)" }}>
            <div className="uppercase tracking-wider" style={{ color: "rgba(26,10,46,0.5)" }}>Certificate ID</div>
            <div className="font-mono text-[11px] font-bold">{data.certId}</div>
          </div>
          <div className="rounded-lg p-2 text-right" style={{ background: "rgba(16,185,129,0.1)" }}>
            <div className="uppercase tracking-wider" style={{ color: "rgba(5,150,105,0.8)" }}>RR Earned</div>
            <div className="text-xs font-bold" style={{ color: "#047857" }}>+{data.reward} RR</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CertificatePreviewModal({
  open, onOpenChange, data,
}: { open: boolean; onOpenChange: (v: boolean) => void; data: CertData }) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<null | "png" | "pdf">(null);

  const safeName = `RebateBoard-Certificate-${data.courseTitle.replace(/[^a-z0-9]+/gi, "-")}-${data.certId}`;

  async function downloadPng() {
    if (!ref.current) return;
    setBusy("png");
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(ref.current, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
      const link = document.createElement("a");
      link.download = `${safeName}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally { setBusy(null); }
  }

  async function downloadPdf() {
    if (!ref.current) return;
    setBusy("pdf");
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(ref.current, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
      pdf.save(`${safeName}.pdf`);
    } finally { setBusy(null); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-white/10 bg-[#0a0418] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-fuchsia-300" /> Certificate Preview
          </DialogTitle>
          <p className="text-xs text-white/60">Review your certificate below, then download it as a PDF or image.</p>
        </DialogHeader>

        <div className="rounded-xl bg-white/5 p-3">
          <div ref={ref}>
            <CertificateArtwork data={data} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/5"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button
            onClick={downloadPng}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/15 disabled:opacity-50"
          >
            <FileImage className="h-3.5 w-3.5" /> {busy === "png" ? "Preparing…" : "Download PNG"}
          </button>
          <button
            onClick={downloadPdf}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            <FileText className="h-3.5 w-3.5" /> {busy === "pdf" ? "Generating PDF…" : "Download PDF"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CertificateView({ courseId, setView }: { courseId: string; setView: (v: View) => void }) {
  const found = getCourse(courseId);
  const store = useAcademyStore();
  const [previewOpen, setPreviewOpen] = useState(false);
  if (!found) return null;
  const p = store.progress[courseId];
  const issued = p?.certIssuedAt ? new Date(p.certIssuedAt) : new Date();
  const certId = `RB-${courseId.toUpperCase()}-${(p?.certIssuedAt ?? 0).toString(36).slice(-6).toUpperCase()}`;
  const reward = found.course.access === "free" ? found.course.rrReward : Math.round(found.course.rrReward * 0.6);

  const data: CertData = {
    courseTitle: found.course.title,
    facultyTitle: found.faculty.title,
    holderName: store.holderName || "RebateBoard Trader",
    issued,
    certId,
    reward,
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-fuchsia-400/40 bg-gradient-to-br from-[#1a0a2e] via-[#0f0a1f] to-[#0a1428] p-8 md:p-12">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="relative text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-black/40 px-4 py-1.5 text-[11px] uppercase tracking-[0.3em] text-fuchsia-300">
            <Award className="h-3.5 w-3.5" /> Certificate of Completion
          </div>
          <div className="mt-6 text-xs uppercase tracking-widest text-white/50">RebateBoard Academy</div>
          <h1 className="mt-2 bg-gradient-to-r from-white via-fuchsia-200 to-violet-300 bg-clip-text text-3xl font-bold text-transparent md:text-5xl">
            {found.course.title}
          </h1>
          <p className="mt-3 text-sm text-white/60">This certifies that the holder has completed all modules and passed the final examination.</p>

          {/* Holder name input */}
          <div className="mx-auto mt-6 max-w-sm">
            <label className="mb-1 block text-left text-[10px] uppercase tracking-wider text-white/50">Name on certificate</label>
            <input
              value={store.holderName}
              onChange={(e) => store.setHolderName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-fuchsia-400/60"
            />
          </div>

          <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-4 text-left">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-[10px] uppercase text-white/50">Issued</div>
              <div className="text-sm font-bold text-white">{issued.toDateString()}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-[10px] uppercase text-white/50">Cert ID</div>
              <div className="font-mono text-xs text-white">{certId}</div>
            </div>
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3">
              <div className="text-[10px] uppercase text-emerald-300">RR Earned</div>
              <div className="text-sm font-bold text-emerald-200">+{reward} RR</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-[10px] uppercase text-white/50">Faculty</div>
              <div className="text-sm font-bold text-white">{found.faculty.title}</div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-2 text-sm font-bold text-white"
            >
              <Eye className="h-4 w-4" /> Preview &amp; Download
            </button>
            <button onClick={() => setView({ kind: "course", courseId })} className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/80 hover:text-white">
              Back to course
            </button>
          </div>
        </div>
      </div>

      <CertificatePreviewModal open={previewOpen} onOpenChange={setPreviewOpen} data={data} />
    </div>
  );
}

/* ─────────── floating AI tutor ─────────── */
function FloatingTutor({ open, setOpen, contextView }: { open: boolean; setOpen: (v: boolean) => void; contextView: View }) {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hi! I'm your Academy tutor. Ask me anything about the lesson, a quiz question, or a trading concept." },
  ]);
  const [input, setInput] = useState("");

  const ctxLabel = useMemo(() => {
    if (contextView.kind === "lesson") {
      const found = getCourse(contextView.courseId);
      const lesson = found?.course.modules.flatMap((m) => m.lessons).find((l) => l.id === contextView.lessonId);
      return lesson ? `Lesson: ${lesson.title}` : "Academy";
    }
    if (contextView.kind === "course") {
      return getCourse(contextView.courseId)?.course.title ?? "Course";
    }
    return "Academy";
  }, [contextView]);

  const send = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    // Templated mock answers — wire to AI Gateway later.
    setTimeout(() => {
      const reply = mockTutorReply(q, ctxLabel);
      setMessages((m) => [...m, { role: "ai", text: reply }]);
    }, 500);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-500/30 transition hover:scale-105"
        aria-label="Open AI Tutor"
      >
        {open ? <X className="h-5 w-5" /> : <Bot className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 flex h-[480px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0a0418]/95 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-fuchsia-500/20 to-violet-500/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">AI Tutor</div>
                <div className="text-[10px] text-white/60">{ctxLabel}</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
          </div>

          <div className="flex-1 space-y-3 overflow-auto p-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-fuchsia-500/20 text-white" : "bg-white/10 text-white/90"}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 p-2">
            <div className="mb-2 flex flex-wrap gap-1">
              {["Explain simpler", "Give an example", "Quiz me"].map((s) => (
                <button key={s} onClick={() => { setInput(s); }} className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-white/70 hover:bg-white/10">
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                placeholder="Ask the tutor…"
                className="flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/30"
              />
              <button onClick={send} className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function mockTutorReply(q: string, ctx: string): string {
  const lower = q.toLowerCase();
  if (lower.includes("simpler") || lower.includes("explain")) {
    return `Sure — in plain words: think of "${ctx}" as a tool you only need a small piece of to start. Focus on one definition, one example, then practice it once. The rest builds on that.`;
  }
  if (lower.includes("example")) {
    return `Example: imagine you risk $50 on a trade. If your stop is 25 pips away on EURUSD, your size is roughly $50 ÷ (25 × $10) = 0.2 lots. That single calculation is most of position sizing.`;
  }
  if (lower.includes("quiz")) {
    return `Quick check: if your daily drawdown limit is 5% on a $100k account, what is your max permissible loss for the day? (Answer: $5,000 — but smart traders stop at ~70% of that to leave a safety buffer.)`;
  }
  if (lower.includes("rr") || lower.includes("risk")) {
    return `Risk:Reward (RR) is just (target distance) ÷ (stop distance). A 3R setup means you stand to gain 3× what you risk. Combined with your win rate, RR drives expectancy.`;
  }
  return `Great question. In the context of "${ctx}", the short answer is: focus on the underlying mechanism, not the indicator. Once you understand what causes the move, the chart pattern becomes obvious.`;
}
