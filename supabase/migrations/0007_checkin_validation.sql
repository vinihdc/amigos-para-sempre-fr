-- Migration 0007: Fase 2 — validação de check-in no banco
--
-- MOTIVO: a Fase 2 adiciona o botão CHEGUEI. A regra de negócio definida
-- com você é "só quem confirmou VOU ou TALVEZ pode fazer check-in". A
-- janela de horário (1h antes do jogo) é decisão de UX pura — fica só na
-- tela, sem trava no banco, pra não introduzir fragilidade de fuso
-- horário numa regra que não é de segurança. Já a exigência de
-- VOU/TALVEZ protege a integridade da fila de rodízio (Fase 3), então
-- vale ter também no banco (Seção 10 — frontend nunca é a única camada).

create or replace function validate_checkin_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conf_status confirmation_status;
begin
  -- só valida no momento em que checked_in_at está sendo definido
  -- (de null para um valor) — edições de outros campos não disparam isso.
  if new.checked_in_at is not null and (tg_op = 'INSERT' or old.checked_in_at is null) then
    select status into conf_status
    from game_confirmations
    where game_id = new.game_id and player_id = new.player_id;

    if conf_status is null or conf_status not in ('VOU', 'TALVEZ') then
      raise exception 'Só é possível fazer check-in com confirmação VOU ou TALVEZ.';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_validate_checkin_status
  before insert or update on session_participation
  for each row execute function validate_checkin_status();
