import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const path =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:3000"
    : process.env.NEXT_PUBLIC_APP_URL;

const emailTemplate = (
  title: string,
  content: string,
  buttonText?: string,
  buttonLink?: string
) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #333; text-align: center;">${title}</h2>
      <p style="color: #555; font-size: 14px; line-height: 1.5; text-align: center;">${content}</p>
      ${
        buttonText && buttonLink
          ? `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${buttonLink}" style="background-color: #007bff; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-size: 14px;">${buttonText}</a>
        </div>`
          : ""
      }
      <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px;">If you did not request this email, please ignore it.</p>
      <p style="font-size: 12px; color: #888; text-align: center;">Best regards,<br><strong>The Team</strong></p>
    </div>
  `;
};

export async function sendVerificationEmail(email: string, token: string) {
  const confirmLink = `${path}/new-verification?token=${token}`;

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Confirm Your Email",
    html: emailTemplate(
      "Confirm Your Email",
      "Thank you for registering with us. Please confirm your email address by clicking the button below:",
      "Verify Email",
      confirmLink
    ),
  });
}

export async function sendResetPasswordEmail(email: string, token: string) {
  const resetLink = `${path}/new-password?token=${token}`;

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Reset Your Password",
    html: emailTemplate(
      "Reset Your Password",
      "We received a request to reset your password. You can reset it by clicking the button below:",
      "Reset Password",
      resetLink
    ),
  });
}

export async function sendTwoFactorTokenEmail(email: string, token: string) {
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Your Two-Factor Authentication Code",
    html: emailTemplate(
      "Your Two-Factor Authentication Code",
      `Your two-factor authentication code is: <strong style='font-size: 18px; color: #007bff;'>${token}</strong>`
    ),
  });
}
