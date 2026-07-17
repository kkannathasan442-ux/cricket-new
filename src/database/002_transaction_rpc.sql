-- ============================================================================
-- CrickPulse — Transaction RPC (Phase 8)
-- ============================================================================
-- Atomic multi-step writes used by the scoring engine as the production path
-- (see src/features/scoring/transaction.ts). Runs as SECURITY DEFINER with the
-- service role. Falls back gracefully to sequential writes if unavailable.
--
-- `steps` is a JSON array of:
--   { table, op: 'insert'|'update'|'upsert', values: {...}, onConflict? }
-- For 'update'/'upsert' steps, `values` MUST include the primary key `id`
-- used to target the row.
-- ============================================================================

create or replace function public.crickpulse_transaction(steps jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  step jsonb;
  tbl text;
  op text;
  vals jsonb;
  on_conflict text;
  pk_val uuid;
begin
  if steps is null or jsonb_array_length(steps) = 0 then
    return;
  end if;

  foreach step in select * from jsonb_array_elements(steps)
  loop
    tbl := step ->> 'table';
    op := step ->> 'op';
    vals := step -> 'values';
    on_conflict := step ->> 'onConflict';

    if op = 'insert' then
      execute format('insert into public.%I select * from jsonb_populate_record(null::public.%I, $1)', tbl, tbl)
      using vals;
    elsif op = 'upsert' then
      pk_val := (vals ->> 'id')::uuid;
      if exists (select 1 from information_schema.columns where table_name = tbl) then
        execute format(
          'insert into public.%I select * from jsonb_populate_record(null::public.%I, $1)
           on conflict (%I) do update set %s',
          tbl, tbl,
          coalesce(on_conflict, 'id'),
          (
            select string_agg(format('%I = excluded.%I', column_name, column_name), ', ')
            from information_schema.columns c
            where c.table_schema = 'public' and c.table_name = tbl
              and c.column_name <> coalesce(on_conflict, 'id')
          )
        ) using vals;
      end if;
    elsif op = 'update' then
      pk_val := (vals ->> 'id')::uuid;
      execute format(
        'update public.%I set %s where id = $1',
        tbl,
        (
          select string_agg(format('%I = $2->>%L', column_name, column_name), ', ')
          from information_schema.columns c
          where c.table_schema = 'public' and c.table_name = tbl
            and c.column_name <> 'id'
        )
      ) using pk_val, vals;
    else
      raise exception 'Unsupported op: %', op;
    end if;
  end loop;
end;
$$;

grant execute on function public.crickpulse_transaction(jsonb) to service_role;
