import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const MANAGER_EMAIL = "carrerandcars@gmail.com";

/**
 * Send email notification when a lead is escalated to manager status
 */
export async function sendManagerEscalationEmail(
  leadName: string,
  leadPhone: string,
  leadEmail?: string | null
): Promise<void> {
  try {
    const subject = `🔥 Lead Escalated to Manager - ${leadName}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Lead Escalated to Manager</title>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
          }
          .lead-info {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .lead-info h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 18px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: 600;
            color: #495057;
          }
          .value {
            color: #333;
            font-weight: 500;
          }
          .status-badge {
            background: #28a745;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .urgent-notice {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
            font-weight: 500;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            border-top: 1px solid #e9ecef;
          }
          .phone-link {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
          }
          .phone-link:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔥 Lead Escalation Alert</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">A lead has been escalated to manager status</p>
          </div>
          
          <div class="content">
            <div class="urgent-notice">
              <strong>⚡ Action Required:</strong> This lead is ready for manager review and potential closure
            </div>
            
            <div class="lead-info">
              <h3>📋 Lead Information</h3>
              
              <div class="info-row">
                <span class="label">👤 Name:</span>
                <span class="value">${leadName}</span>
              </div>
              
              <div class="info-row">
                <span class="label">📱 Phone:</span>
                <span class="value">
                  <a href="tel:${leadPhone}" class="phone-link">${leadPhone}</a>
                </span>
              </div>
              
              ${
                leadEmail
                  ? `
              <div class="info-row">
                <span class="label">📧 Email:</span>
                <span class="value">${leadEmail}</span>
              </div>
              `
                  : ""
              }
              
              <div class="info-row">
                <span class="label">📊 Status:</span>
                <span class="status-badge">Manager</span>
              </div>
              
              <div class="info-row">
                <span class="label">🤖 Source:</span>
                <span class="value">WhatsApp Bot Escalation</span>
              </div>
              
              <div class="info-row">
                <span class="label">🕐 Escalated:</span>
                <span class="value">${new Date().toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</span>
              </div>
            </div>
            
            <p><strong>What this means:</strong></p>
            <ul style="color: #495057; padding-left: 20px;">
              <li>✅ The bot has successfully qualified this lead</li>
              <li>🎯 The lead has shown genuine interest and engagement</li>
              <li>💬 They're ready for human sales intervention</li>
              <li>⏰ Quick response recommended for best conversion rates</li>
            </ul>
            
            <p style="margin-top: 25px;"><strong>Next Steps:</strong></p>
            <ol style="color: #495057; padding-left: 20px;">
              <li>Review the lead's conversation history in the CRM</li>
              <li>Contact the lead via phone or WhatsApp</li>
              <li>Schedule a visit or provide additional information</li>
              <li>Update the lead status as you progress through the sale</li>
            </ol>
          </div>
          
          <div class="footer">
            <p>This notification was automatically generated by the Carrera Cars CRM system.</p>
            <p style="margin: 5px 0 0 0;">
              <strong>Carrera Cars</strong> | WhatsApp Bot Integration
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: "no-reply@carreracarss.es", // You can change this to your domain
      to: MANAGER_EMAIL,
      subject: subject,
      html: htmlContent,
    });
  } catch (error) {
    console.error("❌ Error sending manager escalation email:", error);
    // Don't throw error to avoid breaking the main flow
  }
}

/**
 * Send email notification for playground test completions
 */
export async function sendPlaygroundCompletionEmail(
  testLeadName: string,
  conversationName: string
): Promise<void> {
  try {
    const subject = `🧪 Playground Test Completed - ${testLeadName}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Playground Test Completed</title>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
          }
          .test-info {
            background: #f8f9fa;
            border-left: 4px solid #28a745;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            border-top: 1px solid #e9ecef;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧪 Test Completed Successfully</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">A playground test has reached manager status</p>
          </div>
          
          <div class="content">
            <div class="test-info">
              <h3>📋 Test Information</h3>
              <p><strong>Test Lead Name:</strong> ${testLeadName}</p>
              <p><strong>Conversation:</strong> ${conversationName}</p>
              <p><strong>Completed:</strong> ${new Date().toLocaleDateString(
                "es-ES",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}</p>
            </div>
            
            <p>The bot has successfully guided this test lead through the entire qualification process and escalated them to manager status.</p>
            
            <p>You can review the conversation details in the Playground section of your CRM.</p>
          </div>
          
          <div class="footer">
            <p>This notification was automatically generated by the Carrera Cars CRM Playground.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: "no-reply@carreracarss.es",
      to: MANAGER_EMAIL,
      subject: subject,
      html: htmlContent,
    });

    console.log(`✅ Playground completion email sent successfully`);
  } catch (error) {
    console.error("❌ Error sending playground completion email:", error);
  }
}
