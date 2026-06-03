import { Resend } from 'resend';

let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY is not configured');
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// ─── Email templates ───────────────────────────────────────

export function buildContactEmailHtml(params: {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
}): string {
  const { name, email, subject, category, message } = params;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SmartQuery Contact</title>
</head>
<body style="margin:0;padding:0;background:#050508;font-family:'Inter',Arial,sans-serif;color:#e8f4ff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050508;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d0d1e,#111128);border:1px solid rgba(0,212,255,0.15);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
              <div style="display:inline-block;margin-bottom:12px;">
                <span style="font-size:28px;font-weight:900;letter-spacing:2px;background:linear-gradient(135deg,#00d4ff,#0080ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
                  ⚡ QUERYFORGE AI
                </span>
              </div>
              <p style="margin:0;color:#8899bb;font-size:14px;letter-spacing:1px;text-transform:uppercase;">New Contact Message</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#0a0a14;border:1px solid rgba(0,212,255,0.1);border-top:none;padding:32px 40px;">

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:20px;">
                    <div style="background:rgba(0,212,255,0.04);border:1px solid rgba(0,212,255,0.1);border-radius:10px;padding:16px 20px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding:6px 0;color:#8899bb;font-size:13px;width:100px;">From</td>
                          <td style="padding:6px 0;color:#e8f4ff;font-size:14px;font-weight:600;">${name}</td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;color:#8899bb;font-size:13px;">Email</td>
                          <td style="padding:6px 0;"><a href="mailto:${email}" style="color:#00d4ff;text-decoration:none;font-size:14px;">${email}</a></td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;color:#8899bb;font-size:13px;">Subject</td>
                          <td style="padding:6px 0;color:#e8f4ff;font-size:14px;">${subject}</td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;color:#8899bb;font-size:13px;">Category</td>
                          <td style="padding:6px 0;">
                            <span style="background:rgba(0,212,255,0.15);color:#00d4ff;border-radius:4px;padding:2px 10px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">${category}</span>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td>
                    <p style="margin:0 0 12px;color:#8899bb;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Message</p>
                    <div style="background:#0d0d1e;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:20px;color:#c8d8e8;font-size:14px;line-height:1.8;white-space:pre-wrap;">${message}</div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#050508;border:1px solid rgba(0,212,255,0.08);border-top:none;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#445566;font-size:12px;">
                Sent via Smart Query Optimizer Contact Form · 
                <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#00d4ff;text-decoration:none;">smart-query-optimizer.vercel.app</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildContactConfirmationHtml(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>We received your message</title></head>
<body style="margin:0;padding:0;background:#050508;font-family:'Inter',Arial,sans-serif;color:#e8f4ff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050508;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#0d0d1e,#111128);border:1px solid rgba(0,212,255,0.15);border-radius:16px;padding:48px 40px;text-align:center;">
              <div style="font-size:48px;margin-bottom:20px;">✅</div>
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;background:linear-gradient(135deg,#00d4ff,#0080ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
                Message Received!
              </h1>
              <p style="margin:0 0 24px;color:#8899bb;font-size:16px;line-height:1.6;">
                Hi ${name}, thanks for reaching out to <strong style="color:#e8f4ff;">Smart Query Optimizer</strong>.<br/>
                We'll get back to you within 24–48 hours.
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/optimizer" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#00d4ff,#0080ff);color:#000;font-weight:700;font-size:14px;text-decoration:none;border-radius:8px;letter-spacing:0.05em;text-transform:uppercase;">
                Launch Optimizer →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
