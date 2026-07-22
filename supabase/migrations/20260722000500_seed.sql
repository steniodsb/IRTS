-- ==========================================================================
-- IRTS / NDA ACADEMY — Seed (dados de exemplo/estrutura inicial)
-- Idempotente. Ajuste/limpe antes de produção.
-- ==========================================================================

-- --- PLANOS ---------------------------------------------------------------
insert into public.plans (name, slug, description, price_cents, interval, highlight, sort_order, features) values
  ('Gratuito','gratuito','Acesso a conteúdos abertos e amostras.', 0, 'free', false, 0,
   '["Notícias trabalhistas","Amostras de aulas","Comunidade (leitura)"]'::jsonb),
  ('Mensal','mensal','Acesso completo à área de membros, cobrado mensalmente.', 9700, 'month', true, 1,
   '["Todos os cursos","Biblioteca completa","Consultor IA","Agenda e lives","Comunidade","Certificados"]'::jsonb),
  ('Anual','anual','Acesso completo com 2 meses de desconto no plano anual.', 97000, 'year', false, 2,
   '["Tudo do plano Mensal","2 meses grátis","Prioridade em mentorias"]'::jsonb)
on conflict (slug) do nothing;

-- --- CATEGORIAS DO FÓRUM ---------------------------------------------------
insert into public.forum_categories (name, slug, description, sort_order) values
  ('Apresente-se','apresente-se','Networking: conte quem você é e sua atuação.', 0),
  ('Dúvidas trabalhistas','duvidas-trabalhistas','Perguntas sobre relações de trabalho.', 1),
  ('Negociação sindical','negociacao-sindical','ACTs, CCTs e pautas sindicais.', 2),
  ('Feedback da plataforma','feedback','Sugestões e melhorias.', 3)
on conflict (slug) do nothing;

-- --- CONFIGURAÇÕES DO SITE / BIO -------------------------------------------
insert into public.site_settings (key, value) values
  ('brand', '{"name":"IRTS","full_name":"Inteligência em Relações Trabalhistas e Sindicais","tagline":"Formação e consultoria em relações trabalhistas e sindicais","primary":"#C9A227","bg":"#0A0A0A"}'::jsonb),
  ('contact', '{"email":"contato@irts.com.br","whatsapp":"","instagram":"","linkedin":""}'::jsonb),
  ('bio', '{"headline":"Sobre Newton dos Anjos","body":"Advogado especialista em relações trabalhistas e sindicais. [PENDENTE: biografia oficial fornecida pelo cliente]","photo_url":""}'::jsonb),
  ('home_hero', '{"title":"Domine as relações trabalhistas e sindicais","subtitle":"Cursos, biblioteca técnica, mentorias e um Consultor IA treinado no conteúdo do IRTS.","cta":"Comece agora"}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- --- INÍCIO: notícias / avisos / atualizações ------------------------------
insert into public.news (title, summary, source, published_at) values
  ('Bem-vindo à área de membros do IRTS','Conteúdo inicial de exemplo. Substitua pelas notícias reais.','IRTS', now())
on conflict do nothing;

insert into public.announcements (title, body, level) values
  ('Plataforma no ar','A área de membros está em fase de configuração. Em breve, todos os conteúdos.', 'info')
on conflict do nothing;

insert into public.platform_updates (version, title, body) values
  ('0.1.0','Estrutura inicial publicada','Web, iOS e Android compartilhando o mesmo back-end (Supabase).')
on conflict do nothing;

-- --- CURSO DE EXEMPLO ------------------------------------------------------
do $$
declare cid uuid; mid uuid;
begin
  insert into public.courses (title, slug, subtitle, description, instructor, category, level, is_free, published, sort_order)
  values ('Negociação Coletiva na Prática','negociacao-coletiva-pratica',
          'Da pauta ao acordo: conduzindo negociações sindicais',
          'Curso introdutório (conteúdo de exemplo). Substitua pelas aulas reais enviadas pelo cliente.',
          'Newton dos Anjos','Sindical','iniciante', true, true, 0)
  returning id into cid;

  insert into public.modules (course_id, title, sort_order) values (cid,'Fundamentos',0) returning id into mid;
  insert into public.lessons (module_id, course_id, title, video_provider, is_preview, published, sort_order, duration_seconds)
    values (mid, cid,'Boas-vindas e visão geral','external', true, true, 0, 300);
  insert into public.lessons (module_id, course_id, title, video_provider, published, sort_order, duration_seconds)
    values (mid, cid,'Anatomia de uma pauta sindical','external', true, 1, 600);

  insert into public.modules (course_id, title, sort_order) values (cid,'Na mesa de negociação',1) returning id into mid;
  insert into public.lessons (module_id, course_id, title, video_provider, published, sort_order, duration_seconds)
    values (mid, cid,'Banco de horas: como responder','external', true, 0, 720);
end $$;

-- --- BIBLIOTECA (exemplos por tipo) ----------------------------------------
insert into public.library_items (title, description, type, is_free, published, category) values
  ('Modelo de ACT comentado','Acordo Coletivo de Trabalho anotado (exemplo).','act', false, true,'Modelos'),
  ('Checklist de negociação sindical','Passo a passo antes de sentar à mesa.','checklist', true, true,'Checklists'),
  ('E-book: Introdução às CCTs','Convenções Coletivas explicadas (exemplo).','ebook', false, true,'E-books')
on conflict do nothing;

-- --- AGENDA (evento de exemplo) --------------------------------------------
insert into public.events (title, description, type, starts_at, location, published) values
  ('Live de abertura: o que vem por aí','Apresentação da plataforma e do cronograma de conteúdos.','live',
   now() + interval '7 days','Online (YouTube/Zoom)', true)
on conflict do nothing;

-- --- MENTORIA / LIVRO (catálogo público de exemplo) ------------------------
insert into public.mentorships (title, slug, description, format, price_cents, published) values
  ('Mentoria individual — Relações Sindicais','mentoria-individual',
   'Sessões 1:1 para casos reais de negociação (exemplo).','individual', 0, false)
on conflict (slug) do nothing;

insert into public.books (title, slug, author, description, price_cents, stock, published) values
  ('Relações Trabalhistas e Sindicais — Guia Prático','guia-pratico-rts','Newton dos Anjos',
   'Livro físico (exemplo) enviado pelos Correios.', 8900, 0, false)
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- PÓS-DEPLOY: promova seu usuário a owner rodando (troque o e-mail):
--   update public.profiles set role='owner'
--   where id = (select id from auth.users where email='newton@exemplo.com.br');
-- --------------------------------------------------------------------------
