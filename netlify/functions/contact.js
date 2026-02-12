const nodemailer = require("nodemailer");

exports.handler = async function (event) {
  try {
    const data = JSON.parse(event.body);
    const { name, email, phone, organization, message } = data;

    if (!name || !email || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields" }),
      };
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
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

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Thank you for contacting us",
      html: `<h3>Dear ${name},</h3><p>We will contact you shortly.</p>`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Emails sent successfully" }),
    };

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server error" }),
    };
  }
};
