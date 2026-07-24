import Link from 'next/link';
import { BellRing, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge, EmptyState } from '@/components/ui';
import { MarkAlertRead, MarkAllAlertsRead } from '@/components/MarkAlertRead';
import { formatDate } from '@irts/shared';
import {
  ALERT_CATEGORIES, ALERT_CATEGORY_LABELS, categoryLabel, severityLabel, severityTone,
  type AlertCategory,
} from '@/lib/alerts';

export const metadata = { title: 'Alertas Inteligentes' };

export default async function AlertasPage({
  searchParams,
}: {
  searchParams: { cat?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const cat = ALERT_CATEGORIES.includes(searchParams.cat as AlertCategory)
    ? (searchParams.cat as AlertCategory)
    : null;

  let query = supabase
    .from('alerts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(50);
  if (cat) query = query.eq('category', cat);

  const [{ data: alerts }, { data: reads }] = await Promise.all([
    query,
    supabase.from('alert_reads').select('alert_id').eq('user_id', user!.id),
  ]);

  const list = (alerts ?? []) as any[];
  const readIds = new Set((reads ?? []).map((r: any) => r.alert_id));
  const unreadIds = list.filter((a) => !readIds.has(a.id)).map((a) => a.id);

  const chipCls = (active: boolean) =>
    `chip transition ${active ? 'border-gold/60 text-gold' : 'hover:border-gold/40 hover:text-cream'}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-3xl text-cream">
          <BellRing size={26} className="text-gold" /> Alertas Inteligentes
        </h1>
        <p className="mt-1 text-cream/50">
          Convenções coletivas, decisões judiciais, mudanças na legislação e prazos que impactam a sua negociação.
        </p>
      </div>

      {/* Filtros por categoria */}
      <div className="flex flex-wrap gap-2">
        <Link href="/app/alertas" className={chipCls(!cat)}>Todos</Link>
        {ALERT_CATEGORIES.map((c) => (
          <Link key={c} href={`/app/alertas?cat=${c}`} className={chipCls(cat === c)}>
            {ALERT_CATEGORY_LABELS[c]}
          </Link>
        ))}
      </div>

      {list.length > 0 ? (
        <div className="space-y-4">
          {unreadIds.length > 0 && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-cream/50">
                {unreadIds.length === 1 ? '1 alerta não lido' : `${unreadIds.length} alertas não lidos`}
              </p>
              <MarkAllAlertsRead alertIds={unreadIds} userId={user!.id} />
            </div>
          )}

          {list.map((a) => {
            const isRead = readIds.has(a.id);
            return (
              <Card key={a.id} className={isRead ? 'opacity-70' : 'border-gold/40'}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge tone={severityTone(a.severity)}>{severityLabel(a.severity)}</Badge>
                      {a.category && <span className="chip">{categoryLabel(a.category)}</span>}
                      {!isRead && <span className="text-xs text-gold">Novo</span>}
                    </div>

                    <p className="font-medium text-cream">{a.title}</p>
                    {a.body && <p className="mt-1 whitespace-pre-line text-sm text-cream/60">{a.body}</p>}

                    <p className="mt-2 text-xs text-cream/40">
                      {formatDate(a.published_at)}
                      {a.source ? ` · ${a.source}` : ''}
                    </p>

                    {a.url && (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-sm text-gold hover:underline"
                      >
                        Abrir fonte <ExternalLink size={13} />
                      </a>
                    )}
                  </div>

                  {!isRead && <MarkAlertRead alertId={a.id} userId={user!.id} />}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Nenhum alerta por aqui"
          description={
            cat
              ? 'Não há alertas nesta categoria por enquanto. Tente outro filtro.'
              : 'Ainda não há alertas publicados. Assim que houver novidades sobre convenções, decisões, legislação ou prazos, elas aparecerão aqui.'
          }
        />
      )}
    </div>
  );
}
