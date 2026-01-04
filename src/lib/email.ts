// lib/email.ts
import nodemailer from "nodemailer";

const smtpConfig = {
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD, // Ini adalah App Password 16 karakter Anda
  },
};

const transporter = nodemailer.createTransport(smtpConfig);

interface SendVerificationEmailParams {
  to: string;
  token: string;
}

// Template email HTML yang professional dan responsive
const getVerificationEmailTemplate = (verificationUrl: string) => `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifikasi Email - Resto Bunda</title>
    <style>
        /* Reset CSS untuk konsistensi lintas email client */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            font-size: 32px;
            font-weight: 800;
            color: #ffffff;
            text-decoration: none;
            letter-spacing: -0.5px;
        }
        
        .tagline {
            color: #e2e8f0;
            font-size: 14px;
            margin-top: 8px;
            font-weight: 400;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        .cta-container {
            text-align: center;
            margin: 40px 0;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }
        
        .security-info {
            background-color: #f7fafc;
            border-left: 4px solid #4299e1;
            padding: 20px;
            margin: 30px 0;
            border-radius: 0 6px 6px 0;
        }
        
        .security-title {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .security-text {
            font-size: 14px;
            color: #4a5568;
            line-height: 1.5;
        }
        
        .footer {
            background-color: #1a202c;
            color: #a0aec0;
            padding: 30px;
            text-align: center;
        }
        
        .footer-text {
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        .footer-link {
            color: #667eea;
            text-decoration: none;
        }
        
        .footer-link:hover {
            text-decoration: underline;
        }
        
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
            margin: 30px 0;
        }
        
        /* Responsive Design */
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 0;
                box-shadow: none;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .footer {
                padding: 20px;
            }
            
            .greeting {
                font-size: 20px;
            }
            
            .message {
                font-size: 15px;
            }
            
            .cta-button {
                padding: 14px 28px;
                font-size: 15px;
            }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .email-container {
                background-color: #2d3748;
            }
            
            .content {
                background-color: #2d3748;
            }
            
            .greeting {
                color: #f7fafc;
            }
            
            .message {
                color: #e2e8f0;
            }
            
            .security-info {
                background-color: #4a5568;
                border-left-color: #667eea;
            }
            
            .security-title {
                color: #f7fafc;
            }
            
            .security-text {
                color: #e2e8f0;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header Section -->
        <div class="header">
            <div class="logo">Resto Bunda</div>
            <div class="tagline">Restoran</div>
        </div>
        
        <!-- Main Content -->
        <div class="content">
            <div class="greeting">Selamat Datang! 👋</div>
            
            <div class="message">
                Terima kasih telah bergabung dengan <strong>Resto Bunda</strong>, . Untuk memulai perjalanan Anda bersama kami, silakan verifikasi alamat email Anda dengan mengklik tombol di bawah ini.
            </div>
            
            <div class="cta-container">
                <a href="${verificationUrl}" class="cta-button">
                    ✅ Verifikasi Email Saya
                </a>
            </div>
            
            <div class="divider"></div>
            
            <div class="security-info">
                <div class="security-title">🔒 Informasi Keamanan</div>
                <div class="security-text">
                    Tautan verifikasi ini akan kedaluwarsa dalam <strong>24 jam</strong> untuk keamanan akun Anda. Jika Anda tidak mendaftar untuk akun GNews, Anda dapat mengabaikan email ini dengan aman.
                </div>
            </div>
            
            <div class="message">
                Jika tombol di atas tidak berfungsi, Anda dapat menyalin dan menempelkan tautan berikut ke browser Anda:
                <br><br>
                <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-text">
                © 2025 Resto Bunda. Semua hak dilindungi.
            </div>
            <div class="footer-text">
                Butuh bantuan? <a href="mailto:support@gnews.com" class="footer-link">Hubungi Support</a>
            </div>
        </div>
    </div>
</body>
</html>
`;

export async function sendVerificationEmail({
  to,
  token,
}: SendVerificationEmailParams) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;

  try {
    await transporter.sendMail({
      // [UBAH] Menggunakan SMTP_EMAIL sebagai pengirim
      from: `"SiQuiz" <${process.env.SMTP_EMAIL}>`,
      to: to,
      // [UBAH] Memperbaiki subjek email
      subject: "Verifikasi Email Anda untuk SiQuiz",
      html: getVerificationEmailTemplate(verificationUrl),
      text: `Selamat Datang di SiQuiz! Verifikasi email Anda dengan mengunjungi tautan berikut: ${verificationUrl}`,
    });
    console.log(`Verification email sent to ${to}`);
  } catch (error) {
    console.error("Gagal mengirim email verifikasi:", error);
    throw new Error("Gagal mengirim email verifikasi.");
  }
}
