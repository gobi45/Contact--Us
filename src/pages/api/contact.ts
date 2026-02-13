export const prerender = false;

import type { APIRoute } from "astro";
import nodemailer from "nodemailer";

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, email, phone, organization, message } = data;
    const { name, email, phone, organization, message, recaptchaResponse } = data;

    if (!name || !email || !message || !recaptchaResponse) {
      return new Response(JSON.stringify({ message: "Missing fields" }), { status: 400 });
    }

    // VERIFY reCAPTCHA
    const secretKey = import.meta.env.RECAPTCHA_SECRET_KEY || '';
    const verify = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${recaptchaResponse}`
    });
    const verifyData = await verify.json();

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ message: "Missing required fields" }),
        { status: 400 }
      );
    if (!verifyData.success) {
      return new Response(JSON.stringify({ message: "reCAPTCHA failed" }), { status: 400 });
    }

    // BUSINESS EMAIL CHECK
    const blockedDomains = ["gmail.com","yahoo.com","hotmail.com","outlook.com","aol.com","icloud.com"];
    if (blockedDomains.includes(email.split('@')[1]?.toLowerCase() || '')) {
      return new Response(JSON.stringify({ message: "Business email required" }), { status: 400 });
    }

    const transporter = nodemailer.createTransport({
@@ -23,42 +38,25 @@ export const POST: APIRoute = async ({ request }) => {
      },
    });

    // ADMIN EMAIL
    await transporter.sendMail({
      from: import.meta.env.EMAIL_USER,
      to: import.meta.env.ADMIN_EMAIL,
      subject: "New Contact Form Submission",
      html: `
        <h3>New Contact Request</h3>
        <p>Name: ${name}</p>
        <p>Email: ${email}</p>
        <p>Phone: ${phone || "Not provided"}</p>
        <p>Organization: ${organization || "Not provided"}</p>
        <p>Message: ${message}</p>
      `,
      subject: "New GoVal Contact Form",
      html: `<h3>New Contact</h3><p>Name: ${name}</p><p>Email: ${email}</p><p>Phone: ${phone || 'N/A'}</p><p>Org: ${organization || 'N/A'}</p><p>Message: ${message}</p>`
    });

    // USER EMAIL
    await transporter.sendMail({
      from: import.meta.env.EMAIL_USER,
      to: email,
      subject: "Thank you for contacting us",
      html: `
        <h3>Dear ${name},</h3>
        <p>Thank you for contacting us.</p>
        <p>We will get back to you shortly.</p>
      `,
      subject: "Thank You - GoVal",
      html: `<h3>Dear ${name},</h3><p>Thank you for contacting us. We will respond soon.</p>`
    });

    return new Response(
      JSON.stringify({ message: "Emails sent successfully" }),
      { status: 200 }
    );

    return new Response(JSON.stringify({ message: "Success" }), { status: 200 });
  } catch (error) {
    console.error("FULL ERROR:", error);

    return new Response(
      JSON.stringify({ message: "Server error while sending email" }),
      { status: 500 }
    );
    console.error("ERROR:", error);
    return new Response(JSON.stringify({ message: "Server error" }), { status: 500 });
  }
};
};