'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const ROLES = [
  { value: 'student', label: 'Aluno' },
  { value: 'admin', label: 'Admin' },
  { value: 'owner', label: 'Dono' },
];

export function RoleSelect({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [value, setValue] = useState(role);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(false);

  async function change(next: string) {
    const prev = value;
    setValue(next); setSaving(true); setErr(false);
    const { error } = await supabase.from('profiles').update({ role: next }).eq('id', userId);
    setSaving(false);
    if (error) { setValue(prev); setErr(true); return; }
    router.refresh();
  }

  return (
    <select
      className={`input max-w-36 py-1.5 ${err ? 'border-red-500/60' : ''}`}
      value={value}
      disabled={saving}
      onChange={(e) => change(e.target.value)}
    >
      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
    </select>
  );
}
