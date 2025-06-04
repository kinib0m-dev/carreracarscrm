import { Resend } from "resend";
import type { RelevantCar } from "@/types/bot";
import { getConversationSummaryForManager } from "../whatsapp/car-context-utils";

const resend = new Resend(process.env.RESEND_API_KEY);
const MANAGER_EMAIL = "carrerandcars@gmail.com";

/**
 * Enhanced manager escalation email with car context and conversation summary
 */
export async function sendManagerEscalationEmail(
  leadId: string,
  leadName: string,
  leadPhone: string,
  leadEmail?: string | null
): Promise<void> {
  try {
    // Get conversation summary with car context
    const summary = await getConversationSummaryForManager(leadId);

    const subject = `🔥 URGENT: Lead Ready for Manager - ${leadName}`;

    // Generate car list HTML
    const generateCarListHtml = (cars: RelevantCar[]) => {
      if (cars.length === 0) {
        return '<p style="color: #6c757d; font-style: italic;">No specific vehicles discussed yet.</p>';
      }

      return cars
        .map((car) => {
          const carName = [car.marca, car.modelo, car.version]
            .filter(Boolean)
            .join(" ");
          const price = car.precio_venta
            ? `${parseFloat(car.precio_venta).toLocaleString("es-ES")}€`
            : "Precio a consultar";
          const kilometers = car.kilometros
            ? `${car.kilometros.toLocaleString("es-ES")} km`
            : "N/A";

          return `
          <div style="border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin: 10px 0; background: #f8f9fa;">
            <h4 style="margin: 0 0 8px 0; color: #495057; font-size: 16px;">
              🚗 ${carName || "Vehículo sin nombre"}
            </h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
              <div><strong>Tipo:</strong> ${car.type}</div>
              <div><strong>Precio:</strong> ${price}</div>
              <div><strong>Kilómetros:</strong> ${kilometers}</div>
              <div><strong>Color:</strong> ${car.color || "N/A"}</div>
              ${car.motor ? `<div><strong>Motor:</strong> ${car.motor}</div>` : ""}
              ${car.transmision ? `<div><strong>Transmisión:</strong> ${car.transmision}</div>` : ""}
            </div>
            ${
              car.url
                ? `
              <div style="margin-top: 10px;">
                <a href="${car.url}" style="color: #007bff; text-decoration: none; font-size: 12px;">
                  📸 Ver fotos del vehículo
                </a>
              </div>
            `
                : ""
            }
          </div>
        `;
        })
        .join("");
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>URGENT: Lead Escalation with Car Context</title>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 700px;
            margin: 20px auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
          .urgent-banner {
            background: #ffc107;
            color: #212529;
            padding: 15px;
            text-align: center;
            font-weight: 700;
            font-size: 16px;
            border-bottom: 3px solid #ffca2c;
          }
          .content {
            padding: 30px;
          }
          .lead-info {
            background: #f8f9fa;
            border-left: 5px solid #dc3545;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .section {
            margin: 25px 0;
            padding: 20px;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            background: #ffffff;
          }
          .section h3 {
            margin: 0 0 15px 0;
            color: #495057;
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 8px 15px;
            align-items: center;
          }
          .label {
            font-weight: 600;
            color: #495057;
            white-space: nowrap;
          }
          .value {
            color: #333;
            font-weight: 500;
          }
          .phone-link {
            color: #dc3545;
            text-decoration: none;
            font-weight: 600;
            font-size: 18px;
          }
          .phone-link:hover {
            text-decoration: underline;
          }
          .escalation-reason {
            background: #fff3cd;
            border: 2px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: 600;
            text-align: center;
            font-size: 16px;
          }
          .interaction-list {
            list-style: none;
            padding: 0;
          }
          .interaction-list li {
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .interaction-list li:last-child {
            border-bottom: none;
          }
          .next-steps {
            background: #d1ecf1;
            border-left: 4px solid #17a2b8;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .next-steps ol {
            margin: 10px 0;
            padding-left: 20px;
          }
          .next-steps li {
            margin: 8px 0;
            font-weight: 500;
          }
          .footer {
            background: #343a40;
            color: #ffffff;
            padding: 25px;
            text-align: center;
          }
          .cta-button {
            display: inline-block;
            background: #28a745;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .cta-button:hover {
            background: #218838;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 LEAD ESCALATION ALERT</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">
              High-priority lead ready for manager intervention
            </p>
          </div>
          
          <div class="urgent-banner">
            ⚡ IMMEDIATE ACTION REQUIRED - LEAD QUALIFIED AND READY TO CLOSE ⚡
          </div>
          
          <div class="content">
            <div class="escalation-reason">
              🎯 <strong>Escalation Reason:</strong> ${summary.escalationReason}
            </div>
            
            <div class="lead-info">
              <h3 style="margin: 0 0 15px 0; color: #dc3545;">📋 Lead Information</h3>
              <div class="info-grid">
                <span class="label">👤 Name:</span>
                <span class="value">${leadName}</span>
                
                <span class="label">📱 Phone:</span>
                <span class="value">
                  <a href="tel:${leadPhone}" class="phone-link">${leadPhone}</a>
                </span>
                
                ${
                  leadEmail
                    ? `
                <span class="label">📧 Email:</span>
                <span class="value">${leadEmail}</span>
                `
                    : ""
                }
                
                <span class="label">📊 Status:</span>
                <span class="value" style="background: #dc3545; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">MANAGER</span>
                
                <span class="label">🤖 Source:</span>
                <span class="value">WhatsApp Bot Escalation</span>
                
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

            <div class="section">
              <h3>🚗 Vehicles Discussed</h3>
              ${generateCarListHtml(summary.carsShown)}
            </div>

            <div class="section">
              <h3>💬 Key Conversation Points</h3>
              ${
                summary.keyInteractions.length > 0
                  ? `
                <ul class="interaction-list">
                  ${summary.keyInteractions
                    .map(
                      (interaction: string) => `
                    <li>✅ ${interaction}</li>
                  `
                    )
                    .join("")}
                </ul>
              `
                  : '<p style="color: #6c757d; font-style: italic;">No specific interactions recorded yet.</p>'
              }
            </div>

            <div class="next-steps">
              <h3 style="margin: 0 0 15px 0; color: #17a2b8;">🎯 Recommended Next Steps</h3>
              <ol>
                ${summary.nextSteps.map((step: string) => `<li>${step}</li>`).join("")}
              </ol>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="tel:${leadPhone}" class="cta-button">
                📞 Call Lead Now
              </a>
              <a href="https://wa.me/${leadPhone.replace("+", "")}" class="cta-button" style="background: #25d366;">
                💬 WhatsApp Lead
              </a>
            </div>

            <div style="background: #e9ecef; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h4 style="margin: 0 0 10px 0; color: #495057;">💡 Why This Lead Was Escalated:</h4>
              <ul style="margin: 10px 0; padding-left: 20px; color: #495057;">
                <li>✅ Bot successfully engaged and qualified the lead</li>
                <li>🎯 Lead has shown concrete interest or readiness to purchase</li>
                <li>💼 Requires human expertise for advanced topics (financing, trade-ins, etc.)</li>
                <li>⏰ Optimal timing for manager intervention to close the deal</li>
              </ul>
            </div>

            <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; color: #721c24;">
              <strong>⚠️ Important:</strong> This lead has been automatically escalated based on conversation triggers. 
              They are expecting human contact and may be time-sensitive. Quick response recommended for best conversion rates.
            </div>
          </div>
          
          <div class="footer">
            <p style="margin: 0; font-size: 16px; font-weight: 600;">
              🏎️ Carrera Cars CRM - WhatsApp Bot Integration
            </p>
            <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">
              This escalation was triggered automatically by our AI sales assistant
            </p>
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

    console.log(
      `✅ Enhanced manager escalation email sent for lead ${leadName}`
    );
  } catch (error) {
    console.error("❌ Error sending enhanced manager escalation email:", error);
    // Don't throw error to avoid breaking the main flow
  }
}

/**
 * Send weekly summary of escalated leads with car context
 */
export async function sendWeeklyEscalationSummary(): Promise<void> {
  try {
    // This would be called by a cron job to send weekly summaries
    // Implementation would involve querying recent escalations and their outcomes

    const subject = "📊 Weekly Lead Escalation Summary - Carrera Cars";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Weekly Escalation Summary</title>
      </head>
      <body style="font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">📊 Weekly Lead Escalation Summary</h2>
          <p>This week's WhatsApp bot performance and escalations will be summarized here.</p>
          <p><em>Feature coming soon...</em></p>
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
  } catch (error) {
    console.error("Error sending weekly escalation summary:", error);
  }
}
