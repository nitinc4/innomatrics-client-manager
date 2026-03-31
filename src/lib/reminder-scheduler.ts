import nodeSchedule from 'node-schedule';
import nodemailer from 'nodemailer';
import Client from '@/models/Client';
import Settings from '@/models/Settings';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

async function sendEmailToRecipients(settings: any, client: any, recipients: string[]) {
  if (!recipients || recipients.length === 0) return false;

  // Use settings config if available, otherwise fallback to env
  const transporter = nodemailer.createTransport({
    host: settings.smtpHost || 'smtp.gmail.com',
    port: parseInt(settings.smtpPort) || 465,
    secure: (parseInt(settings.smtpPort) || 465) === 465,
    auth: {
      user: settings.smtpUser || process.env.SMTP_USER,
      pass: settings.smtpPass || process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Innomatrics CRM" <${settings.smtpUser || process.env.SMTP_USER}>`,
    to: recipients.join(', '),
    subject: `🕒 Callback Reminder: ${client.name}`,
    html: `
      <div style="font-family: sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; max-width: 500px;">
        <div style="margin-bottom: 20px;">
          <h2 style="color: #4f46e5; margin: 0; font-size: 1.5rem;">Callback Reminder</h2>
          <p style="color: #64748b; margin-top: 4px;">Organization Task Notification</p>
        </div>
        
        <div style="background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
          <p style="margin: 0; color: #475569; font-size: 0.875rem;">Client Name</p>
          <h3 style="margin: 4px 0 0; color: #0f172a;">${client.name}</h3>
        </div>

        <p style="color: #475569; line-height: 1.6;">You have a scheduled callback for this client. Please ensure you are prepared for the contact.</p>
        
        <div style="margin: 24px 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          <div style="display: flex; margin-bottom: 8px;">
            <strong style="width: 100px; color: #64748b;">Contact:</strong>
            <span style="color: #0f172a;">${client.contactNumber}</span>
          </div>
          <div style="display: flex;">
            <strong style="width: 100px; color: #64748b;">Time:</strong>
            <span style="color: #0f172a;">${new Date(client.callback).toLocaleString()}</span>
          </div>
        </div>
        
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="font-size: 0.75rem; color: #94a3b8; text-align: center;">Sent by Innomatrics Client Manager Service</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Reminder Service] Reminder broadcasted to: ${recipients.join(', ')}`);
    return true;
  } catch (err) {
    console.error(`[Reminder Service] Delivery failed for ${client.name}:`, err);
    return false;
  }
}

export async function checkReminders() {
  try {
    console.log("[Reminder Service] Scanning for pending callback notifications...");
    await dbConnect();

    const settings = await Settings.findOne();
    if (!settings) return;

    // Fetch all active admins to include in all notifications
    const admins = await User.find({ role: 'admin', status: 'active' });
    const adminEmails = admins.map(a => a.email).filter(Boolean);

    const now = new Date();
    const leadTimeMinutes = settings.remindBefore || 60; // Default to 1 hour
    const leadTimeDate = new Date(now.getTime() + leadTimeMinutes * 60000);

    const upcomingCallbacks = await Client.find({
      isDiscarded: false,
      reminderSent: { $ne: true },
      callback: { $exists: true, $ne: "" }
    });

    console.log(`[Reminder Service] Raw pending callbacks from DB: ${upcomingCallbacks.length}`);
    console.log(`[Reminder Service] Active Admin Emails: ${adminEmails.join(', ') || 'NONE'}`);

    const toNotify = upcomingCallbacks.filter(client => {
      // Handle datetime-local strings by assuming IST (+05:30) if no timezone is present
      const callbackStr = client.callback.includes('Z') || client.callback.includes('+') 
        ? client.callback 
        : `${client.callback}+05:30`;
        
      const callbackDate = new Date(callbackStr);
      if (isNaN(callbackDate.getTime())) return false;

      // Include anything from 30 mins ago up to leadTimeDate 
      // catching recently passed ones that haven't been sent yet
      const startTime = new Date(now.getTime() - 30 * 60000); 
      const isDue = callbackDate >= startTime && callbackDate <= leadTimeDate;
      
      if (isDue) {
        console.log(`[Reminder Service] MATCH: ${client.name} | Callback: ${callbackDate.toISOString()} | Server now: ${now.toISOString()}`);
      }
      return isDue;
    });

    if (toNotify.length === 0) {
      if (upcomingCallbacks.length > 0) {
        console.log(`[Reminder Service] All ${upcomingCallbacks.length} raw callbacks were outside the active window (${leadTimeMinutes} mins ahead, 30 mins behind).`);
      }
      return;
    }

    console.log(`[Reminder Service] Processing ${toNotify.length} priority notifications.`);

    for (const client of toNotify) {
      const recipients = [...adminEmails];
      
      // Find the assigned employee
      if (client.assign && client.assign !== 'admin') {
        const assignedUser = await User.findOne({ username: client.assign });
        if (assignedUser && assignedUser.email && !recipients.includes(assignedUser.email)) {
          recipients.push(assignedUser.email);
        }
      }

      console.log(`[Reminder Service] Attempting delivery for ${client.name} to: ${recipients.join(', ') || 'NO RECIPIENTS FOUND'}`);
      
      if (recipients.length === 0) {
        console.warn(`[Reminder Service] Skipping ${client.name} - No email addresses found for admins or assigned user.`);
        continue;
      }

      const success = await sendEmailToRecipients(settings, client, recipients);
      if (success) {
        client.reminderSent = true;
        await client.save();
      }
    }
  } catch (error) {
    console.error("[Reminder Service] Critical scheduler error:", error);
  }
}

export function startReminderScheduler() {
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    console.log("[Reminder Service] Running in Vercel: Standard background workers disabled in favor of Cron Jobs.");
    return;
  }

  console.log("[Reminder Service] Background Worker: Active (Local)");
  
  // Run every 15 minutes for efficiency locally
  nodeSchedule.scheduleJob('*/15 * * * *', async () => {
    await checkReminders();
  });

  // Immediate first run
  checkReminders();
}
