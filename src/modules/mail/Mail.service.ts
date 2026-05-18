import * as nodemailer from 'nodemailer';
import { MailRepository } from './Mail.repository';
import { MailType } from '@prisma/client';

// --- 1. Nodemailer Transporter Setup ---
// This uses the environment variables we added above
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// --- 2. Utility for Variable Substitution ---
// Replaces all instances of {{variable.key}} with its corresponding value
const substituteVariables = (content: string, vars: Record<string, string>): string => {
  let output = content;
  for (const key in vars) {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      // Creates a global regex to find {{ key }} with optional whitespace
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      // The variable's value is used as the replacement string
      output = output.replace(regex, vars[key]);
    }
  }
  return output;
};

// --- 3. Main Service Implementation ---
interface MailService {
  isConfigured(): boolean;
  sendTemplateMail(
    mailType: MailType,
    to: string,
    variables: Record<string, string>
  ): Promise<nodemailer.SentMessageInfo>;
  sendTrainingApprovalNotification(
    to: string,
    payload: {
      approverName: string;
      requestName: string;
      trainingTitle: string;
      submittedBy: string;
      submittedAt: string;
      approvalUrl: string;
      levelLabel: string;
      mailKind?: 'NOTIFICATION' | 'ACTION_REQUIRED';
    }
  ): Promise<nodemailer.SentMessageInfo>;
  sendContactMessage(
    from: string,
    name: string,
    subject: string,
    message: string
  ): Promise<nodemailer.SentMessageInfo>;
}

class MailServiceImpl implements MailService {
  isConfigured(): boolean {
    return Boolean(process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASS)
  }

  async sendTemplateMail(
    mailType: MailType,
    to: string,
    variables: Record<string, string>
  ): Promise<nodemailer.SentMessageInfo> {
    
    // 1. Fetch the template by type
    const template = await MailRepository.findByMailType(mailType);

    if (!template || !template.isActive || !template.body || !template.subject) {
      console.warn(`Template missing, inactive, or incomplete for type: ${mailType}`);
      // Throw an error or return a failure object
      throw new Error(`Cannot send email: Template not ready for ${mailType}`);
    }

    // 2. Substitute variables in subject and body
    const subject = substituteVariables(template.subject, variables);
    const htmlBody = substituteVariables(template.body, variables);

    // 3. Send the email
    return await transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@app.com', // Sender address
      to: to,
      subject: subject,
      html: htmlBody, // The HTML content from your template body
    });
  }

  async sendTrainingApprovalNotification(
    to: string,
    payload: {
      approverName: string;
      requestName: string;
      trainingTitle: string;
      submittedBy: string;
      submittedAt: string;
      approvalUrl: string;
      levelLabel: string;
      mailKind?: 'NOTIFICATION' | 'ACTION_REQUIRED';
    }
  ): Promise<nodemailer.SentMessageInfo> {
    const isActionRequired = payload.mailKind === 'ACTION_REQUIRED';
    const title = isActionRequired
      ? `Action Required (${payload.levelLabel}): ${payload.requestName}`
      : `New Request Notification (${payload.levelLabel}): ${payload.requestName}`;
    const intro = isActionRequired
      ? `Hi ${payload.approverName}, please review and ${payload.levelLabel.toLowerCase()} approve or reject this training request.`
      : `Hi ${payload.approverName}, a new training request has entered ${payload.levelLabel.toLowerCase()} for your visibility.`;
    const cta = isActionRequired ? 'Approve / Reject Request' : 'View Request Details';

    return await transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@app.com',
      to,
      subject: title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h2 style="margin: 0 0 14px; color: #111827;">Training Request Workflow Notification</h2>
          <p style="margin: 0 0 16px; color: #374151;">${intro}</p>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px;"><strong>Approval Stage:</strong> ${payload.levelLabel}</p>
            <p style="margin: 0 0 8px;"><strong>Request:</strong> ${payload.requestName}</p>
            <p style="margin: 0 0 8px;"><strong>Training:</strong> ${payload.trainingTitle}</p>
            <p style="margin: 0 0 8px;"><strong>Submitted By:</strong> ${payload.submittedBy}</p>
            <p style="margin: 0;"><strong>Submitted At:</strong> ${payload.submittedAt}</p>
          </div>

          <a href="${payload.approvalUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 14px; border-radius: 8px; font-weight: 600;">${cta}</a>

          <p style="margin-top: 18px; color: #6b7280; font-size: 12px;">This is an automated notification from the training system.</p>
        </div>
      `,
    });
  }

  async sendContactMessage(
    from: string,
    name: string,
    subject: string,
    message: string
  ): Promise<nodemailer.SentMessageInfo> {
    
    // Send contact message to support email
    return await transporter.sendMail({
      from: `"${name}" <${process.env.MAIL_USER}>`, // Use configured email as sender
      replyTo: from, // Set reply-to as the customer's email
      to: 'tnaprosupport@mmcsb.com.my',
      subject: `Customer Service: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #333; text-align: center; margin-bottom: 20px;">TNA Pro Customer Service Message</h2>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="color: #555; margin-top: 0;">Contact Information:</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${from}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="background-color: #fff; padding: 15px; border-left: 4px solid #007bff; margin-bottom: 20px;">
            <h3 style="color: #555; margin-top: 0;">Message:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              This message was sent from the TNA Pro Customer Service contact form.<br>
              Please reply to ${from} to respond to this inquiry.
            </p>
          </div>
        </div>
      `,
    });
  }
}

export const MailService = new MailServiceImpl();
