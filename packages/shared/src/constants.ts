import type { LibraryType, EventType } from './types';

/** Menus da área de membros (ordem oficial do escopo/contrato). */
export const MEMBER_MENUS = [
  { key: 'inicio',     label: 'Início',       icon: 'home',       route: '/app' },
  { key: 'cursos',     label: 'Meus Cursos',  icon: 'graduation', route: '/app/cursos' },
  { key: 'biblioteca', label: 'Biblioteca',   icon: 'book',       route: '/app/biblioteca' },
  { key: 'ia',         label: 'Consultor IA', icon: 'robot',      route: '/app/consultor-ia' },
  { key: 'agenda',     label: 'Agenda',       icon: 'calendar',   route: '/app/agenda' },
  { key: 'comunidade', label: 'Comunidade',   icon: 'users',      route: '/app/comunidade' },
  { key: 'conta',      label: 'Minha Conta',  icon: 'user',       route: '/app/conta' },
] as const;

export const LIBRARY_TYPE_LABELS: Record<LibraryType, string> = {
  ebook: 'E-book',
  modelo: 'Modelo',
  checklist: 'Checklist',
  act: 'ACT',
  cct: 'CCT',
  politica: 'Política',
  jurisprudencia: 'Jurisprudência comentada',
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  mentoria: 'Mentoria',
  live: 'Live',
  evento: 'Evento',
  webinar: 'Webinar',
};

export const PLAN_SLUGS = { free: 'gratuito', monthly: 'mensal', yearly: 'anual' } as const;
