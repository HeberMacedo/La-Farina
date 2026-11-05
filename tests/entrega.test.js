import {
  calcularTaxaEntrega,
  TAXA_ENTREGA,
  VALOR_MINIMO_FRETE_GRATIS,
} from "../src/services/entrega";

describe("Taxa de entrega", () => {
  test("cobra a taxa em pedidos abaixo de R$ 80", () => {
    expect(calcularTaxaEntrega(40)).toBe(TAXA_ENTREGA);
  });

  test("cobra a taxa em pedidos de exatamente R$ 80", () => {
    expect(calcularTaxaEntrega(VALOR_MINIMO_FRETE_GRATIS)).toBe(TAXA_ENTREGA);
  });

  test("entrega grátis em pedidos acima de R$ 80", () => {
    expect(calcularTaxaEntrega(80.01)).toBe(0);
    expect(calcularTaxaEntrega(120)).toBe(0);
  });

  test("subtotal vazio ou inválido cobra a taxa", () => {
    expect(calcularTaxaEntrega(0)).toBe(TAXA_ENTREGA);
    expect(calcularTaxaEntrega(undefined)).toBe(TAXA_ENTREGA);
  });
});
