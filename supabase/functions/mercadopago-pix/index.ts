import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Resend } from "https://esm.sh/resend@3.1.0";
import { eventConfig } from "../_shared/eventConfig.ts";
import { BACKEND_TICKET_CONFIG } from "../_shared/ticketConfig.ts";

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function validateAndCalculateTotal(items: any, totalAmount: number): number {
  if (!items || typeof items !== "object" || Array.isArray(items)) {
    throw new Error("Formato de itens inválido.");
  }

  let calculatedTotalInCents = 0;
  let hasItems = false;

  for (const [key, val] of Object.entries(items)) {
    if (!(key in BACKEND_TICKET_CONFIG.prices)) {
      throw new Error(`Tipo de item desconhecido: ${key}`);
    }

    const qty = val;

    if (typeof qty !== "number" || isNaN(qty) || !Number.isInteger(qty) || qty < 0) {
      throw new Error(`Quantidade inválida para ${key}: deve ser um inteiro maior ou igual a zero.`);
    }

    if (qty > BACKEND_TICKET_CONFIG.maxQuantityPerItem) {
      throw new Error(`Quantidade para ${key} excede o limite máximo permitido de ${BACKEND_TICKET_CONFIG.maxQuantityPerItem}.`);
    }

    if (qty > 0) {
      hasItems = true;
      calculatedTotalInCents += qty * BACKEND_TICKET_CONFIG.prices[key];
    }
  }

  if (!hasItems) {
    throw new Error("Selecione pelo menos um ingresso.");
  }

  const clientTotalInCents = Math.round(totalAmount * 100);
  if (calculatedTotalInCents !== clientTotalInCents) {
    throw new Error("Preço divergente detectado.");
  }

  return calculatedTotalInCents / 100;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!MP_ACCESS_TOKEN) {
      throw new Error("MP_ACCESS_TOKEN não configurado. Adicione nas secrets do Supabase.");
    }

    const { customer_name, customer_email, customer_phone, items, total_amount } = await req.json();

    if (!customer_name || !customer_email || !customer_phone) {
      throw new Error("Dados incompletos.");
    }

    // Validação estrita e recálculo
    const verifiedTotal = validateAndCalculateTotal(items, total_amount);

    // Filtrar items para persistir apenas os válidos e maiores que zero
    const cleanedItems: Record<string, number> = {};
    for (const [key, val] of Object.entries(items)) {
      const qty = val as number;
      if (qty > 0) {
        cleanedItems[key] = qty;
      }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Salvar compra como pendente
    const { data: purchase, error: pError } = await supabase
      .from("arraia_purchases")
      .insert([{
        customer_name,
        customer_email,
        customer_phone,
        total_amount: verifiedTotal,
        items: cleanedItems,
        payment_method: "pix",
        payment_status: "pending"
      }])
      .select()
      .single();

    if (pError) throw pError;

    // 2. Criar pagamento PIX no Mercado Pago
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

    // Map items to match descriptions and unit prices for Mercado Pago
    const mpItemsLabels: Record<string, string> = {
      geral: "Ingresso Geral — 3º Lote",
      meia: "Meia-entrada — 3º Lote",
      passaporte: "Passaporte Kids — Preço Único",
      pescaria: "Ficha Pescaria",
      brinquedos: "Brinquedo Individual",
    };

    const mpItemsList = Object.entries(cleanedItems).map(([key, val]) => {
      const unitPriceInCents = BACKEND_TICKET_CONFIG.prices[key];
      return {
        id: key,
        title: mpItemsLabels[key] || key,
        description: mpItemsLabels[key] || key,
        category_id: "ticket",
        quantity: val,
        unit_price: unitPriceInCents / 100,
      };
    });

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": purchase.id,
      },
      body: JSON.stringify({
        transaction_amount: Number(verifiedTotal),
        description: `${eventConfig.title} ${eventConfig.edition} — ${customer_name}`,
        payment_method_id: "pix",
        date_of_expiration: expiresAt,
        external_reference: purchase.id,
        notification_url: `${SUPABASE_URL}/functions/v1/mercadopago-webhook`,
        payer: {
          email: customer_email,
          first_name: customer_name.split(" ")[0],
          last_name: customer_name.split(" ").slice(1).join(" ") || ".",
        },
        additional_info: {
          items: mpItemsList
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

    // 4. Enviar E-mail de PIX Gerado
    if (RESEND_API_KEY) {
      try {
        const resend = new Resend(RESEND_API_KEY);
        const totalMod = Number(verifiedTotal).toFixed(2).replace(".", ",");
        
        await resend.emails.send({
          from: "Quintal da Fafá <pix@quintaldafafa.com.br>",
          to: customer_email,
          subject: "Seu PIX foi gerado 🎉",
          html: `
            <!DOCTYPE html>
            <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; padding: 20px 0; margin: 0;">
              <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #1B0038 0%, #32005A 50%, #4A1270 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2); border: 2px solid #F4D35E;">
                <div style="padding: 40px 32px; text-align: center;">
                  <h2 style="color: #F4D35E; font-size: 24px; font-weight: 900; margin-bottom: 10px;">Olá, ${customer_name.split(" ")[0]}!</h2>
                  <p style="color: rgba(255,255,255,0.9); font-size: 16px;">Seu pedido para o <strong>${eventConfig.title} ${eventConfig.edition}</strong> foi recebido.</p>
                  
                  <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; margin: 30px 0; border: 1px solid rgba(244,211,94,0.3);">
                    <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.7); text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Valor do PIX:</p>
                    <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: 900; color: #F4D35E;">R$ ${totalMod}</p>
                  </div>
                  
                  <p style="margin-top: 24px; font-weight: 900; color: #F4D35E; text-transform: uppercase; letter-spacing: 1px;">Código PIX Copia e Cola:</p>
                  <div style="background: white; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 12px; word-break: break-all; border: 2px solid #F4D35E; color: #1B0038; font-weight: bold;">
                    ${pixData?.qr_code || "Acesse o site para copiar o código"}
                  </div>
                  
                  <p style="font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 20px;">O pagamento expira em 30 minutos. Após pagar, a confirmação é automática.</p>
                  
                  <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 30px; padding-top: 20px;">
                    <p style="font-size: 12px; color: rgba(255,255,255,0.5);">Quintal da Fafá — ${eventConfig.city}</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `
        });
      } catch (err) {
        console.error("Resend error:", err.message);
      }
    }

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
