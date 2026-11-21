export interface SendVerificationResult {
  success: boolean;
  message?: string;
  error?: string;
  simulated?: boolean;
  verifyUrl: string;
}

/**
 * Genera la plantilla HTML estilizada y elegante de Gabee Studio para el correo de verificación.
 */
export function generateVerificationEmailHtml(name: string, verifyUrl: string): string {
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const patternUrl = `${appUrl}/assets/aistudio/Inicio_5d3704_dd6e8988.png`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu Cuenta · Gabee Studio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Marcellus&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 32px 14px;
      background-color: #FAF7F2;
      font-family: 'Marcellus', Georgia, 'Times New Roman', serif;
      color: #5D3704;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper-table {
      width: 100%;
      border-collapse: collapse;
    }
    .main-card {
      max-width: 560px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #E8DEC9;
      box-shadow: 0 10px 30px rgba(93, 55, 4, 0.08);
    }
    .header-cell {
      background-color: #5D3704;
      background-image: url('${patternUrl}');
      background-repeat: repeat;
      background-position: center;
      background-size: 180px auto;
      padding: 44px 24px;
      text-align: center;
      border-bottom: 2px solid #D4AF37;
    }
    .header-box {
      background-color: rgba(43, 24, 2, 0.72);
      display: inline-block;
      padding: 18px 30px;
      border-radius: 14px;
      border: 1px solid rgba(212, 175, 55, 0.55);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
    }
    .header-title {
      margin: 0;
      font-family: 'Cinzel', 'Times New Roman', Georgia, serif;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 3px;
      color: #FFFFFF;
      text-transform: uppercase;
    }
    .header-subtitle {
      margin: 6px 0 0 0;
      font-family: 'Cinzel', 'Times New Roman', Georgia, serif;
      font-size: 11px;
      letter-spacing: 2px;
      color: #E5C27A;
      text-transform: uppercase;
    }
    .body-cell {
      padding: 40px 34px 32px 34px;
    }
    .greeting {
      margin: 0 0 16px 0;
      font-family: 'Cinzel', 'Times New Roman', Georgia, serif;
      font-size: 20px;
      font-weight: 700;
      color: #5D3704;
      letter-spacing: 0.5px;
    }
    .intro-paragraph {
      margin: 0 0 22px 0;
      font-family: 'Marcellus', Georgia, serif;
      font-size: 14.5px;
      line-height: 1.65;
      color: #5D3704;
    }
    .gift-box {
      background-color: #FAF4EB;
      border: 1px solid #D4AF37;
      border-radius: 14px;
      padding: 22px 24px;
      margin: 26px 0;
      text-align: center;
      box-shadow: 0 2px 10px rgba(212, 175, 55, 0.12);
    }
    .gift-title {
      font-family: 'Cinzel', 'Times New Roman', Georgia, serif;
      font-size: 12.5px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #8C6B1C;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .gift-desc {
      margin: 0;
      font-family: 'Marcellus', Georgia, serif;
      font-size: 13.5px;
      line-height: 1.55;
      color: #5D3704;
    }
    .btn-table {
      margin: 34px auto;
    }
    .btn-warm-brown {
      display: inline-block;
      background: linear-gradient(180deg, #8C6339 0%, #734B22 100%);
      color: #FFF7ED !important;
      font-family: 'Cinzel', 'Times New Roman', Georgia, serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      text-decoration: none;
      padding: 16px 36px;
      border-radius: 10px;
      border: 1px solid #D4AF37;
      box-shadow: 0 4px 16px rgba(93, 55, 4, 0.28), 0 0 12px rgba(212, 175, 55, 0.25);
    }
    .fallback-section {
      margin-top: 30px;
      padding-top: 22px;
      border-top: 1px solid #E8DEC9;
    }
    .fallback-label {
      margin: 0 0 8px 0;
      font-family: 'Marcellus', Georgia, serif;
      font-size: 12px;
      color: #8C7A6B;
      line-height: 1.5;
    }
    .fallback-box {
      background-color: #FAF4EB;
      border: 1px dashed rgba(212, 175, 55, 0.55);
      border-radius: 8px;
      padding: 11px 14px;
      word-break: break-all;
    }
    .fallback-url {
      font-family: 'Marcellus', Georgia, serif;
      font-size: 11.5px;
      color: #8C6B1C;
      text-decoration: underline;
      line-height: 1.4;
    }
    .footer-cell {
      background-color: #FAF7F2;
      border-top: 1px solid #E8DEC9;
      padding: 24px 24px;
      text-align: center;
    }
    .footer-brand {
      display: block;
      font-family: 'Cinzel', 'Times New Roman', Georgia, serif;
      font-size: 11px;
      letter-spacing: 1.5px;
      font-weight: 700;
      color: #5D3704;
      margin-bottom: 4px;
    }
    .footer-desc {
      margin: 0;
      font-family: 'Marcellus', Georgia, serif;
      font-size: 11px;
      color: #8C7A6B;
      line-height: 1.6;
    }
  </style>
</head>
<body style="margin: 0; padding: 32px 14px; background-color: #FAF7F2; font-family: 'Marcellus', Georgia, 'Times New Roman', serif; color: #5D3704;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="wrapper-table" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="main-card" style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E8DEC9; box-shadow: 0 10px 30px rgba(93, 55, 4, 0.08);">
          
          <!-- Cabecera con Patrón de Abejitas Corporativo -->
          <tr>
            <td class="header-cell" style="background-color: #5D3704; background-image: url('${patternUrl}'); background-repeat: repeat; background-position: center; background-size: 180px auto; padding: 44px 24px; text-align: center; border-bottom: 2px solid #D4AF37;">
              <div class="header-box" style="background-color: rgba(43, 24, 2, 0.72); display: inline-block; padding: 18px 30px; border-radius: 14px; border: 1px solid rgba(212, 175, 55, 0.55); box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);">
                <h1 class="header-title" style="margin: 0; font-family: 'Cinzel', 'Times New Roman', Georgia, serif; font-size: 24px; font-weight: 700; letter-spacing: 3px; color: #FFFFFF; text-transform: uppercase;">
                  GABEE STUDIO
                </h1>
                <p class="header-subtitle" style="margin: 6px 0 0 0; font-family: 'Cinzel', 'Times New Roman', Georgia, serif; font-size: 11px; letter-spacing: 2px; color: #E5C27A; text-transform: none;">
                  ✦ VERIFICACIÓN DE CUENTA ✦
                </p>
              </div>
            </td>
          </tr>

          <!-- Cuerpo del Mensaje -->
          <tr>
            <td class="body-cell" style="padding: 40px 34px 32px 34px;">
              <h2 class="greeting" style="margin: 0 0 16px 0; font-family: 'Cinzel', 'Times New Roman', Georgia, serif; font-size: 20px; font-weight: 700; color: #5D3704; letter-spacing: 0.5px;">
                ¡Hola, ${name || 'hermosa'}! ✨
              </h2>
              
              <p class="intro-paragraph" style="margin: 0 0 22px 0; font-family: 'Marcellus', Georgia, serif; font-size: 14.5px; line-height: 1.65; color: #5D3704;">
                Gracias por formar parte de nuestra comunidad de clientas consentidas en <strong>Gabee Studio</strong>. Estás a un solo paso de verificar tu cuenta de manera oficial y activar todos tus beneficios VIP.
              </p>

              <!-- Tarjeta de Regalo de Bienvenida: 10 BeeCoins -->
              <div class="gift-box" style="background-color: #FAF4EB; border: 1px solid #D4AF37; border-radius: 14px; padding: 22px 24px; margin: 26px 0; text-align: center; box-shadow: 0 2px 10px rgba(212, 175, 55, 0.12);">
                <div class="gift-title" style="font-family: 'Cinzel', 'Times New Roman', Georgia, serif; font-size: 12.5px; font-weight: 700; letter-spacing: 1.5px; color: #8C6B1C; text-transform: uppercase; margin-bottom: 6px;">
                  🎁 REGALO ESPECIAL DE BIENVENIDA
                </div>
                <p class="gift-desc" style="margin: 0; font-family: 'Marcellus', Georgia, serif; font-size: 13.5px; line-height: 1.55; color: #5D3704;">
                  Al confirmar tu cuenta desde este correo, se acreditarán automáticamente <strong>10 BeeCoins</strong> de regalo directo en tu monedero virtual.
                </p>
              </div>

              <!-- Botón Estilizado: Marrón Claro Cálido con Borde Fino Dorado y Esquinas Suaves -->
              <div style="text-align: center; margin: 34px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn-table" style="margin: 0 auto;">
                  <tr>
                    <td align="center" style="border-radius: 10px; background-color: #7C5329; border: 1px solid #D4AF37; box-shadow: 0 4px 16px rgba(93, 55, 4, 0.28), 0 0 12px rgba(212, 175, 55, 0.25);">
                      <a href="${verifyUrl}" target="_blank" class="btn-warm-brown" style="display: inline-block; padding: 16px 36px; font-family: 'Cinzel', 'Times New Roman', Georgia, serif; font-size: 13px; font-weight: 700; color: #FFF7ED !important; text-decoration: none; letter-spacing: 1.5px; text-transform: uppercase; border-radius: 10px; background: linear-gradient(180deg, #8C6339 0%, #734B22 100%);">
                        VERIFICAR MI CUENTA
                      </a>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Enlace de Respaldo Ordenado -->
              <div class="fallback-section" style="margin-top: 30px; padding-top: 22px; border-top: 1px solid #E8DEC9;">
                <p class="fallback-label" style="margin: 0 0 8px 0; font-family: 'Marcellus', Georgia, serif; font-size: 12px; color: #8C7A6B; line-height: 1.5;">
                  Si tienes algún inconveniente al hacer clic en el botón, copia y pega el siguiente enlace de confirmación en tu navegador:
                </p>
                <div class="fallback-box" style="background-color: #FAF4EB; border: 1px dashed rgba(212, 175, 55, 0.55); border-radius: 8px; padding: 11px 14px; word-break: break-all;">
                  <a href="${verifyUrl}" target="_blank" class="fallback-url" style="font-family: 'Marcellus', Georgia, serif; font-size: 11.5px; color: #8C6B1C; text-decoration: underline; line-height: 1.4;">
                    ${verifyUrl}
                  </a>
                </div>
              </div>
            </td>
          </tr>

          <!-- Pie de Página -->
          <tr>
            <td class="footer-cell" style="background-color: #FAF7F2; border-top: 1px solid #E8DEC9; padding: 24px 18px; text-align: center;">
              <span class="footer-brand" style="display: block; font-family: 'Cinzel', 'Times New Roman', Georgia, serif; font-size: 11px; letter-spacing: 1.5px; font-weight: 700; color: #5D3704; margin-bottom: 10px;">
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
  `;
}

/**
 * Despacha el correo de verificación utilizando la API de Resend a través del endpoint backend.
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<SendVerificationResult> {
  const verifyUrl = `${window.location.origin}/?verify_token=${encodeURIComponent(token)}`;
  const html = generateVerificationEmailHtml(name, verifyUrl);

  try {
    const res = await fetch('/api/send-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        name,
        token,
        verifyUrl,
        html,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: data.error || `Error en el servicio de correo (${res.status})`,
        verifyUrl,
      };
    }

    if (data.simulated) {
      return {
        success: true,
        simulated: true,
        message: data.warning || 'Simulado: RESEND_VERIFICATION_API_KEY no configurada en .env.',
        verifyUrl,
      };
    }

    return {
      success: true,
      message: 'Correo de confirmación enviado exitosamente con Resend.',
      verifyUrl,
    };
  } catch (err: any) {
    console.error('[EmailService] Error al enviar correo de verificación:', err);
    return {
      success: false,
      error: err.message || 'No se pudo conectar con el servidor local para despachar el correo.',
      verifyUrl,
    };
  }
}


