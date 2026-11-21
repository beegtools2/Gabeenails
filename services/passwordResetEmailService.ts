export interface SendPasswordResetResult {
  success: boolean;
  message?: string;
  error?: string;
  simulated?: boolean;
  resetUrl: string;
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<SendPasswordResetResult> {
  const resetUrl = `${window.location.origin}/?reset_token=${encodeURIComponent(token)}`;
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="utf-8"><title>Restablecer Contraseña · Gabee Studio</title></head>
    <body style="margin:0;padding:32px 14px;background-color:#FAF7F2;font-family:'Marcellus',Georgia,serif;color:#5D3704;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
        <tr><td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:20px;overflow:hidden;border:1px solid #E8DEC9;box-shadow:0 10px 30px rgba(93,55,4,0.08);">
            <tr><td style="background-color:#5D3704;padding:44px 24px;text-align:center;border-bottom:2px solid #D4AF37;">
              <div style="background-color:rgba(43,24,2,0.72);display:inline-block;padding:18px 30px;border-radius:14px;border:1px solid rgba(212,175,55,0.55);box-shadow:0 6px 18px rgba(0,0,0,0.35);">
                <h1 style="margin:0;font-family:'Cinzel',serif;font-size:24px;font-weight:700;letter-spacing:3px;color:#FFFFFF;text-transform:uppercase;">GABEE STUDIO</h1>
                <p style="margin:6px 0 0 0;font-family:'Cinzel',serif;font-size:11px;letter-spacing:2px;color:#E5C27A;text-transform:uppercase;">✦ RECUPERACIÓN DE CONTRASEÑA ✦</p>
              </div>
            </td></tr>
            <tr><td style="padding:40px 34px 32px 34px;">
              <h2 style="margin:0 0 16px 0;font-family:'Cinzel',serif;font-size:20px;font-weight:700;color:#5D3704;">¡Hola, ${name || 'hermosa'}! ✨</h2>
              <p style="margin:0 0 22px 0;font-family:'Marcellus',Georgia,serif;font-size:14.5px;line-height:1.65;color:#5D3704;">
                Haz clic en el siguiente botón para crear una nueva contraseña segura.
              </p>
              <div style="text-align:center;margin:34px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                  <tr><td align="center" style="border-radius:10px;background-color:#7C5329;border:1px solid #D4AF37;">
                    <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:16px 36px;font-family:'Cinzel',serif;font-size:13px;font-weight:700;color:#FFF7ED !important;text-decoration:none;letter-spacing:1.5px;text-transform:uppercase;border-radius:10px;background:linear-gradient(180deg,#8C6339 0%,#734B22 100%);">
                      RECUPERAR MI CUENTA
                    </a>
                  </td></tr>
                </table>
              </div>
              <div style="margin-top:30px;padding-top:22px;border-top:1px solid #E8DEC9;">
                <p style="margin:0 0 8px 0;font-family:'Marcellus',Georgia,serif;font-size:12px;color:#8C7A6B;line-height:1.5;">
                  Si no solicitaste este cambio, puedes ignorar este correo. El enlace expira en 15 minutos.
                </p>
                <div style="background-color:#FAF4EB;border:1px dashed rgba(212,175,55,0.55);border-radius:8px;padding:11px 14px;word-break:break-all;">
                  <a href="${resetUrl}" target="_blank" style="font-family:'Marcellus',Georgia,serif;font-size:11.5px;color:#8C6B1C;text-decoration:underline;line-height:1.4;">${resetUrl}</a>
                </div>
              </div>
            </td></tr>
            <tr><td style="background-color:#FAF7F2;border-top:1px solid #E8DEC9;padding:24px 18px;text-align:center;">
              <span style="display:block;font-family:'Cinzel',serif;font-size:11px;letter-spacing:1.5px;font-weight:700;color:#5D3704;margin-bottom:10px;">✦ GABEE STUDIO · JESÚS MARÍA, LIMA, PERÚ ✦</span>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;border-collapse:collapse;">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;font-family:'Marcellus',Georgia,serif;font-size:11px;letter-spacing:0.5px;color:#8C6B1C;">
                    <a href="https://www.instagram.com/gabeenailsart" target="_blank" style="color:#8C6B1C;text-decoration:none;font-family:'Marcellus',Georgia,serif;font-size:11px;">@gabeenailsart</a>
                  </td>
                  <td style="vertical-align:middle;padding:0 3px;">
                    <a href="https://www.youtube.com/@gabeenailsart" target="_blank" style="text-decoration:none;">
                      <img src="https://img.icons8.com/ios-filled/100/C5A059/youtube-play.png" width="22" height="22" alt="YouTube" style="display:block;width:22px;height:22px;border:0;outline:none;" />
                    </a>
                  </td>
                  <td style="vertical-align:middle;padding:0 3px;">
                    <a href="https://www.facebook.com/gabeenailsart" target="_blank" style="text-decoration:none;">
                      <img src="https://img.icons8.com/ios-filled/100/C5A059/facebook-new.png" width="22" height="22" alt="Facebook" style="display:block;width:22px;height:22px;border:0;outline:none;" />
                    </a>
                  </td>
                  <td style="vertical-align:middle;padding:0 3px;">
                    <a href="https://www.instagram.com/gabeenailsart" target="_blank" style="text-decoration:none;">
                      <img src="https://img.icons8.com/ios-filled/100/C5A059/instagram-new.png" width="22" height="22" alt="Instagram" style="display:block;width:22px;height:22px;border:0;outline:none;" />
                    </a>
                  </td>
                  <td style="vertical-align:middle;padding:0 3px;">
                    <a href="https://www.threads.net/@gabeenailsart" target="_blank" style="text-decoration:none;">
                      <img src="https://img.icons8.com/ios-filled/100/C5A059/threads.png" width="22" height="22" alt="Threads" style="display:block;width:22px;height:22px;border:0;outline:none;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  try {
    const res = await fetch('/api/send-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, token, resetUrl, html }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || `Error (${res.status})`, resetUrl };
    }
    if (data.simulated) {
      return { success: true, simulated: true, message: data.warning || 'Simulado: RESEND_RESET_API_KEY no configurada.', resetUrl };
    }
    return { success: true, message: 'Correo enviado exitosamente.', resetUrl };
  } catch (err: any) {
    console.error('[PasswordResetEmailService] Error:', err);
    return { success: false, error: err.message || 'No se pudo conectar.', resetUrl };
  }
}