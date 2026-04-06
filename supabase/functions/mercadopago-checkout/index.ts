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
        const { customer_name, customer_email, customer_phone, items, total_amount } = await req.json();

        // 1. Create Purchase in DB using Service Role (to bypass RLS for now)
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        const { data: purchase, error: pError } = await supabase
            .from("arraia_purchases")
            .insert([{
                customer_name,
                customer_email,
                customer_phone,
                total_amount,
                items,
                payment_method: "mercadopago",
                payment_status: "pending"
            }])
            .select()
            .single();

        if (pError) throw pError;

        // 2. Create Mercado Pago Preference
        const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                items: [
                    {
                        title: "Arraiá Quintal da Fafá 2026 - Ingressos",
                        unit_price: total_amount,
                        quantity: 1,
                        currency_id: "BRL",
                    }
                ],
                external_reference: purchase.id,
                notification_url: `${SUPABASE_URL}/functions/v1/mercadopago-webhook`,
                back_urls: {
                    success: `${req.headers.get("origin")}/arraia-2026?payment=success`,
                    failure: `${req.headers.get("origin")}/arraia-2026?payment=failure`,
                    pending: `${req.headers.get("origin")}/arraia-2026?payment=pending`,
                },
                auto_return: "approved",
            }),
        });

        const preference = await response.json();

        // 3. Update purchase with external_id
        await supabase
            .from("arraia_purchases")
            .update({ external_id: preference.id })
            .eq("id", purchase.id);

        return new Response(JSON.stringify({ checkout_url: preference.init_point }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
