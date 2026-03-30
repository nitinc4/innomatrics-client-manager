const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
require('dotenv').config();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env");
  process.exit(1);
}

// Models (Simplified for standalone script)
const SettingsSchema = new mongoose.Schema({
  reminderEmail: String,
  remindBefore: Number,
  smtpUser: String,
  smtpPass: String,
  smtpHost: String,
  smtpPort: Number,
});
const Settings = mongoose.model('Settings', SettingsSchema);

const ClientSchema = new mongoose.Schema({
  name: String,
  contactNumber: String,
  callback: String,
  reminderSent: { type: Boolean, default: false },
  isDiscarded: { type: Boolean, default: false },
});
const Client = mongoose.model('Client', ClientSchema);

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for Reminder Service");
  } catch (err) {
    console.error("DB Connection Error:", err);
  }
}

async function sendEmail(settings, client) {
  const transporter = nodemailer.createTransport({
    host: settings.smtpHost || 'smtp.gmail.com',
    port: settings.smtpPort || 465,
    secure: (settings.smtpPort || 465) === 465,
    auth: {
      user: settings.smtpUser || process.env.SMTP_USER,
      pass: settings.smtpPass || process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Innomatrics CRM" <${settings.smtpUser || process.env.SMTP_USER}>`,
    to: settings.reminderEmail,
    subject: `🕒 Callback Reminder: ${client.name}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #6366f1;">Callback Reminder</h2>
        <p>You have an upcoming callback scheduled with <strong>${client.name}</strong>.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p><strong>Contact:</strong> ${client.contactNumber}</p>
        <p><strong>Scheduled Time:</strong> ${new Date(client.callback).toLocaleString()}</p>
        <br />
        <p style="font-size: 0.875rem; color: #64748b;">This is an automated reminder from your Innomatrics Client Manager.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent for client: ${client.name}`);
    return true;
  } catch (err) {
    console.error(`Failed to send email for ${client.name}:`, err);
    return false;
  }
}

async function checkReminders() {
  console.log("Checking for upcoming callbacks...");
  
  const settings = await Settings.findOne();
  if (!settings || !settings.reminderEmail) {
    console.log("Settings or reminder email not configured. Skipping.");
    return;
  }

  const now = new Date();
  const leadTimeMinutes = settings.remindBefore || 30;
  const leadTimeDate = new Date(now.getTime() + leadTimeMinutes * 60000);

  // Find clients with callback in the next 'remindBefore' minutes who haven't been notified
  const upcomingCallbacks = await Client.find({
    isDiscarded: false,
    reminderSent: false,
    callback: {
      $exists: true,
      $ne: "",
      $gte: now.toISOString(),
      $lte: leadTimeDate.toISOString()
    }
  });

  console.log(`Found ${upcomingCallbacks.length} upcoming callbacks to notify.`);

  for (const client of upcomingCallbacks) {
    const success = await sendEmail(settings, client);
    if (success) {
      client.reminderSent = true;
      await client.save();
    }
  }
}

// Run every 10 minutes
schedule.scheduleJob('*/10 * * * *', checkReminders);

// Initial check on start
connectDB().then(() => {
  checkReminders();
});
