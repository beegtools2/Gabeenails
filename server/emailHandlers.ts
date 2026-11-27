/// <reference types="node" />
import { Resend } from 'resend';
import type { ApiRequest, ApiResponse } from './http.ts';
import { readJsonBody, sendJson } from './http.ts';

const LIBRO_MAX_BODY_BYTES = 30 * 1024 * 1024;
const LIBRO_FROM_EMAIL_FALLBACK = 'Gabee Studio <onboarding@resend.dev>';
const LIBRO_COMPANY_EMAIL_FALLBACK = 'beeg.tools@gmail.com';

const escHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function buildLibroConstanciaHtml(data: any): string {
  // Todas las filas comparten el mismo estilo: ancho automático, salto de línea
  // natural y alineación a la izquierda. Así "DOMICILIO EN LIMA" no se apila
  // letra por letra ni se desplaza respecto a los demás valores de la columna.
  const row = (label: string, value: unknown) => `
    <tr>
      <td valign="top" style="padding:9px 12px; border-bottom:1px solid #E8DEC9; font-family:'Cinzel',Georgia,serif; font-size:11px; font-weight:700; letter-spacing:0.5px; color:#8C6B1C; text-transform:uppercase; vertical-align:top; white-space:normal;">${escHtml(label)}</td>
      <td valign="top" style="width:auto; padding:9px 12px; border-bottom:1px solid #E8DEC9; font-family:'Marcellus',Georgia,serif; font-size:13px; line-height:1.55; color:#5D3704; vertical-align:top; text-align:left; white-space:normal; word-break:normal; overflow-wrap:break-word;">${escHtml(value) || '—'}</td>
    </tr>`;

  const attachments = Array.isArray(data.attachments) ? data.attachments : [];
  const evidencia = attachments.length
    ? attachments.map((a: any) => escHtml(a.filename)).join(', ')
    : 'Ninguna';

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const patternUrl = `${appUrl}/assets/aistudio/Inicio_5d3704_dd6e8988.png`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Constancia de Reclamación · Gabee Studio</title>
</head>
<body style="margin:0; padding:32px 14px; background-color:#FAF7F2; font-family:'Marcellus',Georgia,'Times New Roman',serif; color:#5D3704;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; margin:0 auto; background-color:#FFFFFF; border-radius:20px; overflow:hidden; border:1px solid #E8DEC9; box-shadow:0 10px 30px rgba(93,55,4,0.08);">

          <tr>
            <td style="background-color:#5D3704; background-image:url('${patternUrl}'); background-repeat:repeat; background-position:center; background-size:180px auto; padding:36px 24px; text-align:center; border-bottom:2px solid #D4AF37;">
              <div style="background-color:rgba(43,24,2,0.72); display:inline-block; padding:16px 28px; border-radius:14px; border:1px solid rgba(212,175,55,0.55);">
                <h1 style="margin:0; font-family:'Cinzel',Georgia,serif; font-size:22px; font-weight:700; letter-spacing:3px; color:#FFFFFF; text-transform:uppercase;">GABEE STUDIO</h1>
                <p style="margin:6px 0 0; font-family:'Cinzel',Georgia,serif; font-size:11px; letter-spacing:2px; color:#E5C27A;">✦ LIBRO DE RECLAMACIONES VIRTUAL ✦</p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:34px 30px 24px;">
              <h2 style="margin:0 0 8px; font-family:'Cinzel',Georgia,serif; font-size:19px; font-weight:700; color:#5D3704;">Constancia de ${escHtml(data.claimType) === 'queja' ? 'Queja' : 'Reclamación'}</h2>
              <p style="margin:0 0 22px; font-size:13.5px; line-height:1.65; color:#5D3704;">
                Estimada <strong>${escHtml(data.consumerName)}</strong>: hemos registrado tu ${escHtml(data.claimType) === 'queja' ? 'queja' : 'reclamo'} en el Libro de Reclamaciones de <strong>BEETOOLS E.I.R.L. (RUC: 20614757257)</strong>. Conforme a la Ley N° 29571, el plazo máximo legal es de hasta 15 días hábiles; sin embargo, haremos todo lo posible por contactarnos antes contigo, por eso debes estar atenta a tu correo.
              </p>

              <div style="background-color:#FAF4EB; border:1px solid #D4AF37; border-radius:12px; padding:14px 18px; margin-bottom:22px; text-align:center;">
                <span style="display:block; font-family:'Cinzel',Georgia,serif; font-size:10px; font-weight:700; letter-spacing:1.5px; color:#8C6B1C; text-transform:uppercase;">Código de la reclamación</span>
                <strong style="display:block; font-family:'Cinzel',Georgia,serif; font-size:20px; letter-spacing:1px; color:#5D3704; margin-top:4px;">${escHtml(data.code)}</strong>
              </div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; border-top:1px solid #E8DEC9;">
                ${row('Tipo de requerimiento', data.claimType === 'queja' ? 'Queja' : 'Reclamo')}
                ${row('Código de Servicio / Pedido', data.serviceCode)}
                ${row('Nombres y apellidos', data.consumerName)}
                ${row('Documento', `${data.docType} ${data.docNumber}`)}
                ${row('Correo electrónico', data.email)}
                ${row('Teléfono / WhatsApp', data.phone)}
                ${row('Domicilio en Lima', data.address)}
                ${row('Servicio contratado', data.serviceContracted)}
                ${row('Monto reclamado (S/.)', data.amount ? `S/. ${data.amount}` : '—')}
                ${row('Detalle del reclamo o queja', data.detail)}
                ${row('Pedido concreto del consumidor', data.order)}
                ${row('Fotos / evidencias adjuntas', evidencia)}
              </table>

              <p style="margin:22px 0 0; padding-top:18px; border-top:1px solid #E8DEC9; font-size:11.5px; line-height:1.6; color:#8C7A6B;">
                Este correo es la constancia automática de registro. Conserva el código para dar seguimiento a tu caso. Las imágenes adjuntas forman parte del registro de evidencia.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#FAF7F2; border-top:1px solid #E8DEC9; padding:22px 18px; text-align:center;">
              <span style="display:block; font-family:'Cinzel',Georgia,serif; font-size:11px; letter-spacing:1.5px; font-weight:700; color:#5D3704;">✦ GABEE STUDIO · JESÚS MARÍA, LIMA, PERÚ ✦</span>
              <span style="display:block; font-size:11px; color:#8C6B1C; margin-top:8px;">beeg.tools@gmail.com · @gabeenailsart</span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function handleSendVerification(req: ApiRequest, res: ApiResponse): Promise<void> {
  const { data: parsed } = await readJsonBody(req);
  try {
          const { email, verifyUrl, name, html } = parsed;

          if (!email || !verifyUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Faltan parámetros obligatorios (email, verifyUrl)' }));
            return;
          }

          // ── VERIFICACIÓN DE CUENTA ─────────────────────────────────────
          // Aislada: usa EXCLUSIVAMENTE su propia key y su propio cliente Resend.
          const verificationApiKey = process.env.RESEND_VERIFICATION_API_KEY?.trim();

          if (!verificationApiKey) {
            sendJson(res, 503, { success: false, error: 'El correo de verificación no está configurado en el servidor.' });
            return;
          }

          const verificationResend = new Resend(verificationApiKey);
          const verificationFromEmail =
            process.env.RESEND_VERIFICATION_FROM_EMAIL?.trim() || 'Gabee Studio <onboarding@resend.dev>';
          const appUrl = process.env.APP_URL || 'http://localhost:3000';
          const patternUrl = `${appUrl}/assets/aistudio/Inicio_5d3704_dd6e8988.png`;

          const emailResult = await verificationResend.emails.send({
            from: verificationFromEmail,
            to: [email],
            subject: '✦ Confirma tu cuenta en Gabee Studio y reclama 10 BeeCoins ✦',
            html: html || `
              <!DOCTYPE html>
              <html lang="es">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Marcellus&display=swap" rel="stylesheet">
              </head>
              <body style="margin: 0; padding: 32px 14px; background-color: #FAF7F2; font-family: 'Marcellus', Georgia, 'Times New Roman', serif; color: #5D3704;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td align="center">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E8DEC9; box-shadow: 0 10px 30px rgba(93, 55, 4, 0.08);">
                        
                        <!-- Cabecera con Patrón de Abejitas Corporativo -->
                        <tr>
                          <td style="background-color: #5D3704; background-image: url('${patternUrl}'); background-repeat: repeat; background-position: center; background-size: 180px auto; padding: 44px 24px; text-align: center; border-bottom: 2px solid #D4AF37;">
                            <div style="background-color: rgba(43, 24, 2, 0.72); display: inline-block; padding: 18px 30px; border-radius: 14px; border: 1px solid rgba(212, 175, 55, 0.55); box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);">
                              <h1 style="margin: 0; font-family: 'Cinzel', 'Times New Roman', Georgia, serif; font-size: 24px; font-weight: 700; letter-spacing: 3px; color: #FFFFFF; text-transform: uppercase;">
                                GABEE STUDIO
                              </h1>
                              <p style="margin: 6px 0 0 0; font-family: 'Cinzel', 'Times New Roman', Georgia, serif; font-size: 11px; letter-spacing: 2px; color: #E5C27A; text-transform: none;">
                                ✦ VERIFICACIÓN DE CUENTA ✦
                              </p>
                            </div>
                          </td>
                        </tr>

                        <!-- Cuerpo del Mensaje -->
                        <tr>
                          <td style="padding: 40px 34px 32px 34px;">
                            <h2 style="margin: 0 0 16px 0; font-family: 'Cinzel', 'Times New Roman', Georgia, serif; font-size: 20px; font-weight: 700; color: #5D3704; letter-spacing: 0.5px;">
                              ¡Hola, ${name || 'hermosa'}! ✨
                            </h2>
                            <p style="margin: 0 0 22px 0; font-family: 'Marcellus', Georgia, serif; font-size: 14.5px; line-height: 1.65; color: #5D3704;">
                              Gracias por formar parte de nuestra comunidad de clientas consentidas en <strong>Gabee Studio</strong>. Estás a un solo paso de verificar tu cuenta de manera oficial y activar todos tus beneficios VIP.
                            </p>

                            <!-- Tarjeta de Regalo de Bienvenida: 10 BeeCoins -->
                            <div style="background-color: #FAF4EB; border: 1px solid #D4AF37; border-radius: 14px; padding: 22px 24px; margin: 26px 0; text-align: center; box-shadow: 0 2px 10px rgba(212, 175, 55, 0.12);">
                              <div style="font-family: 'Cinzel', 'Times New Roman', Georgia, serif; font-size: 12.5px; font-weight: 700; letter-spacing: 1.5px; color: #8C6B1C; text-transform: uppercase; margin-bottom: 6px;">
                                🎁 REGALO ESPECIAL DE BIENVENIDA
                              </div>
                              <p style="margin: 0; font-family: 'Marcellus', Georgia, serif; font-size: 13.5px; line-height: 1.55; color: #5D3704;">
                                Al confirmar tu cuenta desde este correo, se acreditarán automáticamente <strong>10 BeeCoins</strong> de regalo directo en tu monedero virtual.
                              </p>
                            </div>

                            <!-- Botón Estilizado: Marrón Claro Cálido con Borde Dorado -->
                            <div style="text-align: center; margin: 34px 0;">
                              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                                <tr>
                                  <td align="center" style="border-radius: 10px; background-color: #7C5329; border: 1px solid #D4AF37; box-shadow: 0 4px 16px rgba(93, 55, 4, 0.28), 0 0 12px rgba(212, 175, 55, 0.25);">
                                    <a href="${verifyUrl}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: 'Cinzel', 'Times New Roman', Georgia, serif; font-size: 13px; font-weight: 700; color: #FFF7ED !important; text-decoration: none; letter-spacing: 1.5px; text-transform: uppercase; border-radius: 10px; background: linear-gradient(180deg, #8C6339 0%, #734B22 100%);">
                                      VERIFICAR MI CUENTA
                                    </a>
                                  </td>
                                </tr>
                              </table>
                            </div>

                            <!-- Enlace de Respaldo Ordenado -->
                            <div style="margin-top: 30px; padding-top: 22px; border-top: 1px solid #E8DEC9;">
                              <p style="margin: 0 0 8px 0; font-family: 'Marcellus', Georgia, serif; font-size: 12px; color: #8C7A6B; line-height: 1.5;">
                                Si tienes algún inconveniente al hacer clic en el botón, copia y pega el siguiente enlace de confirmación en tu navegador:
                              </p>
                              <div style="background-color: #FAF4EB; border: 1px dashed rgba(212, 175, 55, 0.55); border-radius: 8px; padding: 11px 14px; word-break: break-all;">
                                <a href="${verifyUrl}" target="_blank" style="font-family: 'Marcellus', Georgia, serif; font-size: 11.5px; color: #8C6B1C; text-decoration: underline; line-height: 1.4;">
                                  ${verifyUrl}
                                </a>
                              </div>
                            </div>
                          </td>
                        </tr>

                        <!-- Pie de Página -->
                        <tr>
                          <td style="background-color: #FAF7F2; border-top: 1px solid #E8DEC9; padding: 24px 18px; text-align: center;">
                            <span style="display: block; font-family: 'Cinzel', 'Times New Roman', Georgia, serif; font-size: 11px; letter-spacing: 1.5px; font-weight: 700; color: #5D3704; margin-bottom: 10px;">
                              ✦ GABEE STUDIO · JESÚS MARÍA, LIMA, PERÚ ✦
                            </span>
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto; border-collapse: collapse;">
                              <tr>
                                <td style="vertical-align: middle; padding-right: 10px; font-family: 'Marcellus', Georgia, serif; font-size: 11px; letter-spacing: 0.5px; color: #8C6B1C;">
                                  <a href="https://www.instagram.com/gabeenailsart" target="_blank" style="color: #8C6B1C; text-decoration: none; font-family: 'Marcellus', Georgia, serif; font-size: 11px;">@gabeenailsart</a>
                                </td>
                                <td style="vertical-align: middle; padding: 0 3px;">
                                  <a href="https://www.youtube.com/@gabeenailsart" target="_blank" style="text-decoration: none;">
                                    <img src="https://img.icons8.com/ios-filled/100/C5A059/youtube-play.png" width="22" height="22" alt="YouTube" style="display: block; width: 22px; height: 22px; border: 0; outline: none;" />
                                  </a>
                                </td>
                                <td style="vertical-align: middle; padding: 0 3px;">
                                  <a href="https://www.facebook.com/gabeenailsart" target="_blank" style="text-decoration: none;">
                                    <img src="https://img.icons8.com/ios-filled/100/C5A059/facebook-new.png" width="22" height="22" alt="Facebook" style="display: block; width: 22px; height: 22px; border: 0; outline: none;" />
                                  </a>
                                </td>
                                <td style="vertical-align: middle; padding: 0 3px;">
                                  <a href="https://www.instagram.com/gabeenailsart" target="_blank" style="text-decoration: none;">
                                    <img src="https://img.icons8.com/ios-filled/100/C5A059/instagram-new.png" width="22" height="22" alt="Instagram" style="display: block; width: 22px; height: 22px; border: 0; outline: none;" />
                                  </a>
                                </td>
                                <td style="vertical-align: middle; padding: 0 3px;">
                                  <a href="https://www.threads.net/@gabeenailsart" target="_blank" style="text-decoration: none;">
                                    <img src="https://img.icons8.com/ios-filled/100/C5A059/threads.png" width="22" height="22" alt="Threads" style="display: block; width: 22px; height: 22px; border: 0; outline: none;" />
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `,
          });

          if (emailResult.error) {
            console.error('[Resend Error]', emailResult.error);
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: emailResult.error.message || 'Error al despachar correo vía Resend' }));
            return;
          }

          console.log('[Resend Success] Correo de verificación enviado con éxito a:', email, 'ID:', emailResult.data?.id);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, id: emailResult.data?.id }));
        } catch (err: any) {
          console.error('[Resend Server Exception]', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err.message || 'Error interno del servidor al procesar envío' }));
        }
}

