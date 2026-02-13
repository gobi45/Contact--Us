export const prerender = false;
import type { APIRoute } from "astro";
import nodemailer from "nodemailer";

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, email, phone, organization, message, recaptchaResponse } = data;

    if (!name || !email || !message || !recaptchaResponse) {
      return new Response(JSON.stringify({ message: "Missing fields" }), { status: 400 });
    }

    // VERIFY reCAPTCHA - ✅ FIXED
    const secretKey = import.meta.env.RECAPTCHA_SECRET_KEY || '';
    const verify = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${recaptchaResponse}`  // ✅ Fixed: Added backticks
    });
    const verifyData = await verify.json();

    if (!verifyData.success) {
      return new Response(JSON.stringify({ message: "reCAPTCHA failed" }), { status: 400 });
    }

    // BUSINESS EMAIL CHECK - ✅ Fixed: Added more domains
    const blockedDomains = [
      "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com",
      "protonmail.com", "mail.com", "live.com", "msn.com", "rediffmail.com"
    ];
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (blockedDomains.includes(emailDomain || '')) {
      return new Response(JSON.stringify({ message: "Business email required" }), { status: 400 });
    }

    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: import.meta.env.EMAIL_USER,
        pass: import.meta.env.EMAIL_PASS,
      },
    });

    // ADMIN EMAIL - ✅ CORRECTED
    await transporter.sendMail({
      from: import.meta.env.EMAIL_USER,
      to: import.meta.env.ADMIN_EMAIL,
      subject: "New GoVal Contact Form",
      html: `
        <h3>New Business Contact</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <p><strong>Org:</strong> ${organization || 'N/A'}</p>
        <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    // USER EMAIL - ✅ CORRECTED
    await transporter.sendMail({
      from: import.meta.env.EMAIL_USER,
      to: email,
      subject: "Thank You - GoVal",
      html: `
        <h3>Dear ${name},</h3>
        <p>Thank you for contacting us. We will respond soon.</p>
      `,
    });

    return new Response(JSON.stringify({ message: "Success" }), { status: 200 });
  } catch (error) {
    console.error("ERROR:", error);
    return new Response(JSON.stringify({ message: "Server error" }), { status: 500 });
  }
};
