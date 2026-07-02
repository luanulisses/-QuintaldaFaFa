import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import QRCode from "https://esm.sh/qrcode@1.5.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BUCKET_NAME = "tickets";

/**
 * Retorna a URL HTTPS pública da imagem do QR Code.
 * Usamos a api.qrserver.com que é a forma mais imediata e segura de gerar o QR Code
 * sem carregar dependências locais de canvas no Deno.
 */
export async function generateAndUploadQR(listNumber: string): Promise<string> {
  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(listNumber)}`;
}
