/**
 * Email Templates Usage Examples
 * 
 * Real-world examples of how to use email templates in AgentFlow Pro
 */

import {
  renderEmailTemplate,
  getTemplateById,
  getTemplatesByCategory,
  getTemplateCategory,
  getDefaultTemplate,
  templateExists,
  EMAIL_TEMPLATES,
} from '@/lib/email-templates';

// ============================================================================
// EXAMPLE 1: Send Welcome Email on Booking
// ============================================================================

async function sendWelcomeEmail(booking: {
  guestName: string;
  guestEmail: string;
  propertyName: string;
  checkIn: Date;
  checkOut: Date;
  roomNumber: string;
  guestCount: number;
  propertyAddress: string;
  propertyCity: string;
  propertyCountry: string;
  propertyPhone: string;
  propertyEmail: string;
  checkInLink: string;
}) {
  const { subject, body } = renderEmailTemplate('welcome', {
    guest_name: booking.guestName,
    property_name: booking.propertyName,
    check_in_date: booking.checkIn.toLocaleDateString('sl-SI'),
    check_out_date: booking.checkOut.toLocaleDateString('sl-SI'),
    room_number: booking.roomNumber,
    guest_count: booking.guestCount.toString(),
    property_address: booking.propertyAddress,
    property_city: booking.propertyCity,
    property_country: booking.propertyCountry,
    property_phone: booking.propertyPhone,
    property_email: booking.propertyEmail,
    check_in_link: booking.checkInLink,
  });

  // Send via your email service
  await sendEmail({
    to: booking.guestEmail,
    subject,
    html: body,
  });

  logger.info(`✅ Welcome email sent to ${booking.guestEmail}`);
}

// ============================================================================
// EXAMPLE 2: Send Pre-Arrival Reminder (1 Day Before)
// ============================================================================

async function sendPreArrivalReminder(booking: {
  guestName: string;
  guestEmail: string;
  propertyName: string;
  parkingInstructions: string;
  accessInstructions: string;
  mapsLink: string;
  propertyPhone: string;
}) {
  const { subject, body } = renderEmailTemplate('pre_arrival', {
    guest_name: booking.guestName,
    property_name: booking.propertyName,
    parking_instructions: booking.parkingInstructions,
    access_instructions: booking.accessInstructions,
    maps_link: booking.mapsLink,
    property_phone: booking.propertyPhone,
  });

  await sendEmail({
    to: booking.guestEmail,
    subject,
    html: body,
  });

  logger.info(`✅ Pre-arrival reminder sent to ${booking.guestEmail}`);
}

// ============================================================================
// EXAMPLE 3: Send Post-Stay Review Request
// ============================================================================

async function sendPostStayEmail(booking: {
  guestName: string;
  guestEmail: string;
  propertyName: string;
  reviewLink: string;
  discountCode: string;
  discountExpiry: Date;
  instagramLink: string;
  facebookLink: string;
}) {
  const { subject, body } = renderEmailTemplate('post_stay', {
    guest_name: booking.guestName,
    property_name: booking.propertyName,
    review_link: booking.reviewLink,
    discount_code: booking.discountCode,
    discount_expiry: booking.discountExpiry.toLocaleDateString('sl-SI'),
    instagram_link: booking.instagramLink,
    facebook_link: booking.facebookLink,
  });

  await sendEmail({
    to: booking.guestEmail,
    subject,
    html: body,
  });

  logger.info(`✅ Post-stay email sent to ${booking.guestEmail}`);
}

// ============================================================================
// EXAMPLE 4: Send Payment Confirmation
// ============================================================================

async function sendPaymentConfirmation(payment: {
  guestName: string;
  guestEmail: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  reservationId: string;
  paymentMethod: string;
  invoiceLink: string;
}) {
  const { subject, body } = renderEmailTemplate('payment_confirmation', {
    guest_name: payment.guestName,
    amount: payment.amount.toFixed(2),
    currency: payment.currency,
    payment_date: payment.paymentDate.toLocaleDateString('sl-SI'),
    reservation_id: payment.reservationId,
    payment_method: payment.paymentMethod,
    invoice_link: payment.invoiceLink,
  });

  await sendEmail({
    to: payment.guestEmail,
    subject,
    html: body,
    attachments: [
      {
        filename: `invoice-${payment.reservationId}.pdf`,
        path: payment.invoiceLink,
      },
    ],
  });

  logger.info(`✅ Payment confirmation sent to ${payment.guestEmail}`);
}

// ============================================================================
// EXAMPLE 5: Send Cancellation Confirmation
// ============================================================================

async function sendCancellationConfirmation(cancellation: {
  guestName: string;
  guestEmail: string;
  reservationId: string;
  cancellationDate: Date;
  refundAmount: number;
  currency: string;
}) {
  const { subject, body } = renderEmailTemplate('cancellation', {
    guest_name: cancellation.guestName,
    reservation_id: cancellation.reservationId,
    cancellation_date: cancellation.cancellationDate.toLocaleDateString('sl-SI'),
    refund_amount: cancellation.refundAmount.toFixed(2),
    currency: cancellation.currency,
  });

  await sendEmail({
    to: cancellation.guestEmail,
    subject,
    html: body,
  });

  logger.info(`✅ Cancellation confirmation sent to ${cancellation.guestEmail}`);
}

// ============================================================================
// EXAMPLE 6: Get Template Info
// ============================================================================

