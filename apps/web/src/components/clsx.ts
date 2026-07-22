/** Utilitário mínimo para juntar classes condicionalmente. */
export function clsx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
