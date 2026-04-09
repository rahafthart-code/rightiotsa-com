import os
from typing import Optional

import resend


def get_resend_client() -> None:
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        # Don't raise error - allow graceful fallback for testing
        print("[EMAIL] RESEND_API_KEY not set - email sending will fail gracefully")
        raise RuntimeError("RESEND_API_KEY is not set")
    resend.api_key = api_key


def build_otp_email_html(code: str, full_name: Optional[str] = None) -> str:
    display_name = full_name or "there"
    return f"""
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Your Right Login Code</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background-color:#f4f5fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5fb;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;box-shadow:0 8px 24px rgba(15,23,42,0.08);overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#0f766e,#14b8a6);padding:20px 24px;color:#ecfeff;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="left" style="font-size:20px;font-weight:600;letter-spacing:0.02em;">
                      Right
                    </td>
                    <td align="right" style="font-size:12px;opacity:0.9;">
                      Secure Sign-In Code
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 24px 8px 24px;color:#0f172a;">
                <p style="margin:0 0 12px 0;font-size:16px;">Hi {display_name},</p>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#475569;">
                  Use the following one-time passcode to securely sign in to your Right dashboard.
                  This code is valid for <strong>5 minutes</strong>.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:8px 24px 16px 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                  <tr>
                    <td style="background-color:#0f172a;color:#e5f3ff;padding:14px 32px;border-radius:999px;font-size:24px;letter-spacing:0.45em;font-weight:600;text-align:center;">
                      {code}
                    </td>
                  </tr>
                </table>
                <p style="margin:16px 0 0 0;font-size:12px;color:#64748b;">
                  For your security, do not share this code with anyone. Right will never ask you for this code in a call or message.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 24px 24px;color:#64748b;font-size:12px;line-height:1.6;border-top:1px solid #e2e8f0;">
                <p style="margin:8px 0 0 0;">
                  If you did not request this code, you can safely ignore this email.
                </p>
                <p style="margin:8px 0 0 0;color:#94a3b8;">
                  &copy; {2026} Right. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""


def send_otp_email(to_email: str, code: str, full_name: Optional[str] = None) -> None:
    get_resend_client()
    from_email = os.getenv("RESEND_FROM_EMAIL", "no-reply@right.app")

    html = build_otp_email_html(code=code, full_name=full_name)

    resend.Emails.send(
        {
            "from": from_email,
            "to": [to_email],
            "subject": "Your Right sign-in code",
            "html": html,
        }
    )

