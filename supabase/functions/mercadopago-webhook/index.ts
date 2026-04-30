import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Resend } from "https://esm.sh/resend@3.1.0";

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN");       // Meta Cloud API token
const WHATSAPP_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID"); // Meta phone number ID
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Formata número da lista: ARRAIA-001
function formatListNumber(seq: number): string {
  return `ARRAIA-${String(seq).padStart(3, "0")}`;
}

// Formata itens do ingresso para texto legível
function formatItems(items: Record<string, number>): string {
  const labels: Record<string, string> = {
    geral: "Ingresso Geral",
    meia: "Meia-Entrada (6-12 anos)",
    passaporte: "Passaporte Kids",
    combo: "Combo (Geral + Kids + Meia)",
    pescaria: "Pescaria",
    brinquedos: "Brinquedo Individual",
  };
  return Object.entries(items)
    .filter(([, qty]) => qty > 0)
    .map(([type, qty]) => `${qty}x ${labels[type] || type}`)
    .join(", ");
}

// Envia mensagem via WhatsApp Cloud API (Meta)
async function sendWhatsApp(to: string, message: string) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) return;

  const phone = to.replace(/\D/g, ""); // remove non-digits
  const phoneE164 = phone.startsWith("55") ? phone : `55${phone}`;

  await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phoneE164,
      type: "text",
      text: { body: message },
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, data, type } = body;

    // Aceita notificações do MP (formato antigo e novo)
    const paymentId = data?.id || body.data?.id;
    const isPaymentEvent =
      action === "payment.created" ||
      action === "payment.updated" ||
      type === "payment";

    if (!isPaymentEvent || !paymentId) {
      return new Response("ok", { headers: corsHeaders });
    }

    // 1. Buscar detalhes do pagamento no MP
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const payment = await mpResponse.json();

    if (payment.status !== "approved") {
      return new Response("not approved yet", { headers: corsHeaders });
    }

    const purchaseId = payment.external_reference;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. Verificar se já foi processado
    const { data: purchase, error: pError } = await supabase
      .from("arraia_purchases")
      .select("*")
      .eq("id", purchaseId)
      .single();

    if (pError || !purchase) throw new Error("Compra não encontrada: " + purchaseId);
    if (purchase.payment_status === "approved") {
      return new Response("Already processed", { headers: corsHeaders });
    }

    // 3. Gerar número único da lista (ARRAIA-XXX)
    const { data: seqData } = await supabase.rpc("generate_list_number");
    const listNumber = seqData || formatListNumber(Math.floor(Math.random() * 999) + 1);

    // 4. Atualizar status e número da lista
    await supabase
      .from("arraia_purchases")
      .update({
        payment_status: "approved",
        payment_id: String(payment.id),
        list_number: listNumber,
      })
      .eq("id", purchaseId);

    const itemsText = formatItems(purchase.items || {});
    const totalFormatted = `R$ ${Number(purchase.total_amount).toFixed(2).replace(".", ",")}`;

    // 5. Enviar E-mail de confirmação
    if (RESEND_API_KEY) {
      const resend = new Resend(RESEND_API_KEY);
      await resend.emails.send({
        from: "Quintal da Fafá <pix@quintaldafafa.com.br>",
        to: purchase.customer_email,
        subject: `🎫 Ingresso Confirmado! Seu número: ${listNumber}`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Georgia, serif; background: #FDF6EC; padding: 0; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <div style="background: #5C2E0A; padding: 40px 32px; text-align: center;">
                <p style="color: #D9981F; font-size: 12px; letter-spacing: 3px; margin: 0 0 8px 0; text-transform: uppercase;">🌽 Arraiá do Quintal da Fafá 2026 🌽</p>
                <h1 style="color: #EDD68A; font-size: 32px; margin: 0;">Pagamento Confirmado!</h1>
                <p style="color: #EDD68A; opacity: 0.7; margin: 8px 0 0 0;">06 de junho de 2026 · Planaltina-DF</p>
              </div>

              <!-- Número da Lista — DESTAQUE -->
              <div style="background: #D9981F; padding: 32px; text-align: center;">
                <p style="color: #1C0C04; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 8px 0;">Seu número na lista</p>
                <h2 style="color: #1C0C04; font-size: 48px; font-weight: 900; margin: 0; letter-spacing: 4px;">${listNumber}</h2>
                <p style="color: #1C0C04; font-size: 13px; margin: 12px 0 0 0; opacity: 0.8;">Guarde este número — você vai precisar na portaria!</p>
              </div>

              <!-- Detalhes -->
              <div style="padding: 32px;">
                <h3 style="color: #5C2E0A; margin: 0 0 16px 0;">Resumo do pedido</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #f0e0c0; padding: 8px 0;">
                    <td style="padding: 8px 0; color: #7a5235; font-size: 14px;">Nome</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #1C0C04; text-align: right;">${purchase.customer_name}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f0e0c0;">
                    <td style="padding: 8px 0; color: #7a5235; font-size: 14px;">Ingressos</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #1C0C04; text-align: right;">${itemsText}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #7a5235; font-size: 14px;">Total pago</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #D9981F; font-size: 18px; text-align: right;">${totalFormatted}</td>
                  </tr>
                </table>
              </div>

              <!-- Instrução portaria -->
              <div style="background: #FDF6EC; border: 2px solid #EDD68A; border-radius: 12px; margin: 0 32px 32px 32px; padding: 20px;">
                <p style="color: #5C2E0A; font-weight: bold; margin: 0 0 8px 0;">📋 Como funciona na portaria?</p>
                <p style="color: #7a5235; margin: 0; font-size: 14px; line-height: 1.6;">
                  No dia 06/06, chegue na portaria e informe:<br>
                  <strong>Seu número (${listNumber}) + seu nome</strong><br>
                  Pronto! Entrada liberada. 🎉
                </p>
              </div>

              <!-- Políticas — IMPORTANTE -->
              <div style="margin: 0 32px 32px 32px; padding: 20px; border: 1px solid #f0e0c0; border-radius: 12px; background: #fff;">
                <p style="color: #5C2E0A; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">⚠️ Regras de Reembolso e Transferência</p>
                <ul style="color: #7a5235; font-size: 11px; margin: 0; padding: 0 0 0 16px; line-height: 1.6;">
                  <li><strong>Cancelamentos:</strong> Aceitos até 7 dias antes (até 30/05).</li>
                  <li><strong>Troca de Titularidade:</strong> Disponível via WhatsApp com taxa de R$ 5,00.</li>
                  <li><strong>Pós-Prazo:</strong> Após o dia 30/05, não há devolução ou cancelamento.</li>
                </ul>
              </div>

              <!-- Data e Local -->
              <div style="padding: 0 32px 32px 32px; text-align: center;">
                <p style="color: #A84B18; font-size: 13px;">📍 Setor de Chácaras, Planaltina-DF · ⏰ Abertura às 19h30 · 🎶 Show às 20h</p>
                <p style="color: #7a5235; font-size: 12px; margin-top: 24px;">Dúvidas? WhatsApp: <a href="https://wa.me/5561996351010" style="color: #D9981F;">(61) 99635-1010</a></p>
              </div>

            </div>
          </body>
          </html>
        `,
      });
    }

    // 6. Enviar WhatsApp de confirmação
    const whatsMessage = `🌽 *Arraiá do Quintal da Fafá 2026* 🌽\n\nOlá, ${purchase.customer_name}! Seu pagamento foi confirmado! ✅\n\n🎫 *Seu número na lista:*\n*${listNumber}*\n\n📋 *Ingressos:* ${itemsText}\n💰 *Total pago:* ${totalFormatted}\n\n📍 06/06 · Planaltina-DF · Portaria abre 19h30\n\n*Na portaria, informe: ${listNumber} + seu nome*\n\n⚠️ *IMPORTANTE:* Cancelamentos até 30/05. Troca de titularidade via WhatsApp com taxa de R$ 5,00. Após o prazo, não há reembolso.\n\nQualquer dúvida: (61) 99635-1010 🤠`;

    await sendWhatsApp(purchase.customer_phone, whatsMessage);

    return new Response(JSON.stringify({ success: true, list_number: listNumber }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Webhook error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
