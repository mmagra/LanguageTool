const nodemailer = require('nodemailer');

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

const sendPasswordResetEmail = async (toEmail, resetLink, firstName) => {
    const transporter = createTransporter();
    await transporter.sendMail({
        from: `"${process.env.APP_NAME || 'Spoken Edge'}" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: 'Password Reset Request',
        html: `
            <h2>Password Reset</h2>
            <p>Hi ${firstName || 'there'},</p>
            <p>You requested a password reset. Click the link below to set a new password:</p>
            <p><a href="${resetLink}" style="background:#4F46E5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Reset Password</a></p>
            <p>This link expires in 1 hour. If you did not request this, please ignore this email.</p>
        `
    });
};

// Generic transactional email helper (billing links, payment notices, etc.)
const sendEmail = async ({ to, subject, html }) => {
    const transporter = createTransporter();
    await transporter.sendMail({
        from: `"${process.env.APP_NAME || 'Spoken Edge'}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
    });
};

module.exports = { sendPasswordResetEmail, sendEmail };
