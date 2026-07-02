import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import QRCode from "https://esm.sh/qrcode@1.5.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BUCKET_NAME = "tickets";

/**
 * Gera um QR Code PNG no servidor e faz upload no Supabase Storage.
 * Retorna a URL HTTPS pública da imagem — compatível com Gmail, Outlook e Apple Mail.
 */
export async function generateAndUploadQR(listNumber: string): Promise<string> {
  // 1. Gerar o QR Code como Buffer PNG
  const pngBuffer: Buffer = await QRCode.toBuffer(listNumber, {
    type: "png",
    width: 300,
    margin: 2,
    color: {
      dark: "#1B0038",  // Cor do QR (roxo escuro, combina com identidade visual)
      light: "#FFFFFF", // Fundo branco
    },
    errorCorrectionLevel: "M",
  });

  // 2. Converter Buffer para Uint8Array (Deno/Supabase Storage)
  const uint8 = new Uint8Array(pngBuffer);

  // 3. Upload para Supabase Storage
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const filePath = `${listNumber}.png`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, uint8, {
      contentType: "image/png",
      upsert: true, // Sobrescreve se já existir (reconciliação)
    });

  if (uploadError) {
    console.error("Erro ao fazer upload do QR Code:", uploadError);
    // Fallback: retorna URL do Google Charts API (mais confiável que qrserver)
    return `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(listNumber)}&choe=UTF-8`;
  }

  // 4. Gerar URL pública
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}