export async function handleSendPasswordReset(req: ApiRequest, res: ApiResponse): Promise<void> {
  const { data: parsed } = await readJsonBody(req);
  try {
          const { email, resetUrl, name, html } = parsed;
          if (!email || !resetUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Faltan parámetros obligatorios (email, resetUrl)' }));
            return;
          }
          // ── RECUPERACIÓN DE CONTRASEÑA ─────────────────────────────────
          // Aislada: usa EXCLUSIVAMENTE su propia key y su propio cliente Resend.
          const resetApiKey = process.env.RESEND_RESET_API_KEY?.trim();
          if (!resetApiKey) {
            sendJson(res, 503, { success: false, error: 'El correo de recuperación no está configurado en el servidor.' });
            return;
          }
          const resetResend = new Resend(resetApiKey);
          // Remitente exclusivo del flujo de recuperación.
          const resetFromEmail =
            process.env.RESEND_RESET_FROM_EMAIL?.trim() || 'Gabee Studio <onboarding@resend.dev>';
          const emailResult = await resetResend.emails.send({
            from: resetFromEmail,
            to: [email],
            subject: '✦ Restablece tu contraseña en Gabee Studio ✦',
            html: html || `<p>Restablece tu contraseña: <a href="${resetUrl}">${resetUrl}</a></p>`,
          });
          if (emailResult.error) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: emailResult.error.message || 'Error al despachar correo' }));
            return;
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, id: emailResult.data?.id }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err.message || 'Error interno' }));
        }
}

