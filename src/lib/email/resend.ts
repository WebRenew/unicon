import { Resend } from "resend";

const FROM_EMAIL = "🦄 UNICON <noreply@notifications.unicon.sh>";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface SendTeamInviteParams {
  to: string;
  teamName: string;
  inviterName: string;
  inviteUrl: string;
}

export async function sendTeamInviteEmail({
  to,
  teamName,
  inviterName,
  inviteUrl,
}: SendTeamInviteParams) {
  const safeTeamName = escapeHtml(teamName);
  const safeInviterName = escapeHtml(inviterName);

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `You're invited to join ${teamName} on Unicon`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="margin-bottom: 32px;">
          <strong style="font-size: 18px; color: #000;">Unicon</strong>
        </div>
        <p style="font-size: 15px; color: #333; line-height: 1.6; margin: 0 0 16px;">
          ${safeInviterName} invited you to join <strong>${safeTeamName}</strong> on Unicon.
        </p>
        <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 0 0 24px;">
          As a team member, you'll get access to shared icon bundles curated by the team.
        </p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 10px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
          Accept Invite
        </a>
        <p style="font-size: 12px; color: #999; margin-top: 32px; line-height: 1.5;">
          This invite expires in 7 days. If you didn't expect this email, you can safely ignore it.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send team invite email:", error);
    throw new Error(`Failed to send invite email: ${error.message}`);
  }
}
