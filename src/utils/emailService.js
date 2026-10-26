import { SendMailClient } from 'zeptomail';

const DEFAULT_ZEPTOMAIL_URL = 'api.zeptomail.in/';
const DEFAULT_FROM_ADDRESS = 'support@uttirna.in';
const DEFAULT_FROM_NAME = "JITHON '27";
const DEFAULT_ORGANIZER_EMAIL = 'support@uttirna.in';
const DEFAULT_ORGANIZER_PHONE = process.env.ORGANIZER_PHONE || '+91 98765 43210';

/**
 * Helper to initialize and return SendMailClient
 */
function getZeptoMailClient() {
  const rawToken = process.env.ZOHO_API_KEY || process.env.ZEPTOMAIL_TOKEN || '';
  if (!rawToken) {
    console.warn('⚠️ ZeptoMail warning: ZOHO_API_KEY / ZEPTOMAIL_TOKEN is not configured in .env');
    return null;
  }

  // Ensure token starts with 'Zoho-enczapikey ' as required by ZeptoMail
  const token = rawToken.trim().startsWith('Zoho-enczapikey ')
    ? rawToken.trim()
    : `Zoho-enczapikey ${rawToken.trim()}`;

  const url = process.env.ZEPTOMAIL_URL || DEFAULT_ZEPTOMAIL_URL;
  return new SendMailClient({ url, token });
}

/**
 * Collect all valid recipient emails (Leader + any registered team members)
 */
function buildRecipients(registration) {
  const recipients = [];
  const seenEmails = new Set();

  if (registration.email && registration.email.trim()) {
    const leaderEmail = registration.email.trim().toLowerCase();
    recipients.push({
      email_address: {
        address: leaderEmail,
        name: registration.name ? registration.name.trim() : 'Team Leader',
      },
    });
    seenEmails.add(leaderEmail);
  }

  if (Array.isArray(registration.members)) {
    for (const m of registration.members) {
      if (m && m.email && m.email.trim()) {
        const memberEmail = m.email.trim().toLowerCase();
        if (!seenEmails.has(memberEmail)) {
          recipients.push({
            email_address: {
              address: memberEmail,
              name: m.name ? m.name.trim() : 'Team Member',
            },
          });
          seenEmails.add(memberEmail);
        }
      }
    }
  }

  return recipients;
}

/**
 * Base email layout wrapper with modern dark-tech styling
 */
