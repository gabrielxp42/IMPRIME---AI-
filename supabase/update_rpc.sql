-- ATUALIZAR FUNÇÃO PARA ACEITAR WEBHOOK
-- Rode isso no SQL Editor do Supabase

CREATE OR REPLACE FUNCTION process_payment(p_plan_id INT, p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Permite rodar com permissões de admin
AS $$
DECLARE
  v_credits INT;
  v_plan_name TEXT;
  v_target_user UUID;
BEGIN
  -- Se p_user_id for passado (pelo webhook), usa ele. Se não, usa o usuário logado via auth.uid()
  v_target_user := COALESCE(p_user_id, auth.uid());

  IF v_target_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Definir créditos baseados no plano
  IF p_plan_id = 2 THEN
    v_credits := 500;
    v_plan_name := 'Profissional DTF';
  ELSIF p_plan_id = 3 THEN
    v_credits := 2000;
    v_plan_name := 'DTF Expert';
  ELSE
    v_credits := 0;
    v_plan_name := 'Unknown';
  END IF;

  -- Atualizar Créditos do Usuário
  UPDATE profiles
  SET credits = credits + v_credits
  WHERE id = v_target_user;

  -- Atualizar ou Criar Assinatura
  INSERT INTO subscriptions (user_id, plan_id, status, current_period_end)
  VALUES (v_target_user, p_plan_id, 'active', NOW() + INTERVAL '1 month')
  ON CONFLICT (user_id)
  DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = 'active',
    current_period_end = NOW() + INTERVAL '1 month';

  RETURN jsonb_build_object(
    'success', true,
    'plan', v_plan_name,
    'credits_added', v_credits
  );
END;
$$;
