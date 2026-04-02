import resend
import os
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")

def send_otp_email(to_email, otp, username, risk_level):
    risk_colors = {
        "HIGH": "#ff4466",
        "MEDIUM": "#ffaa00",
        "LOW": "#00ff99"
    }
    color = risk_colors.get(risk_level, "#ffaa00")

    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background: #0a0a0f; padding: 40px; margin: 0;">
        <div style="max-width: 480px; margin: auto; background: #12121a; border-radius: 16px; padding: 40px; border: 1px solid {color}30;">
            
            <h1 style="color: {color}; margin: 0 0 8px 0;">🛡️ ATO Shield</h1>
            <p style="color: #888; font-size: 13px; margin: 0 0 24px 0;">Security Alert</p>
            
            <p style="color: #ccc;">Hi <b style="color: #fff;">{username}</b>,</p>
            <p style="color: #ccc;">We detected a <b style="color: {color};">{risk_level} RISK</b> login attempt on your account. Please verify with the OTP below.</p>
            
            <div style="text-align: center; margin: 32px 0; background: #1a1a2e; border-radius: 12px; padding: 24px;">
                <p style="color: #888; font-size: 12px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px;">One-Time Password</p>
                <h1 style="color: {color}; letter-spacing: 12px; font-size: 48px; margin: 0; font-family: monospace;">{otp}</h1>
                <p style="color: #555; font-size: 12px; margin: 12px 0 0 0;">⏱ Expires in 5 minutes</p>
            </div>
            
            <p style="color: #555; font-size: 12px; border-top: 1px solid #ffffff10; padding-top: 16px;">
                If this wasn't you, your account may be under attack. Change your password immediately.
            </p>
        </div>
    </body>
    </html>
    """

    resend.Emails.send({
        "from": "ATO Shield <onboarding@resend.dev>",
        "to": [to_email],
        "subject": f"🛡️ ATO Shield — {risk_level} Risk Login Detected",
        "html": html
    })