export async function handleLibroReclamaciones(req: ApiRequest, res: ApiResponse): Promise<void> {
  const respond = (status: number, payload: object) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
  };
  const { data: bodyData, tooLarge } = await readJsonBody(req, LIBRO_MAX_BODY_BYTES);
  if (tooLarge) {
    respond(413, { success: false, error: 'Las imágenes adjuntas son demasiado grandes (máximo 30 MB en total).' });
    return;
  }
      try {
        const data = bodyData;
        const required = ['code', 'serviceCode', 'consumerName', 'docNumber', 'email', 'detail'];
        const missing = required.filter((key) => !String(data[key] ?? '').trim());
        if (missing.length) {
          respond(400, { success: false, error: 'Faltan campos obligatorios: ' + missing.join(', ') });
          return;
        }

        // API key exclusiva del Libro de Reclamaciones: solo entorno.
        const libroApiKey = process.env.RESEND_LIBRO_API_KEY?.trim();
        if (!libroApiKey) {
          respond(503, { success: false, error: 'El correo del Libro de Reclamaciones no está configurado en el servidor.' });
          return;
        }
        const libroFromEmail =
          process.env.RESEND_LIBRO_FROM_EMAIL?.trim() || LIBRO_FROM_EMAIL_FALLBACK;
        if (!process.env.RESEND_LIBRO_FROM_EMAIL?.trim()) {
          console.warn(
            '[Resend · Libro] Usando remitente de pruebas onboarding@resend.dev. ' +
              'Para entregar constancias a correos de clientas, verifica un dominio en Resend y ' +
              'define RESEND_LIBRO_FROM_EMAIL en .env (ej: "Gabee Studio <contacto@tudominio.com>").'
          );
        }
        const libroResend = new Resend(libroApiKey);

        const rawAttachments = Array.isArray(data.attachments) ? data.attachments : [];
        const attachments = rawAttachments
          .filter((a: any) => a && typeof a.content === 'string' && a.content.length > 0)
          .slice(0, 5)
          .map((a: any) => ({
            filename: String(a.filename || 'evidencia.jpg').replace(/[^\w.\-()áéíóúÁÉÍÓÚñÑ ]/g, '_'),
            content: String(a.content).replace(/^data:[^;]+;base64,/, ''),
          }));

        const html = buildLibroConstanciaHtml({ ...data, attachments });

        // 1) Envío prioritario a la clienta (nunca se bloquea por la copia).
        const customerResult = await libroResend.emails.send({
          from: libroFromEmail,
          to: [String(data.email).trim()],
          subject: `Constancia de ${data.claimType === 'queja' ? 'Queja' : 'Reclamación'} ${data.code} · Gabee Studio`,
          html,
          ...(attachments.length ? { attachments } : {}),
        });

        if (customerResult.error) {
          console.error('[Resend · Libro] Error al enviar constancia a la clienta:', customerResult.error);
          respond(400, {
            success: false,
            error: customerResult.error.message || 'No se pudo enviar la constancia por correo.',
          });
          return;
        }

        // 2) Copia opcional a la empresa: si falla, NO afecta el envío a la clienta.
        try {
          const companyTo = process.env.RESEND_LIBRO_COMPANY_EMAIL?.trim() || LIBRO_COMPANY_EMAIL_FALLBACK;
          await libroResend.emails.send({
            from: libroFromEmail,
            to: [companyTo],
            subject: `Nueva ${data.claimType === 'queja' ? 'queja' : 'reclamo'} ${data.code} · ${data.consumerName}`,
            html,
            ...(attachments.length ? { attachments } : {}),
          });
        } catch (companyErr: any) {
          console.warn('[Resend · Libro] Copy a empresa omitida (no bloquea el envío a la clienta):', companyErr?.message || companyErr);
        }

        console.log('[Resend · Libro] Constancia enviada a:', data.email, '· Código:', data.code, '· ID:', customerResult.data?.id);
        respond(200, { success: true, id: customerResult.data?.id, code: data.code });
      } catch (err: any) {
        console.error('[Resend · Libro] Excepción al procesar el envío:', err);
        respond(500, { success: false, error: err?.message || 'Error interno al registrar la reclamación.' });
      }
}
