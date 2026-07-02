import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Resend } from "https://esm.sh/resend@3.1.0";
import { eventConfig } from "../_shared/eventConfig.ts";
import { generateAndUploadQR } from "../_shared/qrUploader.ts";

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
    const qrCodeUrl = await generateAndUploadQR(listNumber);

    // 5. Enviar E-mail de confirmação
    try {
      if (RESEND_API_KEY) {
        const resend = new Resend(RESEND_API_KEY);
        await resend.emails.send({
          from: "Quintal da Fafá <pix@quintaldafafa.com.br>",
          to: purchase.customer_email,
          subject: `🎫 Ingresso Confirmado! Seu número: ${listNumber}`,
          html: `
            <!DOCTYPE html>
            <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; padding: 20px 0; margin: 0;">
              <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #1B0038 0%, #32005A 50%, #4A1270 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2); border: 2px solid #F4D35E;">
                
                <!-- Header -->
                <div style="padding: 40px 32px; text-align: center;">
                  <div style="font-size: 32px; margin-bottom: 10px;">🌽</div>
                  <h3 style="color: #F4D35E; font-size: 20px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 0;">${eventConfig.title}</h3>
                  <div style="margin-top: 10px;">
                    <span style="background: #F4D35E; color: #1B0038; font-size: 11px; font-weight: 900; padding: 4px 8px; border-radius: 4px; letter-spacing: 1px; text-transform: uppercase;">🏷️ ${eventConfig.edition}</span>
                  </div>
                  <h1 style="color: #FFFFFF; font-size: 28px; margin: 20px 0 10px 0; font-weight: 900;">Pagamento Confirmado!</h1>
                  
                  <div style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600; margin-top: 15px;">
                    <span style="margin: 0 5px;">📅 ${eventConfig.date}</span><br/>
                    <span style="margin: 0 5px;">📍 ${eventConfig.city}</span>
                  </div>
                  <div style="color: #F4D35E; font-size: 12px; font-weight: bold; margin-top: 15px;">
                    ${eventConfig.attractions.map(a => "🎵 " + a).join(' • ')}
                  </div>
                </div>

                <!-- Dotted separator -->
                <div style="border-top: 2px dashed rgba(255,255,255,0.2); margin: 0 20px;"></div>

                <!-- Número da Lista -->
                <div style="padding: 30px; text-align: center;">
                  <p style="color: #F4D35E; font-size: 12px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 10px 0;">Número da Lista</p>
                  <h2 style="color: #F4D35E; font-size: 42px; font-weight: 900; margin: 0; letter-spacing: 4px;">${listNumber}</h2>
                  <p style="color: rgba(255,255,255,0.8); font-size: 14px; font-weight: 500; margin: 15px 0 0 0;">Na portaria, apresente este número ou o QR Code abaixo!</p>
                </div>

                <!-- Ingresso Digital Premium QR Code -->
                <div style="text-align:center; margin: 0 32px 30px 32px; padding: 24px; background: white; border-radius: 16px; border: 4px solid #F4D35E; box-shadow: 0 10px 15px rgba(0,0,0,0.2);">
                  <img src="${qrCodeUrl}" alt="QR Code do ingresso ${listNumber}" style="width:200px; height:200px; display:block; margin: 0 auto;" />
                  <p style="font-weight: 900; color: #1B0038; margin: 15px 0 0 0; font-size: 18px;">${listNumber}</p>
                  <p style="color: #666; font-size: 12px; margin: 5px 0 0 0;">Apresente este QR Code na entrada</p>
                </div>

                <!-- Detalhes -->
                <div style="padding: 0 32px 20px 32px;">
                  <table style="width: 100%; border-collapse: collapse; color: white;">
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                      <td style="padding: 12px 0; font-size: 13px; color: rgba(255,255,255,0.7); text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Comprador</td>
                      <td style="padding: 12px 0; font-weight: 900; font-size: 16px; text-align: right;">${purchase.customer_name}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                      <td style="padding: 12px 0; font-size: 13px; color: rgba(255,255,255,0.7); text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Ingressos</td>
                      <td style="padding: 12px 0; font-weight: bold; font-size: 14px; text-align: right;">${itemsText}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; font-size: 13px; color: rgba(255,255,255,0.7); text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Total pago</td>
                      <td style="padding: 12px 0; font-weight: 900; color: #F4D35E; font-size: 18px; text-align: right;">${totalFormatted}</td>
                    </tr>
                  </table>
                </div>

                <!-- Políticas — IMPORTANTE -->
                <div style="margin: 0 32px 32px 32px; padding: 20px; border: 1px solid rgba(244,211,94,0.3); border-radius: 12px; background: rgba(0,0,0,0.2);">
                  <p style="color: #F4D35E; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">⚠️ Regras de Reembolso e Transferência</p>
                  <ul style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 0; padding: 0 0 0 16px; line-height: 1.6;">
                    <li style="margin-bottom: 4px;"><strong>Cancelamentos:</strong> Aceitos até ${eventConfig.cancellationDeadline}.</li>
                    <li style="margin-bottom: 4px;"><strong>Troca de Titularidade:</strong> Disponível via WhatsApp com taxa de R$ 5,00.</li>
                    <li><strong>Pós-Prazo:</strong> Após o dia ${eventConfig.cancellationDeadline}, não há devolução ou cancelamento.</li>
                  </ul>
                </div>

                <!-- Data e Local -->
                <div style="padding: 0 32px 32px 32px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 10px; padding-top: 20px;">
                  <p style="color: #F4D35E; font-size: 13px; font-weight: bold;">📍 ${eventConfig.city} · ⏰ Abertura às ${eventConfig.doorOpeningTime} · 🎶 Show às ${eventConfig.showTime}</p>
                  <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 15px;">Dúvidas? WhatsApp: <a href="${eventConfig.whatsappLink}" style="color: #F4D35E; text-decoration: none; font-weight: bold;">${eventConfig.whatsapp}</a></p>
                </div>

              </div>
            </body>
            </html>
          `,
        });
      }

      // 6. Enviar WhatsApp de confirmação
      const whatsMessage = `🌽 *${eventConfig.title} ${eventConfig.edition}* 🌽\n\nOlá, ${purchase.customer_name}! Seu pagamento foi confirmado! ✅\n\n🎫 *Seu número na lista:*\n*${listNumber}*\n\n📋 *Ingressos:* ${itemsText}\n💰 *Total pago:* ${totalFormatted}\n\n📍 ${eventConfig.dateShort} · ${eventConfig.city} · Portaria abre ${eventConfig.doorOpeningTime}\n\n*Na portaria, informe: ${listNumber} + seu nome*\n\n⚠️ *IMPORTANTE:* Cancelamentos até ${eventConfig.cancellationDeadline}. Troca de titularidade via WhatsApp com taxa de R$ 5,00. Após o prazo, não há reembolso.\n\nQualquer dúvida: ${eventConfig.whatsapp} 🤠`;

      await sendWhatsApp(purchase.customer_phone, whatsMessage);
    } catch (notificationError) {
      console.error("Erro ao enviar notificacao (email/whatsapp):", notificationError);
    }

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