function renderEmailLayout({ title, badgeText, badgeBg, badgeColor, contentHtml, footerNote }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f17; min-height: 100vh; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #111827; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #090d16 0%, #1e1b4b 100%); padding: 32px 30px; text-align: center; border-bottom: 2px solid #22c55e;">
              <div style="display: inline-block; padding: 4px 12px; background-color: rgba(34, 197, 94, 0.15); border: 1px solid #22c55e; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #4ade80; text-transform: uppercase; margin-bottom: 12px;">
                ⚡ JIT COLLEGE OF ENGINEERING
              </div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; text-transform: uppercase;">
                JITHON <span style="color: #4ade80;">'27</span>
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; letter-spacing: 0.5px;">
                Annual 36-Hour National Level Hackathon
              </p>
            </td>
          </tr>

          <!-- Status Badge -->
          <tr>
            <td style="padding: 24px 30px 0 30px; text-align: center;">
              <span style="display: inline-block; padding: 6px 16px; background-color: ${badgeBg}; color: ${badgeColor}; border-radius: 8px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; border: 1px solid ${badgeColor}40;">
                ${badgeText}
              </span>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 24px 30px 32px 30px; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td style="background-color: #0a0e17; padding: 24px 30px; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
              ${footerNote ? `<div style="margin-bottom: 12px; color: #94a3b8;">${footerNote}</div>` : ''}
              <div>
                🏛️ Organized by the <strong>Department of Computer Engineering & Innovation Cell</strong>
              </div>
              <div style="margin-top: 4px;">
                JIT College of Engineering, Campus Labs & Auditorium
              </div>
              <div style="margin-top: 8px; font-size: 11px; color: #475569;">
                This is an automated notification from JITHON '27 Registration Portal.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 1. Send Registration Received / Pending Acknowledgment Email
 */
export async function sendRegistrationReceivedEmail(registration) {
  const client = getZeptoMailClient();
  if (!client) return false;

  const recipients = buildRecipients(registration);
  if (recipients.length === 0) {
    console.warn('⚠️ No recipients found for registration:', registration._id);
    return false;
  }

  const teamName = registration.teamName || 'Your Team';
  const leaderName = registration.name || 'Team Leader';
  const confCode = registration.confirmationCode || 'PENDING';
  const domain = registration.technologyDomain || 'Open Innovation';
  const txId = registration.transactionId || 'N/A';
  const membersCount = 1 + (Array.isArray(registration.members) ? registration.members.length : 0);

  const contentHtml = `
    <h2 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 0 0 14px 0;">
      Registration Received, ${leaderName}!
    </h2>
    <p style="margin: 0 0 16px 0; color: #94a3b8; font-size: 14px;">
      We have successfully received your application for team <strong style="color: #ffffff;">${teamName}</strong>. 
      Your payment details and transaction screenshot are currently queued for verification by the JIT Admin Desk.
    </p>

    <!-- Details Card -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; margin: 20px 0; padding: 18px 20px; font-size: 13px;">
      <tr>
        <td style="padding: 6px 0; color: #94a3b8; width: 40%;">APPLICATION ID:</td>
        <td style="padding: 6px 0; color: #4ade80; font-family: monospace; font-weight: 700; font-size: 15px;">${confCode}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #94a3b8;">TEAM NAME:</td>
        <td style="padding: 6px 0; color: #ffffff; font-weight: 600;">${teamName}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #94a3b8;">TRACK / DOMAIN:</td>
        <td style="padding: 6px 0; color: #38bdf8; font-weight: 600;">${domain}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #94a3b8;">TEAM SIZE:</td>
        <td style="padding: 6px 0; color: #ffffff;">${membersCount} Hacker(s)</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #94a3b8;">TRANSACTION ID:</td>
        <td style="padding: 6px 0; color: #fbbf24; font-family: monospace;">${txId}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #94a3b8;">STATUS:</td>
        <td style="padding: 6px 0; color: #f59e0b; font-weight: 700;">PENDING ADMIN APPROVAL ⏳</td>
      </tr>
    </table>

    <div style="background-color: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 4px; margin-top: 20px; font-size: 13px; color: #fcd34d;">
      <strong>What happens next?</strong><br>
      Our registration team verifies payments in real time. Once your transaction is confirmed, you will automatically receive an official <strong>Admission Entry Pass</strong> with venue and schedule guidelines.
    </div>
  `;

  const htmlbody = renderEmailLayout({
    title: `JITHON '27 - Registration Received [${confCode}]`,
    badgeText: 'Registration Under Review ⏳',
    badgeBg: '#451a03',
    badgeColor: '#fbbf24',
    contentHtml,
    footerNote: `Questions? Email our organizers at <a href="mailto:${DEFAULT_ORGANIZER_EMAIL}" style="color: #4ade80; text-decoration: none;">${DEFAULT_ORGANIZER_EMAIL}</a>`,
  });

  try {
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || DEFAULT_FROM_ADDRESS;
    const fromName = process.env.EMAIL_FROM_NAME || DEFAULT_FROM_NAME;

    const response = await client.sendMail({
      from: { address: fromAddress, name: fromName },
      to: recipients,
      subject: `[Pending Verification] JITHON '27 Registration Received - ${teamName} (${confCode})`,
      htmlbody,
    });

    console.log(`✉️ ZeptoMail: Registration received email dispatched for team "${teamName}" [${confCode}]`);
    return response;
  } catch (error) {
    await handleZeptoMailError('sendRegistrationReceivedEmail', error);
    return false;
  }
}

/**
 * 2. Send Official Approved Pass Email
 */
export async function sendRegistrationApprovedEmail(registration) {
  const client = getZeptoMailClient();
  if (!client) return false;

  const recipients = buildRecipients(registration);
  if (recipients.length === 0) return false;

  const teamName = registration.teamName || 'Your Team';
  const leaderName = registration.name || 'Team Leader';
  const confCode = registration.confirmationCode || 'CONFIRMED';
  const domain = registration.technologyDomain || 'Hackathon Track';
  const venue = registration.venue || 'JIT Campus Labs & Auditorium';

  const contentHtml = `
    <h2 style="color: #4ade80; font-size: 22px; font-weight: 900; margin: 0 0 12px 0;">
      🎉 Congratulations! Your Registration is Confirmed & Payment is Verified.
    </h2>
    <p style="margin: 0 0 18px 0; color: #cbd5e1; font-size: 14px;">
      Hi <strong style="color: #ffffff;">${leaderName}</strong>, your payment and application for team <strong style="color: #ffffff;">${teamName}</strong> have been officially <strong>verified and approved</strong>!
    </p>

    <!-- Official Ticket Box -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #14532d 0%, #064e3b 100%); border: 2px solid #22c55e; border-radius: 14px; margin: 20px 0; padding: 22px; box-shadow: 0 8px 24px rgba(34, 197, 94, 0.25);">
      <tr>
        <td colspan="2" style="border-bottom: 1px dashed rgba(255, 255, 255, 0.25); padding-bottom: 12px; margin-bottom: 12px;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #86efac; text-transform: uppercase;">
            OFFICIAL ADMISSION HACKER PASS
          </div>
          <div style="font-size: 24px; font-weight: 900; color: #ffffff; font-family: monospace; letter-spacing: 1px; margin-top: 4px;">
            ${confCode}
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0 4px 0; color: #bbf7d0; font-size: 12px; width: 35%;">TEAM:</td>
        <td style="padding: 10px 0 4px 0; color: #ffffff; font-weight: 700; font-size: 15px;">${teamName}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #bbf7d0; font-size: 12px;">TEAM LEADER:</td>
        <td style="padding: 4px 0; color: #ffffff; font-weight: 600;">${leaderName}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #bbf7d0; font-size: 12px;">TRACK:</td>
        <td style="padding: 4px 0; color: #67e8f9; font-weight: 600;">${domain}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #bbf7d0; font-size: 12px;">VENUE:</td>
        <td style="padding: 4px 0; color: #fef08a; font-weight: 600;">${venue}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #bbf7d0; font-size: 12px;">STATUS:</td>
        <td style="padding: 4px 0; color: #86efac; font-weight: 800;">CONFIRMED & CLEARED ✅</td>
      </tr>
    </table>

    <div style="background-color: #1e293b; border-radius: 10px; padding: 16px; margin-top: 20px; font-size: 13px; color: #cbd5e1;">
      <div style="font-weight: 700; color: #ffffff; margin-bottom: 8px;">📋 Check-In Instructions:</div>
      <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
        <li>Keep this email / Application ID (<strong>${confCode}</strong>) accessible on your phone at entry.</li>
        <li>Every team member must carry their valid original College ID Card.</li>
        <li>Arrive at the JIT Campus registration desk at least 45 minutes prior to the opening ceremony.</li>
      </ul>
    </div>
  `;

  const htmlbody = renderEmailLayout({
    title: `JITHON '27 - Official Entry Pass [${confCode}]`,
    badgeText: 'Registration Approved & Confirmed ✅',
    badgeBg: '#052e16',
    badgeColor: '#4ade80',
    contentHtml,
    footerNote: `See you at the arena! For campus directions & support: <a href="mailto:${DEFAULT_ORGANIZER_EMAIL}" style="color: #4ade80; text-decoration: none;">${DEFAULT_ORGANIZER_EMAIL}</a>`,
  });

  try {
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || DEFAULT_FROM_ADDRESS;
    const fromName = process.env.EMAIL_FROM_NAME || DEFAULT_FROM_NAME;

    const response = await client.sendMail({
      from: { address: fromAddress, name: fromName },
      to: recipients,
      subject: `🎉 Official Entry Pass: JITHON '27 - Team ${teamName} [${confCode}]`,
      htmlbody,
    });

    console.log(`✉️ ZeptoMail: Official approval entry pass sent for team "${teamName}" [${confCode}]`);
    return response;
  } catch (error) {
    await handleZeptoMailError('sendRegistrationApprovedEmail', error);
    return false;
  }
}

/**
 * 3. Send Registration Rejected / Action Required Email
 */
export async function sendRegistrationRejectedEmail(registration, reason) {
  const client = getZeptoMailClient();
  if (!client) return false;

  const recipients = buildRecipients(registration);
  if (recipients.length === 0) return false;

  const teamName = registration.teamName || 'Your Team';
  const leaderName = registration.name || 'Team Leader';
  const confCode = registration.confirmationCode || 'N/A';
  const organizerEmail = process.env.ORGANIZER_EMAIL || DEFAULT_ORGANIZER_EMAIL;
  const organizerPhone = process.env.ORGANIZER_PHONE || DEFAULT_ORGANIZER_PHONE;

  const contentHtml = `
    <h2 style="color: #f87171; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">
      ⚠️ Payment verification issue with Your Registration
    </h2>
    <p style="margin: 0 0 16px 0; color: #cbd5e1; font-size: 14px;">
      Hi <strong style="color: #ffffff;">${leaderName}</strong>, our administrative team was unable to verify the payment or transaction details submitted for team <strong style="color: #ffffff;">${teamName}</strong>.
    </p>

    <!-- Details Card -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #1e293b; border: 1px solid #7f1d1d; border-radius: 12px; margin: 18px 0; padding: 18px 20px; font-size: 13px;">
      <tr>
        <td style="padding: 6px 0; color: #94a3b8; width: 40%;">APPLICATION ID:</td>
        <td style="padding: 6px 0; color: #ffffff; font-family: monospace; font-weight: 700;">${confCode}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #94a3b8;">TEAM NAME:</td>
        <td style="padding: 6px 0; color: #ffffff; font-weight: 600;">${teamName}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #94a3b8;">TRANSACTION REF:</td>
        <td style="padding: 6px 0; color: #fca5a5; font-family: monospace;">${registration.transactionId || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #94a3b8;">STATUS:</td>
        <td style="padding: 6px 0; color: #f87171; font-weight: 700;">VERIFICATION REJECTED ❌</td>
      </tr>
      ${
        reason
          ? `
      <tr>
        <td style="padding: 6px 0; color: #94a3b8;">NOTE / REASON:</td>
        <td style="padding: 6px 0; color: #fca5a5;">${reason}</td>
      </tr>`
          : ''
      }
    </table>

    <!-- Call Organizers Box -->
    <div style="background: linear-gradient(135deg, #450a0a 0%, #1e1111 100%); border: 2px solid #ef4444; border-radius: 12px; padding: 20px; margin-top: 20px; color: #fecaca;">
      <div style="font-size: 15px; font-weight: 800; color: #ffffff; margin-bottom: 8px;">
        📞 ACTION REQUIRED: Contact the Organizers Team
      </div>
      <p style="margin: 0 0 14px 0; font-size: 13px; line-height: 1.5; color: #fca5a5;">
        Please contact our organizing committee immediately to clarify your transaction, share your payment receipt, and clear your team's entry pass.
      </p>
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #fecaca; font-weight: 600; width: 35%;">Direct Phone / Helpline:</td>
          <td style="padding: 6px 0;">
            <a href="tel:${organizerPhone}" style="color: #4ade80; font-weight: 700; text-decoration: none; font-size: 14px;">${organizerPhone}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #fecaca; font-weight: 600;">Support Email:</td>
          <td style="padding: 6px 0;">
            <a href="mailto:${organizerEmail}" style="color: #38bdf8; font-weight: 700; text-decoration: none; font-size: 14px;">${organizerEmail}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #fecaca; font-weight: 600;">Desk:</td>
          <td style="padding: 6px 0; color: #ffffff;">JIT Innovation Cell & Computer Engineering Dept.</td>
        </tr>
      </table>
    </div>
  `;

  const htmlbody = renderEmailLayout({
    title: `JITHON '27 - Action Required [${confCode}]`,
    badgeText: 'Verification Issue / Action Required ⚠️',
    badgeBg: '#4c0519',
    badgeColor: '#fb7185',
    contentHtml,
    footerNote: `Please contact <a href="mailto:${organizerEmail}" style="color: #f87171; text-decoration: none;">${organizerEmail}</a> or call ${organizerPhone} immediately.`,
  });

  try {
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || DEFAULT_FROM_ADDRESS;
    const fromName = process.env.EMAIL_FROM_NAME || DEFAULT_FROM_NAME;

    const response = await client.sendMail({
      from: { address: fromAddress, name: fromName },
      to: recipients,
      subject: `⚠️ Action Required: JITHON '27 Registration Verification - Team ${teamName} (${confCode})`,
      htmlbody,
    });

    console.log(`✉️ ZeptoMail: Rejection/Action-required email sent for team "${teamName}" [${confCode}]`);
    return response;
  } catch (error) {
    await handleZeptoMailError('sendRegistrationRejectedEmail', error);
    return false;
  }
}

/**
 * Handle and log ZeptoMail error responses clearly
 */
async function handleZeptoMailError(context, error) {
  console.error(`❌ ZeptoMail Error in ${context}:`);
  if (error && typeof error.json === 'function') {
    try {
      const errorBody = await error.json();
      console.error('Details:', JSON.stringify(errorBody, null, 2));
    } catch (_) {
      console.error(error.statusText || error.message || error);
    }
  } else {
    console.error(error?.message || error);
  }
}
