/**
 * Global Anti-Fraud Validation Utilities for Gabee Studio
 */

export const validateOperationCode = (
  rawCode: string
): { isValid: boolean; errorMessage?: string; cleanCode: string } => {
  const cleanCode = rawCode.trim();

  // 1. Verificación de presencia
  if (!cleanCode) {
    return {
      isValid: false,
      errorMessage: 'Por favor ingresa el número de operación de tu pago para continuar.',
      cleanCode,
    };
  }

  // 2. Filtro estricto de formato: exactamente entre 6 y 9 dígitos puramente numéricos
  if (!/^\d{6,9}$/.test(cleanCode)) {
    return {
      isValid: false,
      errorMessage: 'El código de operación debe contener únicamente números y tener una longitud obligatoria de entre 6 y 9 dígitos.',
      cleanCode,
    };
  }

  return { isValid: true, cleanCode };
};
