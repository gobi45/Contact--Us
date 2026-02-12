export const prerender = false;

import type { APIRoute } from "astro";
import nodemailer from "nodemailer";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, email, phone, organization, message } = await request.json();

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ message: "Missing required fields" }),
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: import.meta.env.EMAIL_USER,
        pass: import.meta.env.EMAIL_PASS,
      },
    });

    // Email to Admin
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
    });

    // Auto reply to user
    await transporter.sendMail({
      from: import.meta.env.EMAIL_USER,
      to: email,
      subject: "Thank you for contacting us",
      html: `
        <h3>Dear ${name},</h3>
        <p>Thank you for contacting us.</p>
        <p>We will get back to you shortly.</p>
      `,
    });

    return new Response(
      JSON.stringify({ message: "Emails sent successfully" }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Error:", error);

    return new Response(
      JSON.stringify({ message: "Server error while sending email" }),
      { status: 500 }
    );
  }
};
