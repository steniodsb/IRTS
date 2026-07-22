import { Suspense } from 'react';
import { AuthForm } from '@/components/AuthForm';
export const metadata = { title: 'Recuperar senha' };
export default function ResetPage() {
  return <Suspense><AuthForm mode="reset" /></Suspense>;
}
