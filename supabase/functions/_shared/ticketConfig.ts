export const BACKEND_TICKET_CONFIG = {
  prices: {
    geral: 3000,       // Geral — 3º Lote
    meia: 1500,        // Meia-entrada — 3º Lote
    passaporte: 2500,  // Passaporte Kids — Preço Único
    pescaria: 1000,    // Ficha Pescaria
    brinquedos: 1000,  // Brinquedo Individual
  } as Record<string, number>,
  maxQuantityPerItem: 10
};
