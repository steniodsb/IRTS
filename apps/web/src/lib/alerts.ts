/** Rótulos e tons dos Alertas Inteligentes (tabela `alerts`). */

export const ALERT_CATEGORY_LABELS = {
  convencao: 'Convenção coletiva',
  decisao: 'Decisão judicial',
  legislacao: 'Legislação',
  prazo: 'Prazo',
  outro: 'Outro',
} as const;

export type AlertCategory = keyof typeof ALERT_CATEGORY_LABELS;

export const ALERT_CATEGORIES = Object.keys(ALERT_CATEGORY_LABELS) as AlertCategory[];

export const ALERT_SEVERITY_LABELS = {
  info: 'Informativo',
  atencao: 'Atenção',
  critico: 'Crítico',
} as const;

export type AlertSeverity = keyof typeof ALERT_SEVERITY_LABELS;

export const ALERT_SEVERITIES = Object.keys(ALERT_SEVERITY_LABELS) as AlertSeverity[];

/** Tom do <Badge/> para cada severidade. */
export const ALERT_SEVERITY_TONE: Record<AlertSeverity, 'default' | 'warning'> = {
  info: 'default',
  atencao: 'warning',
  critico: 'warning',
};

export function categoryLabel(value?: string | null) {
  if (!value) return null;
  return ALERT_CATEGORY_LABELS[value as AlertCategory] ?? value;
}

export function severityLabel(value?: string | null) {
  if (!value) return ALERT_SEVERITY_LABELS.info;
  return ALERT_SEVERITY_LABELS[value as AlertSeverity] ?? value;
}

export function severityTone(value?: string | null): 'default' | 'warning' {
  return ALERT_SEVERITY_TONE[value as AlertSeverity] ?? 'default';
}
