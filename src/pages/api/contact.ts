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

    // ✅ VERIFY reCAPTCHA
    const secretKey = import.meta.env.RECAPTCHA_SECRET_KEY;

    const verify = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=${recaptchaResponse}`,
    });

    const verifyData = await verify.json();

    if (!verifyData.success) {
      return new Response(JSON.stringify({ message: "reCAPTCHA failed" }), { status: 400 });
    }

    // ✅ BLOCK PERSONAL EMAILS
    const blockedDomains = ["gmail.com","yahoo.com","hotmail.com","outlook.com","aol.com","icloud.com"];
    const domain = email.split("@")[1]?.toLowerCase();

    if (blockedDomains.includes(domain)) {
      return new Response(JSON.stringify({ message: "Business email required" }), { status: 400 });
    }

    // ✅ SMTP CONFIG (IMPORTANT)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: import.meta.env.EMAIL_USER,
        pass: import.meta.env.EMAIL_PASS, // MUST be App Password
      },
    });

    // ✅ SEND MAIL TO ADMIN
    await transporter.sendMail({
      from: `"Website Contact" <${import.meta.env.EMAIL_USER}>`,
      to: import.meta.env.ADMIN_EMAIL,
      subject: "New Contact Form Submission",
      html: `
        <h3>New Contact</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone || "N/A"}</p>
        <p><b>Organization:</b> ${organization || "N/A"}</p>
        <p><b>Message:</b><br/> ${message}</p>
      `,
    });

    // ✅ AUTO-REPLY TO USER
    await transporter.sendMail({
      from: `"GoVal Team" <${import.meta.env.EMAIL_USER}>`,
      to: email,
      subject: "Thank You for Contacting Us",
      html: `
        <p>Dear ${name},</p>
        <p>Thank you for contacting us. Our team will respond shortly.</p>
        <br/>
        <p>Regards,<br/>GoVal Team</p>
      `,
    });

    return new Response(JSON.stringify({ message: "Success" }), { status: 200 });

  } catch (error) {
    console.error("MAIL ERROR:", error);
    return new Response(JSON.stringify({ message: "Server error" }), { status: 500 });
  }
};
