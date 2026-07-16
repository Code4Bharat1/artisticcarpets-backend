import nodemailer from "nodemailer";

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: parseInt(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

const FROM = `"${process.env.EMAIL_FROM_NAME || "Artistic Carpets"}" <${process.env.EMAIL_FROM}>`;

// ─── Base layout ────────────────────────────────────────────────────────────

const emailLayout = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Artistic Carpets</title>
</head>
<body style="margin:0;padding:0;background:#F8F5EF;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F5EF;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#8B0000;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#C9A46A;font-family:'Georgia',serif;font-size:26px;letter-spacing:3px;text-transform:uppercase;">Artistic Carpets</h1>
            <p style="margin:4px 0 0;color:#F8F5EF;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Luxury Handcrafted Rugs</p>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:40px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F8F5EF;padding:24px 40px;text-align:center;border-top:1px solid #ECE3D5;">
            <p style="margin:0;color:#777;font-size:12px;">© ${new Date().getFullYear()} Artistic Carpets. All rights reserved.</p>
            <p style="margin:8px 0 0;color:#777;font-size:11px;">You received this email because you have an account with us.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ─── Send helpers ────────────────────────────────────────────────────────────

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  const info = await transporter.sendMail({ from: FROM, to, subject, html });
  console.log(`📧 Email sent: ${info.messageId}`);
  return info;
};

// ─── Email templates ─────────────────────────────────────────────────────────

export const sendVerificationEmail = async (user, verificationUrl) => {
  const html = emailLayout(`
    <h2 style="color:#8B0000;margin-top:0;">Verify Your Email</h2>
    <p style="color:#2D2D2D;line-height:1.7;">Hello <strong>${user.firstName}</strong>,</p>
    <p style="color:#2D2D2D;line-height:1.7;">Thank you for creating your Artistic Carpets account. Please verify your email address to get started.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${verificationUrl}" style="background:#8B0000;color:#C9A46A;padding:14px 36px;border-radius:6px;text-decoration:none;font-size:14px;letter-spacing:1px;text-transform:uppercase;font-family:Georgia,serif;">Verify Email</a>
    </div>
    <p style="color:#777;font-size:13px;">This link expires in 24 hours. If you did not create this account, please ignore this email.</p>
  `);
  await sendEmail({ to: user.email, subject: "Verify Your Email — Artistic Carpets", html });
};

export const sendPasswordResetEmail = async (user, resetUrl) => {
  const html = emailLayout(`
    <h2 style="color:#8B0000;margin-top:0;">Reset Your Password</h2>
    <p style="color:#2D2D2D;line-height:1.7;">Hello <strong>${user.firstName}</strong>,</p>
    <p style="color:#2D2D2D;line-height:1.7;">We received a request to reset your password. Click the button below to create a new one.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${resetUrl}" style="background:#8B0000;color:#C9A46A;padding:14px 36px;border-radius:6px;text-decoration:none;font-size:14px;letter-spacing:1px;text-transform:uppercase;font-family:Georgia,serif;">Reset Password</a>
    </div>
    <p style="color:#777;font-size:13px;">This link expires in 10 minutes. If you did not request this, please secure your account immediately.</p>
  `);
  await sendEmail({ to: user.email, subject: "Password Reset Request — Artistic Carpets", html });
};

export const sendOrderConfirmationEmail = async (user, order) => {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #ECE3D5;color:#2D2D2D;font-size:14px;">${item.name}</td>
      <td style="padding:10px;border-bottom:1px solid #ECE3D5;color:#2D2D2D;font-size:14px;text-align:center;">${item.quantity}</td>
      <td style="padding:10px;border-bottom:1px solid #ECE3D5;color:#2D2D2D;font-size:14px;text-align:right;">₹${item.totalPrice.toLocaleString()}</td>
    </tr>`).join("");

  const html = emailLayout(`
    <h2 style="color:#8B0000;margin-top:0;">Order Confirmed</h2>
    <p style="color:#2D2D2D;line-height:1.7;">Hello <strong>${user.firstName}</strong>,</p>
    <p style="color:#2D2D2D;line-height:1.7;">Thank you for your order! We're preparing your luxury carpet with great care.</p>
    <div style="background:#F8F5EF;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="margin:0;color:#8B0000;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Order Number</p>
      <p style="margin:4px 0 0;color:#2D2D2D;font-size:20px;font-weight:bold;">${order.orderNumber}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <thead>
        <tr style="background:#F8F5EF;">
          <th style="padding:10px;text-align:left;font-size:12px;color:#777;text-transform:uppercase;letter-spacing:1px;">Item</th>
          <th style="padding:10px;text-align:center;font-size:12px;color:#777;text-transform:uppercase;letter-spacing:1px;">Qty</th>
          <th style="padding:10px;text-align:right;font-size:12px;color:#777;text-transform:uppercase;letter-spacing:1px;">Price</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:12px 10px;text-align:right;color:#2D2D2D;font-weight:bold;">Total</td>
          <td style="padding:12px 10px;text-align:right;color:#8B0000;font-weight:bold;font-size:18px;">₹${order.total.toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>
  `);
  await sendEmail({ to: user.email, subject: `Order Confirmed #${order.orderNumber} — Artistic Carpets`, html });
};

export const sendOrderStatusEmail = async (user, order) => {
  const statusMessages = {
    confirmed: "Your order has been confirmed and is being prepared.",
    processing: "Your order is currently being processed.",
    shipped: `Your order has been shipped! Tracking: ${order.shipping?.trackingNumber || "N/A"}`,
    out_for_delivery: "Your order is out for delivery today!",
    delivered: "Your order has been delivered. We hope you love your new carpet!",
    cancelled: "Your order has been cancelled.",
    refunded: "Your refund has been processed.",
  };

  const message = statusMessages[order.status] || "Your order status has been updated.";

  const html = emailLayout(`
    <h2 style="color:#8B0000;margin-top:0;">Order Update</h2>
    <p style="color:#2D2D2D;line-height:1.7;">Hello <strong>${user.firstName}</strong>,</p>
    <p style="color:#2D2D2D;line-height:1.7;">${message}</p>
    <div style="background:#F8F5EF;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="margin:0;color:#777;font-size:13px;">Order: <strong>${order.orderNumber}</strong></p>
      <p style="margin:8px 0 0;color:#8B0000;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Status: <strong>${order.status.replace(/_/g, " ")}</strong></p>
    </div>
  `);
  await sendEmail({ to: user.email, subject: `Order Update #${order.orderNumber} — Artistic Carpets`, html });
};

export const sendWelcomeEmail = async (user) => {
  const html = emailLayout(`
    <h2 style="color:#8B0000;margin-top:0;">Welcome to Artistic Carpets</h2>
    <p style="color:#2D2D2D;line-height:1.7;">Hello <strong>${user.firstName}</strong>,</p>
    <p style="color:#2D2D2D;line-height:1.7;">Welcome to the world of luxury handcrafted carpets. We're delighted to have you as part of our family.</p>
    <p style="color:#2D2D2D;line-height:1.7;">Explore our curated collections of Persian, hand-knotted, and artisan rugs — each one a timeless work of art.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${process.env.CLIENT_URL}" style="background:#8B0000;color:#C9A46A;padding:14px 36px;border-radius:6px;text-decoration:none;font-size:14px;letter-spacing:1px;text-transform:uppercase;">Explore Collections</a>
    </div>
  `);
  await sendEmail({ to: user.email, subject: "Welcome to Artistic Carpets", html });
};
