import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';
import { Loading } from '@/components';

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) return <Loading label="Carregando..." />;
  return <Redirect href={session ? '/(tabs)' : '/(auth)/login'} />;
}
