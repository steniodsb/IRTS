import { Card, EmptyState } from '@/components/ui';
import { RoleSelect } from '@/components/admin/RoleSelect';
import { createClient } from '@/lib/supabase/server';
import { formatDate, initials } from '@irts/shared';

export const metadata = { title: 'Usuários' };

export default async function AdminUsuariosPage() {
  const supabase = createClient();
  const { data: profiles } = await supabase
    .from('profiles').select('id, full_name, avatar_url, role, created_at').order('created_at', { ascending: false });

  const list = (profiles ?? []) as any[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-cream">Usuários</h1>
        <p className="mt-1 text-cream/50">Gerencie os perfis e permissões de acesso.</p>
      </div>

      {list.length > 0 ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-line/60 text-left text-cream/50">
              <tr>
                <th className="px-5 py-3 font-medium">Usuário</th>
                <th className="px-5 py-3 font-medium">Cadastro</th>
                <th className="px-5 py-3 font-medium">Papel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {list.map((p) => (
                <tr key={p.id} className="text-cream/80">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {p.avatar_url
                        ? // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                        : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/20 text-xs font-semibold text-gold">{initials(p.full_name)}</span>}
                      <span className="font-medium text-cream">{p.full_name ?? 'Sem nome'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-cream/50">{formatDate(p.created_at)}</td>
                  <td className="px-5 py-3"><RoleSelect userId={p.id} role={p.role} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState title="Nenhum usuário" description="Os perfis cadastrados aparecerão aqui." />
      )}
    </div>
  );
}
