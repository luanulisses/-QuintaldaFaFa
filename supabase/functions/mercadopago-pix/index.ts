import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!MP_ACCESS_TOKEN) {
      throw new Error("MP_ACCESS_TOKEN não configurado. Adicione nas secrets do Supabase.");
    }

    const { customer_name, customer_email, customer_phone, items, total_amount } = await req.json();

    if (!customer_name || !customer_email || !customer_phone || total_amount <= 0) {
      throw new Error("Dados incompletos.");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Salvar compra como pendente
    const { data: purchase, error: pError } = await supabase
      .from("arraia_purchases")
      .insert([{
        customer_name,
        customer_email,
        customer_phone,
        total_amount,
        items,
        payment_method: "pix",
        payment_status: "pending"
      }])
      .select()
      .single();

    if (pError) throw pError;

    // 2. Criar pagamento PIX no Mercado Pago
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": purchase.id,
      },
      body: JSON.stringify({
        transaction_amount: Number(total_amount),
        description: `Arraiá Quintal da Fafá 2026 — ${customer_name}`,
        payment_method_id: "pix",
        date_of_expiration: expiresAt,
        external_reference: purchase.id,
        notification_url: `${SUPABASE_URL}/functions/v1/mercadopago-webhook`,
        payer: {
          email: customer_email,
          first_name: customer_name.split(" ")[0],
          last_name: customer_name.split(" ").slice(1).join(" ") || ".",
        }
      })
    });

    const payment = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("MP Error:", JSON.stringify(payment));
      throw new Error(payment.message || "Erro ao criar pagamento PIX no Mercado Pago");
    }

    const pixData = payment.point_of_interaction?.transaction_data;

    // 3. Salvar QR Code e expiration na compra
    await supabase
      .from("arraia_purchases")
      .update({
        payment_id: String(payment.id),
        pix_qr_code: pixData?.qr_code_base64 || null,
        pix_copy_paste: pixData?.qr_code || null,
        pix_expiration: expiresAt,
      })
      .eq("id", purchase.id);

    return new Response(JSON.stringify({
      purchase_id: purchase.id,
      payment_id: payment.id,
      qr_code_base64: pixData?.qr_code_base64,
      copy_paste: pixData?.qr_code,
      expires_at: expiresAt,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("PIX checkout error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
