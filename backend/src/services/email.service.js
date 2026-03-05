import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || 'Exam Prep <noreply@examprep.com>';

/**
 * Send a welcome email to a new user.
 */
export async function sendWelcomeEmail(user) {
  await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: 'Welcome to Exam Prep!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome, ${user.name}! 🎉</h2>
        <p>You've successfully registered on <strong>Exam Prep</strong>.</p>
        <p>Start your preparation journey by:</p>
        <ul>
          <li>Selecting your target exam</li>
          <li>Setting your exam date</li>
          <li>Generating your personalized study plan</li>
        </ul>
        <a href="${process.env.CLIENT_URL}"
           style="background:#4F46E5;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:16px">
          Start Studying
        </a>
      </div>
    `,
  });
}

/**
 * Send a 6-digit OTP for password reset.
 */
export async function sendOtpEmail(user, otp) {
  await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: 'Your Password Reset OTP – Exam Prep',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>Use the OTP below to reset your password. It expires in <strong>15 minutes</strong>.</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;text-align:center;
                    background:#f3f4f6;padding:24px;border-radius:8px;margin:24px 0">
          ${otp}
        </div>
        <p style="color:#6b7280;font-size:14px">
          If you did not request a password reset, please ignore this email.
          Your password will not change.
        </p>
      </div>
    `,
  });
}

/**
 * Send a test results summary email.
 */
export async function sendTestResultsEmail(user, session) {
  await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: `Test Results – Score: ${session.score}%`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Test Results</h2>
        <p>Hi ${user.name},</p>
        <p>You just completed a practice test. Here's your summary:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr style="background:#f3f4f6">
            <td style="padding:8px;border:1px solid #e5e7eb">Score</td>
            <td style="padding:8px;border:1px solid #e5e7eb"><strong>${session.score}%</strong></td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb">Questions</td>
            <td style="padding:8px;border:1px solid #e5e7eb">${session.totalQuestions}</td>
          </tr>
          <tr style="background:#f3f4f6">
            <td style="padding:8px;border:1px solid #e5e7eb">Time Taken</td>
            <td style="padding:8px;border:1px solid #e5e7eb">${Math.round((session.timeTakenSecs || 0) / 60)} mins</td>
          </tr>
        </table>
        <a href="${process.env.CLIENT_URL}/test/${session.id}/results"
           style="background:#4F46E5;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">
          View Detailed Results
        </a>
      </div>
    `,
  });
}
