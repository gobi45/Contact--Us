import type { APIRoute } from "astro";
import nodemailer from "nodemailer";

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, email, phone, organization, message, recaptcha_token } = data;

    // Required fields check (ONCE)
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ message: "Missing required fields" }),
        { status: 400 }
      );
    }
    // Business email check (ONCE)
    const blockedDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com"];
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (blockedDomains.includes(emailDomain || '')) {
      return new Response(
        JSON.stringify({ message: "Business email required" }),
        { status: 400 }
      );
    }

    // Verify reCAPTCHA (optional - won't block email)
    let recaptchaValid = true;
    if (recaptcha_token) {
      const secretKey = import.meta.env.RECAPTCHA_SECRET_KEY;
      const verify = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${secretKey}&response=${recaptcha_token}`,
      });
      const verifyData = await verify.json();
      recaptchaValid = verifyData.success;
    }
console.log("EMAIL_USER:", import.meta.env.EMAIL_USER);
    // Create transporter with your Gmail SMTP
    const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: import.meta.env.EMAIL_USER,
    pass: import.meta.env.EMAIL_PASS,
  },
});
    // Email to ADMIN
    await transporter.sendMail({
      from: `"GoVal Contact" <${import.meta.env.EMAIL_USER}>`,
      to: import.meta.env.ADMIN_EMAIL || import.meta.env.EMAIL_USER,
      subject: "New GoVal Contact Form Submission",
      html: `
        <h2>New Contact Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Organization:</strong> ${organization || 'Not provided'}</p>
        <p><strong>Message:</strong><br>${message}</p>
        <p><strong>reCAPTCHA:</strong> ${recaptchaValid ? 'Passed' : 'Failed'}</p>
      `,
    });

    // Email to USER
    await transporter.sendMail({
      from: `"GoVal Team" <${import.meta.env.EMAIL_USER}>`,
      to: email,
      subject: `Thank You ${name} - GoVal Contact Received`,
      html: `
        <h2>Dear ${name},</h2>
        <p>Thank you for contacting GoVal!</p>
        <p>We have received your message and will get back to you within 24 hours.</p>
        <p>Best regards,<br>The GoVal Team</p>
      `,
    });

    return new Response(
      JSON.stringify({ message: "Emails sent successfully" }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Contact form error:", error);
    return new Response(
      JSON.stringify({ message: "Server error sending email" }),
      { status: 500 }
    );
  }
};
