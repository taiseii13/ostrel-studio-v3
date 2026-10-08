-- =========================================================
-- BASE DE DONNÉES — à coller UNE FOIS dans Supabase :
-- Supabase > SQL Editor > New query > coller tout > Run
-- =========================================================

-- 1. Profils clients (crédits + formule)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  first_name text,
  credits integer not null default 1,   -- crédits offerts à l'inscription
  plan text not null default 'Gratuit',
  created_at timestamptz not null default now()
);

-- 2. Générations (historique)
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  mode text not null,
  prompt text not null,
  input_urls text[],
  cost integer not null,
  status text not null default 'pending',  -- pending / success / failed
  task_id text,
  result_url text,
  error text,
  created_at timestamptz not null default now()
);

-- 3. Paiements Whop reçus (évite de créditer deux fois)
create table if not exists public.payments (
  id text primary key,
  user_id uuid references auth.users on delete set null,
  email text,
  plan text,
  credits integer,
  created_at timestamptz not null default now()
);

-- 4. Sécurité : chaque client ne voit QUE ses données, et ne peut rien modifier lui-même
alter table public.profiles enable row level security;
alter table public.generations enable row level security;
alter table public.payments enable row level security;

drop policy if exists "voir son profil" on public.profiles;
create policy "voir son profil" on public.profiles for select using (auth.uid() = id);
drop policy if exists "voir ses generations" on public.generations;
create policy "voir ses generations" on public.generations for select using (auth.uid() = user_id);

-- 5. Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name)
  values (new.id, lower(new.email), new.raw_user_meta_data->>'first_name');
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Retirer / ajouter des crédits (utilisé uniquement par le serveur)
create or replace function public.spend_credits(p_user uuid, p_amount int)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set credits = credits - p_amount
  where id = p_user and credits >= p_amount;
  return found;
end; $$;

create or replace function public.add_credits(p_user uuid, p_amount int)
returns void language sql security definer set search_path = public as $$
  update public.profiles set credits = credits + p_amount where id = p_user;
$$;

revoke execute on function public.spend_credits(uuid, int) from public, anon, authenticated;
revoke execute on function public.add_credits(uuid, int) from public, anon, authenticated;

-- 7. Stockage des photos envoyées par les clients
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

drop policy if exists "envoyer ses photos" on storage.objects;
create policy "envoyer ses photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
