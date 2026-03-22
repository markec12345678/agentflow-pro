/**
 * Email Sender Integration Tests
 * 
 * Tests for email sending infrastructure:
 * - sendPendingGuestEmails()
 * - sendPendingWhatsAppMessages()
 * - Email template rendering
 * - Resend API integration (mocked)
 */
import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";

// Mock Prisma
const mockFindMany = vi.fn();
const mockUpdate = vi.fn();
vi.mock('@/database/schema', () => ({
  prisma: {
    guestCommunication: {
      findMany: mockFindMany,
      update: mockUpdate,
    },
  },
}));

// Mock Resend email sending
const mockSendEmail = vi.fn();
vi.mock('@/lib/publish/email', () => ({
  sendWorkflowNotificationEmail: mockSendEmail,
}));

// Mock WhatsApp sending
const mockSendWhatsApp = vi.fn();
vi.mock('@/infrastructure/messaging/WhatsAppAdapter', () => ({
  sendWhatsAppMessage: mockSendWhatsApp,
}));

describe('Email Sender Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockFindMany.mockResolvedValue([]);
    mockUpdate.mockResolvedValue({});
    mockSendEmail.mockResolvedValue({ success: true });
    mockSendWhatsApp.mockResolvedValue({ success: true });
  });

  describe('sendPendingGuestEmails', () => {
    it('should skip when RESEND_API_KEY is not set', async () => {
      const originalKey = process.env.RESEND_API_KEY;
      delete process.env.RESEND_API_KEY;
      
      const { sendPendingGuestEmails } = await import('@/lib/tourism/email-sender');
      const result = await sendPendingGuestEmails();
      
      expect(result).toEqual({ sent: 0, failed: 0, skipped: 0 });
      expect(mockFindMany).not.toHaveBeenCalled();
      
      process.env.RESEND_API_KEY = originalKey;
    });

    it('should fetch pending email communications', async () => {
      process.env.RESEND_API_KEY = 'test-key';
      mockFindMany.mockResolvedValue([
        {
          id: 'comm-1',
          channel: 'email',
          status: 'pending',
          subject: 'Welcome',
          content: 'Welcome message',
          guest: { email: 'guest@example.com' },
        },
      ]);

      const { sendPendingGuestEmails } = await import('@/lib/tourism/email-sender');
      await sendPendingGuestEmails();

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { status: 'pending', channel: 'email' },
        include: { guest: { select: { email: true } } },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should send email and update status to sent', async () => {
      process.env.RESEND_API_KEY = 'test-key';
      mockFindMany.mockResolvedValue([
        {
          id: 'comm-1',
          channel: 'email',
          status: 'pending',
          subject: 'Welcome',
          content: 'Welcome message',
          guest: { email: 'guest@example.com' },
        },
      ]);

      const { sendPendingGuestEmails } = await import('@/lib/tourism/email-sender');
      const result = await sendPendingGuestEmails();

      expect(result.sent).toBe(1);
      expect(mockSendEmail).toHaveBeenCalledWith(
        'guest@example.com',
        'Welcome',
        'Welcome message'
      );
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'comm-1' },
        data: expect.objectContaining({ status: 'sent' }),
      });
    });

    it('should skip communications with invalid email', async () => {
      process.env.RESEND_API_KEY = 'test-key';
      mockFindMany.mockResolvedValue([
        {
          id: 'comm-1',
          channel: 'email',
          status: 'pending',
          subject: 'Test',
          content: 'Test content',
          guest: { email: 'invalid-email' },
        },
      ]);

      const { sendPendingGuestEmails } = await import('@/lib/tourism/email-sender');
      const result = await sendPendingGuestEmails();

      expect(result.skipped).toBe(1);
      expect(mockSendEmail).not.toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'comm-1' },
        data: { status: 'failed' },
      });
    });

    it('should update status to failed when email sending fails', async () => {
      process.env.RESEND_API_KEY = 'test-key';
      mockFindMany.mockResolvedValue([
        {
          id: 'comm-1',
          channel: 'email',
          status: 'pending',
          subject: 'Test',
          content: 'Test content',
          guest: { email: 'guest@example.com' },
        },
      ]);
      mockSendEmail.mockRejectedValue(new Error('API Error'));

      const { sendPendingGuestEmails } = await import('@/lib/tourism/email-sender');
      const result = await sendPendingGuestEmails();

      expect(result.failed).toBe(1);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'comm-1' },
        data: { status: 'failed' },
      });
    });

    it('should respect DRY_RUN mode', async () => {
      process.env.RESEND_API_KEY = 'test-key';
      process.env.DRY_RUN = 'true';
      mockFindMany.mockResolvedValue([
        {
          id: 'comm-1',
          channel: 'email',
          status: 'pending',
          subject: 'Test',
          content: 'Test',
          guest: { email: 'guest@example.com' },
        },
      ]);

      const { sendPendingGuestEmails } = await import('@/lib/tourism/email-sender');
      const result = await sendPendingGuestEmails();

      expect(result.sent).toBe(1);
      expect(mockSendEmail).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();

      delete process.env.DRY_RUN;
    });
  });

  describe('sendPendingWhatsAppMessages', () => {
    it('should fetch pending WhatsApp communications', async () => {
      mockFindMany.mockResolvedValue([
        {
          id: 'comm-1',
          channel: 'whatsapp',
          status: 'pending',
          content: 'WhatsApp message',
          guest: { phone: '+38640123456' },
        },
      ]);

      const { sendPendingWhatsAppMessages } = await import('@/lib/tourism/email-sender');
      await sendPendingWhatsAppMessages();

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { status: 'pending', channel: 'whatsapp' },
        include: { guest: { select: { phone: true } } },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should send WhatsApp message and update status', async () => {
      mockFindMany.mockResolvedValue([
        {
          id: 'comm-1',
          channel: 'whatsapp',
          status: 'pending',
          content: 'Hello from WhatsApp',
          guest: { phone: '+38640123456' },
        },
      ]);
      mockSendWhatsApp.mockResolvedValue({ success: true });

      const { sendPendingWhatsAppMessages } = await import('@/lib/tourism/email-sender');
      const result = await sendPendingWhatsAppMessages();

      expect(result.sent).toBe(1);
      expect(mockSendWhatsApp).toHaveBeenCalledWith('Hello from WhatsApp', '+38640123456');
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'comm-1' },
        data: expect.objectContaining({ status: 'sent' }),
      });
    });

    it('should skip communications with invalid phone', async () => {
      mockFindMany.mockResolvedValue([
        {
          id: 'comm-1',
          channel: 'whatsapp',
          status: 'pending',
          content: 'Test',
          guest: { phone: '123' }, // Too short
        },
      ]);

      const { sendPendingWhatsAppMessages } = await import('@/lib/tourism/email-sender');
      const result = await sendPendingWhatsAppMessages();

      expect(result.skipped).toBe(1);
      expect(mockSendWhatsApp).not.toHaveBeenCalled();
    });

    it('should update status to failed when WhatsApp sending fails', async () => {
      mockFindMany.mockResolvedValue([
        {
          id: 'comm-1',
          channel: 'whatsapp',
          status: 'pending',
          content: 'Test',
          guest: { phone: '+38640123456' },
        },
      ]);
      mockSendWhatsApp.mockResolvedValue({ success: false, error: 'API Error' });

      const { sendPendingWhatsAppMessages } = await import('@/lib/tourism/email-sender');
      const result = await sendPendingWhatsAppMessages();

      expect(result.failed).toBe(1);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'comm-1' },
        data: { status: 'failed' },
      });
    });

    it('should respect DRY_RUN mode for WhatsApp', async () => {
      process.env.DRY_RUN = 'true';
      mockFindMany.mockResolvedValue([
        {
          id: 'comm-1',
          channel: 'whatsapp',
          status: 'pending',
          content: 'Test',
          guest: { phone: '+38640123456' },
        },
      ]);

      const { sendPendingWhatsAppMessages } = await import('@/lib/tourism/email-sender');
      const result = await sendPendingWhatsAppMessages();

      expect(result.sent).toBe(1);
      expect(mockSendWhatsApp).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();

      delete process.env.DRY_RUN;
    });
  });

  describe('Batch processing', () => {
    it('should process multiple communications in order', async () => {
      process.env.RESEND_API_KEY = 'test-key';
      mockFindMany.mockResolvedValue([
        {
          id: 'comm-1',
          channel: 'email',
          status: 'pending',
          subject: 'First',
          content: 'First message',
          guest: { email: 'first@example.com' },
        },
        {
          id: 'comm-2',
          channel: 'email',
          status: 'pending',
          subject: 'Second',
          content: 'Second message',
          guest: { email: 'second@example.com' },
        },
        {
          id: 'comm-3',
          channel: 'email',
          status: 'pending',
          subject: 'Third',
          content: 'Third message',
          guest: { email: 'third@example.com' },
        },
      ]);

      const { sendPendingGuestEmails } = await import('@/lib/tourism/email-sender');
      const result = await sendPendingGuestEmails();

      expect(result.sent).toBe(3);
      expect(mockSendEmail).toHaveBeenCalledTimes(3);
      expect(mockSendEmail).toHaveBeenNthCalledWith(1, 'first@example.com', 'First', 'First message');
      expect(mockSendEmail).toHaveBeenNthCalledWith(2, 'second@example.com', 'Second', 'Second message');
      expect(mockSendEmail).toHaveBeenNthCalledWith(3, 'third@example.com', 'Third', 'Third message');
    });

    it('should continue processing after individual failures', async () => {
      process.env.RESEND_API_KEY = 'test-key';
      mockFindMany.mockResolvedValue([
        {
          id: 'comm-1',
          channel: 'email',
          status: 'pending',
          subject: 'First',
          content: 'First',
          guest: { email: 'first@example.com' },
        },
        {
          id: 'comm-2',
          channel: 'email',
          status: 'pending',
          subject: 'Second',
          content: 'Second',
          guest: { email: 'second@example.com' },
        },
      ]);
      mockSendEmail.mockResolvedValueOnce({ success: true });
      mockSendEmail.mockRejectedValueOnce(new Error('API Error'));

      const { sendPendingGuestEmails } = await import('@/lib/tourism/email-sender');
      const result = await sendPendingGuestEmails();

      expect(result.sent).toBe(1);
      expect(result.failed).toBe(1);
      expect(mockSendEmail).toHaveBeenCalledTimes(2);
    });
  });
});