function getTemplateInfo(templateId: string) {
  const template = getTemplateById(templateId);

  if (!template) {
    logger.error(`❌ Template ${templateId} not found`);
    return null;
  }

  logger.info(`📧 Template: ${template.name}`);
  logger.info(`📁 Category: ${template.category}`);
  logger.info(`📝 Subject: ${template.subject}`);
  logger.info(`🔧 Variables: ${template.variables.join(', ')}`);

  return template;
}

// Usage:
// getTemplateInfo('welcome');

// ============================================================================
// EXAMPLE 7: Get All Templates in Category
// ============================================================================

function listTemplatesByCategory(category: 'booking' | 'pre-arrival' | 'post-stay' | 'payment') {
  const templates = getTemplatesByCategory(category);

  logger.info(`\n📁 ${category.toUpperCase()} Templates:`);
  templates.forEach((template) => {
    logger.info(`  - ${template.name} (${template.id})`);
  });

  return templates;
}

// Usage:
// listTemplatesByCategory('booking');

// ============================================================================
// EXAMPLE 8: Check Template Category
// ============================================================================

function findTemplateCategory(templateId: string) {
  const category = getTemplateCategory(templateId);

  if (category) {
    logger.info(`✅ Template "${templateId}" belongs to category: ${category}`);
  } else {
    logger.info(`❌ Template "${templateId}" not found in any category`);
  }

  return category;
}

// Usage:
// findTemplateCategory('welcome');
// Returns: "PRE_ARRIVAL"

// ============================================================================
// EXAMPLE 9: Get Default Template for Category
// ============================================================================

function getDefaultTemplateForCategory(category: string) {
  const defaultTemplate = getDefaultTemplate(category);

  logger.info(`📧 Default template for "${category}": ${defaultTemplate}`);

  return defaultTemplate;
}

// Usage:
// getDefaultTemplateForCategory('booking');
// Returns: "welcome"

// ============================================================================
// EXAMPLE 10: Check if Template Exists
// ============================================================================

function checkTemplateExists(templateId: string): boolean {
  const exists = templateExists(templateId);

  if (exists) {
    logger.info(`✅ Template "${templateId}" exists`);
  } else {
    logger.info(`❌ Template "${templateId}" does not exist`);
  }

  return exists;
}

// Usage:
// checkTemplateExists('welcome');
// Returns: true

// ============================================================================
// EXAMPLE 11: Batch Send Emails
// ============================================================================

async function sendBatchEmails(
  templateId: string,
  recipients: Array<{
    email: string;
    variables: Record<string, string>;
  }>
) {
  const template = getTemplateById(templateId);

  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  logger.info(`📧 Sending ${recipients.length} emails using template: ${template.name}`);

  const results = await Promise.allSettled(
    recipients.map(async (recipient) => {
      try {
        const { subject, body } = renderEmailTemplate(templateId, recipient.variables);

        await sendEmail({
          to: recipient.email,
          subject,
          html: body,
        });

        return { success: true, email: recipient.email };
      } catch (error) {
        return {
          success: false,
          email: recipient.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );

  const successCount = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
  const failCount = results.length - successCount;

  logger.info(`✅ Batch send complete: ${successCount} succeeded, ${failCount} failed`);

  return {
    total: recipients.length,
    success: successCount,
    failed: failCount,
    results,
  };
}

// Usage:
// sendBatchEmails('welcome', [
//   { email: 'guest1@example.com', variables: { guest_name: 'John', ... } },
//   { email: 'guest2@example.com', variables: { guest_name: 'Jane', ... } },
// ]);

// ============================================================================
// EXAMPLE 12: Email Automation Trigger
// ============================================================================

interface EmailAutomationTrigger {
  eventType: 'booking_created' | 'checkin_tomorrow' | 'checkout_completed' | 'payment_received';
  data: any;
}

async function handleEmailAutomation(trigger: EmailAutomationTrigger) {
  logger.info(`🔔 Email automation triggered: ${trigger.eventType}`);

  switch (trigger.eventType) {
    case 'booking_created':
      await sendWelcomeEmail(trigger.data);
      break;

    case 'checkin_tomorrow':
      await sendPreArrivalReminder(trigger.data);
      break;

    case 'checkout_completed':
      await sendPostStayEmail(trigger.data);
      break;

    case 'payment_received':
      await sendPaymentConfirmation(trigger.data);
      break;

    default:
      logger.info(`⚠️ Unknown event type: ${trigger.eventType}`);
  }
}

// Usage:
// handleEmailAutomation({
//   eventType: 'booking_created',
//   data: bookingData,
// });

// ============================================================================
// HELPER: Mock Email Send Function (Replace with your email service)
// ============================================================================

async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; path: string }>;
}) {
  // Replace with your actual email service (SendGrid, Resend, etc.)
  logger.info(`📧 Sending email to ${options.to}`);
  logger.info(`📝 Subject: ${options.subject}`);
  logger.info(`📄 HTML length: ${options.html.length} characters`);

  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   to: options.to,
  //   subject: options.subject,
  //   html: options.html,
  //   attachments: options.attachments,
  // });

  // Example with Resend:
  // const resend = require('resend');
  // await resend.emails.send({
  //   from: 'noreply@yourdomain.com',
  //   to: options.to,
  //   subject: options.subject,
  //   html: options.html,
  //   attachments: options.attachments,
  // });

  return { success: true };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  sendWelcomeEmail,
  sendPreArrivalReminder,
  sendPostStayEmail,
  sendPaymentConfirmation,
  sendCancellationConfirmation,
  getTemplateInfo,
  listTemplatesByCategory,
  findTemplateCategory,
  getDefaultTemplateForCategory,
  checkTemplateExists,
  sendBatchEmails,
  handleEmailAutomation,
  sendEmail,
};
