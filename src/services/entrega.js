export const TAXA_ENTREGA = 8;

// Pedidos com subtotal (sem a taxa) acima deste valor têm entrega grátis.
export const VALOR_MINIMO_FRETE_GRATIS = 80;

export function calcularTaxaEntrega(subtotal) {
  return Number(subtotal || 0) > VALOR_MINIMO_FRETE_GRATIS
    ? 0
    : TAXA_ENTREGA;
}
