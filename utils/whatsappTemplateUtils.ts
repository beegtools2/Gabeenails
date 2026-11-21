/**
 * Renderiza una plantilla de WhatsApp reemplazando las etiquetas dinámicas {var}
 * con los valores reales. Si la plantilla está vacía, devuelve null para que
 * el caller use su fallback por defecto.
 */
export function renderWhatsAppTemplate(
  template: string | undefined | null,
  vars: Record<string, string>
): string | null {
  if (!template || !template.trim()) return null;
  let out = template;
  for (const key of Object.keys(vars)) {
    const val = vars[key] ?? '';
    out = out.split(`{${key}}`).join(val);
  }
  return out;
}

/**
 * Devuelve la plantilla correspondiente al flujo, con fallback vacío.
 */
export function getWhatsAppTemplate(settings: any, flow: string): string | undefined {
  switch (flow) {
    case 'nuestros_servicios':
      return settings?.waTemplateNuestrosServicios;
    case 'retiro':
      return settings?.waTemplateRetiro;
    case 'esmaltado':
      return settings?.waTemplateEsmaltado;
    case 'catalogo_presson':
      return settings?.waTemplateCatalogoPressOn;
    case 'pedido_personalizado':
      return settings?.waTemplatePedidoPersonalizado;
    case 'promo_sistemas':
      return settings?.waTemplatePromoSistemas;
    case 'promo_presson':
      return settings?.waTemplatePromoPressOn;
    default:
      return undefined;
  }
}
