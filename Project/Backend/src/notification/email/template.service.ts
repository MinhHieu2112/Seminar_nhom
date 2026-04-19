import { Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';

interface TemplateDefinition {
  subject: string;
  html: string;
}

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private readonly templates: Map<string, Handlebars.TemplateDelegate> =
    new Map();

  constructor() {
    this.registerTemplates();
  }

  private registerTemplates() {
    const definitions: Record<string, TemplateDefinition> = {
      otp: {
        subject: 'Your OTP Code — StudyPlan',
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP Code</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#4f46e5;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">StudyPlan</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;color:#1f2937;font-size:18px;">Password Reset Code</h2>
              <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:1.5;">
                You requested a password reset. Use the following OTP code to proceed:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background-color:#f3f4f6;border-radius:8px;padding:16px 32px;">
                      <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#4f46e5;">{{otp}}</span>
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:#6b7280;font-size:12px;line-height:1.5;">
                This code expires in 5 minutes. If you did not request this, please ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">
                StudyPlan &mdash; Smart scheduling for students
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      },

      system: {
        subject: '{{subject}}',
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notification</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#4f46e5;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">StudyPlan</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;color:#1f2937;font-size:18px;">{{subject}}</h2>
              <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.5;">
                {{content}}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">
                StudyPlan &mdash; Smart scheduling for students
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      },

      'schedule-summary': {
        subject: 'Your Weekly Schedule — StudyPlan',
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Schedule</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#4f46e5;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">StudyPlan</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;color:#1f2937;font-size:18px;">Your Weekly Schedule</h2>
              <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:1.5;">
                Here is your schedule summary for the upcoming week:
              </p>
              <div style="background-color:#f3f4f6;border-radius:8px;padding:16px;">
                {{{content}}}
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">
                StudyPlan &mdash; Smart scheduling for students
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      },

      reminder: {
        subject: 'Reminder — StudyPlan',
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reminder</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#f59e0b;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">StudyPlan Reminder</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;color:#1f2937;font-size:18px;">Upcoming Task</h2>
              <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.5;">
                {{{content}}}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">
                StudyPlan &mdash; Smart scheduling for students
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      },

      'ai-done': {
        subject: 'AI Task Decomposition Complete — StudyPlan',
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Decomposition Complete</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#10b981;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">StudyPlan AI</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;color:#1f2937;font-size:18px;">Goal Decomposition Complete</h2>
              <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:1.5;">
                Your AI assistant has finished breaking down your goal into tasks:
              </p>
              <div style="background-color:#f3f4f6;border-radius:8px;padding:16px;">
                {{{content}}}
              </div>
              <p style="margin:16px 0 0;color:#6b7280;font-size:13px;">
                Head to your dashboard to review and confirm the suggested schedule.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">
                StudyPlan &mdash; Smart scheduling for students
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      },
    };

    for (const [name, def] of Object.entries(definitions)) {
      this.templates.set(name, Handlebars.compile(def.html));
      this.logger.log(`Registered email template: ${name}`);
    }
  }

  render(templateName: string, vars: Record<string, unknown>): string {
    const tmpl = this.templates.get(templateName);
    if (!tmpl) {
      this.logger.warn(
        `Template "${templateName}" not found, using system fallback`,
      );
      const fallback = this.templates.get('system');
      if (!fallback) {
        return `<p>${JSON.stringify(vars)}</p>`;
      }
      return fallback(vars);
    }
    return tmpl(vars);
  }
}
