'use client';
import { Printer } from 'lucide-react';

export function PrintButton({ label = 'Imprimir / Salvar PDF' }: { label?: string }) {
  return (
    <button onClick={() => window.print()} className="btn-gold no-print">
      <Printer size={16} /> {label}
    </button>
  );
}
