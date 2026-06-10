// Academy API client — wires to the real backend.
// All admin mutations call these functions alongside the local curriculum store,
// so the UI stays reactive while the DB stays in sync.

import { apiRequest } from "@/lib/api";
import type { Faculty, Program, Course } from "@/lib/academy-data";

function token() {
  return localStorage.getItem("rb-auth-token") ?? null;
}

// ─── Curriculum (full tree, public) ────────────────────────────────────────

export async function fetchCurriculum(): Promise<Faculty[]> {
  const res = await apiRequest<Faculty[]>("/academy/curriculum");
  return res.payload ?? [];
}

// ─── Faculties ──────────────────────────────────────────────────────────────

export async function apiFaculties() {
  return apiRequest<Faculty[]>("/academy/faculties");
}

export async function apiCreateFaculty(dto: {
  slug: string; title: string; emoji?: string; tagline?: string; color?: string;
}) {
  return apiRequest("/academy/faculties", { method: "POST", body: dto, token: token() });
}

export async function apiUpdateFaculty(id: number, dto: Partial<{
  slug: string; title: string; emoji: string; tagline: string; color: string; orderIndex: number; status: string;
}>) {
  return apiRequest(`/academy/faculties/${id}`, { method: "PUT", body: dto, token: token() });
}

export async function apiDeleteFaculty(id: number) {
  return apiRequest(`/academy/faculties/${id}`, { method: "DELETE", token: token() });
}

// ─── Programs ───────────────────────────────────────────────────────────────

export async function apiCreateProgram(dto: {
  facultyId: number; title: string; level?: string; summary?: string;
}) {
  return apiRequest("/academy/programs", { method: "POST", body: dto, token: token() });
}

export async function apiUpdateProgram(id: number, dto: Partial<{
  facultyId: number; title: string; level: string; summary: string; orderIndex: number; status: string;
}>) {
  return apiRequest(`/academy/programs/${id}`, { method: "PUT", body: dto, token: token() });
}

export async function apiDeleteProgram(id: number) {
  return apiRequest(`/academy/programs/${id}`, { method: "DELETE", token: token() });
}

// ─── Courses ─────────────────────────────────────────────────────────────────

export async function apiCreateCourse(dto: {
  programId: number; title: string; tagline?: string; cover?: string; coverImage?: string;
  level?: string; access?: string; priceUsd?: number; priceRr?: number; rrReward?: number;
  estHours?: number; rating?: number; enrolled?: number; authors?: string[]; outcomes?: string[];
}) {
  return apiRequest("/academy/courses", { method: "POST", body: dto, token: token() });
}

export async function apiUpdateCourse(id: number, dto: Record<string, unknown>) {
  return apiRequest(`/academy/courses/${id}`, { method: "PUT", body: dto, token: token() });
}

export async function apiDeleteCourse(id: number) {
  return apiRequest(`/academy/courses/${id}`, { method: "DELETE", token: token() });
}

// ─── Course sync (full tree — used when saving from the CourseModal) ─────────
// Sends the full course object (modules → lessons → quiz + finalExam) so the
// backend can upsert everything in one request.
// Pass _dbId on each module/lesson that already exists in the DB so it gets
// updated rather than recreated.

export async function apiSyncCourse(dbId: number, course: Course) {
  return apiRequest(`/academy/courses/${dbId}/sync`, {
    method: "PUT",
    body: course,
    token: token(),
  });
}

// ─── Modules ─────────────────────────────────────────────────────────────────

export async function apiCreateModule(dto: {
  courseId: number; title: string; summary?: string; orderIndex?: number;
}) {
  return apiRequest("/academy/modules", { method: "POST", body: dto, token: token() });
}

export async function apiUpdateModule(id: number, dto: Record<string, unknown>) {
  return apiRequest(`/academy/modules/${id}`, { method: "PUT", body: dto, token: token() });
}

export async function apiDeleteModule(id: number) {
  return apiRequest(`/academy/modules/${id}`, { method: "DELETE", token: token() });
}

// ─── Lessons ─────────────────────────────────────────────────────────────────

export async function apiCreateLesson(dto: {
  moduleId: number; title: string; durationMin?: number; summary?: string;
  body?: string; videoUrl?: string; screenshot?: string; images?: string[];
}) {
  return apiRequest("/academy/lessons", { method: "POST", body: dto, token: token() });
}

export async function apiUpdateLesson(id: number, dto: Record<string, unknown>) {
  return apiRequest(`/academy/lessons/${id}`, { method: "PUT", body: dto, token: token() });
}

export async function apiDeleteLesson(id: number) {
  return apiRequest(`/academy/lessons/${id}`, { method: "DELETE", token: token() });
}

// ─── Quiz Questions ───────────────────────────────────────────────────────────

export async function apiCreateQuizQuestion(dto: {
  type?: string; moduleId?: number; courseId?: number;
  question: string; options: string[]; correctIndex: number; explain?: string;
}) {
  return apiRequest("/academy/quiz-questions", { method: "POST", body: dto, token: token() });
}

export async function apiUpdateQuizQuestion(id: number, dto: Record<string, unknown>) {
  return apiRequest(`/academy/quiz-questions/${id}`, { method: "PUT", body: dto, token: token() });
}

export async function apiDeleteQuizQuestion(id: number) {
  return apiRequest(`/academy/quiz-questions/${id}`, { method: "DELETE", token: token() });
}

// ─── User progress ────────────────────────────────────────────────────────────

export async function apiEnrollCourse(courseId: number) {
  return apiRequest(`/academy/courses/${courseId}/enroll`, { method: "POST", token: token() });
}

export async function apiUnlockWithRr(courseId: number) {
  return apiRequest(`/academy/courses/${courseId}/unlock-rr`, { method: "POST", token: token() });
}

export async function apiUnlockWithCash(courseId: number) {
  return apiRequest(`/academy/courses/${courseId}/unlock-cash`, { method: "POST", token: token() });
}

export async function apiCompleteLesson(lessonId: number) {
  return apiRequest(`/academy/lessons/${lessonId}/complete`, { method: "POST", token: token() });
}

export async function apiSubmitModuleQuiz(moduleId: number, answers: number[]) {
  return apiRequest(`/academy/modules/${moduleId}/quiz/submit`, {
    method: "POST", body: { answers }, token: token(),
  });
}

export async function apiSubmitFinalExam(courseId: number, answers: number[]) {
  return apiRequest(`/academy/courses/${courseId}/exam/submit`, {
    method: "POST", body: { answers }, token: token(),
  });
}

export async function apiGetProgress() {
  return apiRequest("/academy/progress", { token: token() });
}

export async function apiGetCourseProgress(courseId: number) {
  return apiRequest(`/academy/progress/${courseId}`, { token: token() });
}
