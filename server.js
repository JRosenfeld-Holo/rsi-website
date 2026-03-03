import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Resend with API key from environment, or a dummy if not present for local dev
const resendApiKey = process.env.RESEND_API_KEY || 're_dummy_key_12345';
const resend = new Resend(resendApiKey);

app.post('/api/submit-nda', async (req, res) => {
    try {
        const { name, company, phone, email, propertyTitle } = req.body;

        if (!name || !company || !phone || !email || !propertyTitle) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

        // 1) Notification to Brokers
        const brokerHtml = `
      <h2>New NDA Executed: ${propertyTitle}</h2>
      <p>A new Confidentiality Agreement has been digitally signed and submitted.</p>
      <table style="width: 100%; max-width: 600px; border-collapse: collapse;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${name}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Company:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${company}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${phone}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${email}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Property:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${propertyTitle}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Timestamp:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${timestamp} EST</td></tr>
      </table>
      <p style="margin-top: 20px;">The prospect has agreed to the digital NDA terms. They have been sent an automated email with the secure offering memorandum.</p>
    `;

        // 2) Confirmation to Prospect
        const prospectHtml = `
      <h2>Retail Sites International, Inc. - NDA Confirmation</h2>
      <p>Dear ${name},</p>
      <p>Thank you for executing the Confidentiality Agreement for <strong>${propertyTitle}</strong>.</p>
      <p>As requested, you may access the confidential offering memorandum and associated financial details using the secure link below:</p>
      <div style="margin: 30px 0;">
        <a href="#" style="background-color: #C5A059; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Download Offering Memorandum</a>
      </div>
      <p>If you have any questions or require further information, please reply directly to this email or contact us by phone.</p>
      <br />
      <p>Best regards,</p>
      <p><strong>Nathan A. Werner & Paul Werner</strong><br />Retail Sites International, Inc.</p>
    `;

        // Only attempt actually sending if a real key is present, otherwise bypass for local functional testing
        if (resendApiKey !== 're_dummy_key_12345') {
            // Send to broker
            await resend.emails.send({
                from: 'NDA System <nda@retailsitesinc.com>',
                to: ['paul@retailsitesinc.com'],
                replyTo: email,
                subject: `New NDA Executed - ${propertyTitle}`,
                html: brokerHtml
            });

            // Send to prospect
            await resend.emails.send({
                from: 'Retail Sites International <deliveries@retailsitesinc.com>', // You must verify this domain in Resend
                to: email,
                subject: `Access Confirmed: Offering Memorandum for ${propertyTitle}`,
                html: prospectHtml
            });
        } else {
            console.log("Mock Email payload generated (No Resend API Key found):");
            console.log("--> Would have sent to Brokers:\n", brokerHtml);
            console.log("--> Would have sent to", email, ":\n", prospectHtml);
        }

        return res.status(200).json({ success: true, message: 'NDA processed successfully' });
    } catch (error) {
        console.error('Error processing NDA via Resend:', error);
        return res.status(500).json({ error: 'Internal server error processing NDA' });
    }
});

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, inquiry, message } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
        const inquiryType = inquiry || 'General Inquiry';

        const brokerHtml = `
      <h2>New Website Inquiry: ${inquiryType}</h2>
      <p>A new message has been submitted via the general contact form.</p>
      <table style="width: 100%; max-width: 600px; border-collapse: collapse;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${name}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${email}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${phone || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Inquiry Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${inquiryType}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Message:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd; white-space: pre-wrap;">${message || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Timestamp:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${timestamp} EST</td></tr>
      </table>
    `;

        if (resendApiKey !== 're_dummy_key_12345') {
            await resend.emails.send({
                from: 'Contact System <contact@retailsitesinc.com>',
                to: ['paul@retailsitesinc.com'],
                replyTo: email,
                subject: `New Website Inquiry: ${inquiryType}`,
                html: brokerHtml
            });
        } else {
            console.log("Mock Contact payload generated:");
            console.log("--> Would have sent to paul@retailsitesinc.com:\n", brokerHtml);
        }

        return res.status(200).json({ success: true, message: 'Inquiry sent successfully' });
    } catch (error) {
        console.error('Error processing Contact Inquiry:', error);
        return res.status(500).json({ error: 'Internal server error processing inquiry' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Express API server running on port ${PORT}`);
});
