export interface BirthdayDiscountResult {
  discountAmount: number;
  label: string;
  isGratis: boolean;
  percentage: number;
}

/**
 * Calculates birthday roulette discount based on prize text and gross total.
 * - "¡SERVICIO GRATIS!" / "GRATIS": Covers up to S/. 150 maximum cap.
 * - "XX% OFF": Applies exact percentage discount on gross total.
 */
export function calculateBirthdayDiscount(
  prizeStr: string | null | undefined,
  grossTotal: number
): BirthdayDiscountResult {
  if (!prizeStr || grossTotal <= 0) {
    return { discountAmount: 0, label: '', isGratis: false, percentage: 0 };
  }

  const upper = prizeStr.toUpperCase();

  // Case 1: Servicio Gratis (Cap S/. 150)
  if (upper.includes('GRATIS') || upper.includes('FREE')) {
    const cap = 150;
    const discountAmount = Math.min(grossTotal, cap);
    return {
      discountAmount,
      label: `🎂 Regalo VIP Cumpleaños: ¡Servicio Gratis! (Hasta S/. 150)`,
      isGratis: true,
      percentage: 100,
    };
  }

  // Case 2: Percentage OFF (e.g. 10%, 15%, 20%, 25%, 30%, 35%)
  const match = upper.match(/(\d+)%/);
  if (match) {
    const percent = parseInt(match[1], 10);
    if (!isNaN(percent) && percent > 0) {
      const discountAmount = Math.round((grossTotal * percent) / 100);
      return {
        discountAmount,
        label: `🎂 Regalo VIP Cumpleaños (${percent}% OFF)`,
        isGratis: false,
        percentage: percent,
      };
    }
  }

  return { discountAmount: 0, label: '', isGratis: false, percentage: 0 };
}
