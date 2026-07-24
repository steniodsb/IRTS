'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle, Lock, Loader2, PlayCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Lesson = {
  id: string;
  title: string;
  is_preview: boolean;
  duration_seconds: number;
};
type ModuleGroup = { id: string; title: string; lessons: Lesson[] };

export function LessonList({
  courseId, courseSlug, structure, completedIds, selectedId, canAccessFree, hasEnrollment, userId,
}: {
  courseId: string;
  courseSlug: string;
  structure: ModuleGroup[];
  completedIds: string[];
  selectedId: string | null;
  canAccessFree: boolean;
  hasEnrollment: boolean;
  userId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [done, setDone] = useState<Set<string>>(() => new Set(completedIds));
  const [saving, setSaving] = useState<string | null>(null);
  const [open, setOpen] = useState<Set<string>>(() => new Set(structure.map((m) => m.id)));

  const canAccess = (lesson: Lesson) => hasEnrollment || canAccessFree || lesson.is_preview;

  const selectLesson = (lesson: Lesson) => {
    if (!canAccess(lesson)) return;
    router.push(`/app/cursos/${courseSlug}?aula=${lesson.id}`);
  };

  async function markComplete(lesson: Lesson) {
    if (done.has(lesson.id)) return;
    setSaving(lesson.id);
    const { error } = await supabase.from('lesson_progress').upsert(
      {
        user_id: userId,
        lesson_id: lesson.id,
        course_id: courseId,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id' },
    );
    setSaving(null);
    if (!error) {
      setDone((prev) => new Set(prev).add(lesson.id));
      router.refresh();
    }
  }

  const toggleModule = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selected = useMemo(
    () => structure.flatMap((m) => m.lessons).find((l) => l.id === selectedId) ?? null,
    [structure, selectedId],
  );

  return (
    <div className="space-y-3">
      <p className="px-1 text-sm text-cream/70">Conteúdo do curso</p>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {structure.map((mod) => (
          <div key={mod.id} className="border-b border-line/60 last:border-b-0">
            <button
              onClick={() => toggleModule(mod.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-cream hover:bg-navy/5"
            >
              <span>{mod.title}</span>
              <span className="text-xs text-cream/40">
                {mod.lessons.filter((l) => done.has(l.id)).length}/{mod.lessons.length}
              </span>
            </button>
            {open.has(mod.id) && (
              <ul>
                {mod.lessons.map((lesson) => {
                  const access = canAccess(lesson);
                  const isDone = done.has(lesson.id);
                  const active = lesson.id === selectedId;
                  return (
                    <li key={lesson.id}>
                      <button
                        onClick={() => selectLesson(lesson)}
                        disabled={!access}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
                          active ? 'bg-gold/10 text-gold' : 'text-cream/70 hover:bg-navy/5'
                        } ${!access ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        {!access ? (
                          <Lock size={16} className="shrink-0 text-cream/40" />
                        ) : isDone ? (
                          <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                        ) : active ? (
                          <PlayCircle size={16} className="shrink-0" />
                        ) : (
                          <Circle size={16} className="shrink-0 text-cream/30" />
                        )}
                        <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                        {lesson.is_preview && !hasEnrollment && !canAccessFree && (
                          <span className="shrink-0 text-[10px] uppercase text-gold">Amostra</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Marcar aula atual como concluída */}
      {selected && canAccess(selected) && (
        <button
          onClick={() => markComplete(selected)}
          disabled={done.has(selected.id) || saving === selected.id}
          className={`btn w-full ${done.has(selected.id) ? 'btn-ghost text-emerald-400' : 'btn-outline'}`}
        >
          {saving === selected.id ? (
            <><Loader2 size={16} className="animate-spin" /> Salvando…</>
          ) : done.has(selected.id) ? (
            <><CheckCircle2 size={16} /> Aula concluída</>
          ) : (
            <><Circle size={16} /> Marcar como concluída</>
          )}
        </button>
      )}
    </div>
  );
}
