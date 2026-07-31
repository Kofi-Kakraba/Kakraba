import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Make sure RESEND_API_KEY is in your .env.local and Vercel Environment Variables
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email, name, trackingCode, newPassword } = await request.json();

    const data = await resend.emails.send({
      from: 'Sparkle Admin <info@sparklebeverages.com>',
      to: email,
      subject: 'Sparkle Ambassador: Password Reset',
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; background-color: #FDFBF7; padding: 40px; border-radius: 20px; color: #1c1917;">
          <h2 style="text-transform: uppercase; font-weight: 900; letter-spacing: -0.5px;">Hello ${name},</h2>
          <p style="font-weight: 500; color: #78716c; line-height: 1.6;">Your Sparkle Ambassador portal access keys have been reset by the administration.</p>
          
          <div style="background: white; padding: 24px; border-radius: 16px; margin: 30px 0; border: 2px solid #e7e5e4;">
            <p style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; font-weight: 900; letter-spacing: 1px; color: #a8a29e;">Your Tracking Code</p>
            <p style="margin: 0 0 20px 0; font-size: 20px; font-weight: 900; color: #10b981;">${trackingCode}</p>
            
            <p style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; font-weight: 900; letter-spacing: 1px; color: #a8a29e;">Temporary Password</p>
            <p style="margin: 0; font-size: 20px; font-weight: 900; color: #1c1917; font-family: monospace;">${newPassword}</p>
          </div>
          
          <p style="font-weight: 500; color: #78716c; margin-bottom: 30px;">Please log in using these new credentials.</p>
          
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://sparklebeverages.com'}/referrer" style="display: inline-block; background: #0c0a09; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">Access Portal</a>
        </div>
      `
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Resend Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}