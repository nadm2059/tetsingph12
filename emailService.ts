// src/utils/emailService.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  }
});

export const sendRsvpConfirmation = async (userEmail: string, eventTitle: string, eventDate: string) => {
  const mailOptions = {
    from: '"Campus Resource Finder" <noreply@csulb.edu>',
    to: userEmail,
    subject: `RSVP Confirmation: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #FFC72C; border-radius: 10px;">
        <h2 style="color: #002B49;">CSULB Campus Resource Finder 🎉</h2>
        <p>Hi there!</p>
        <p>Your RSVP for <strong>${eventTitle}</strong> is confirmed.</p>
        <p>📅 <strong>Date:</strong> ${eventDate}</p>
        <p>🏆 <strong>Reward:</strong> 10 Perk Points have been added to your account!</p>
        <br />
        <p style="font-size: 12px; color: #666;">See you on campus!</p>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
};