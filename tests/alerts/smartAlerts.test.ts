/**
 * Unit tests for Smart Alerts triggerAlert
 */
import type { AlertContext } from "@/alerts/smartAlerts";

const mockFindFirst = jest.fn();
const mockCreate = jest.fn();
const mockSendSlack = jest.fn();
const mockSendEmail = jest.fn();
const mockSendSms = jest.fn();
const mockGetDirectorContact = jest.fn();
const mockGetReceptionistContact = jest.fn();
const mockGetDevContact = jest.fn();

jest.mock("@/database/schema", () => ({
  prisma: {
    smartAlertLog: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

jest.mock("@/alerts/channels", () => ({
  sendSlack: (...args: unknown[]) => mockSendSlack(...args),
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
  sendSms: (...args: unknown[]) => mockSendSms(...args),
}));

jest.mock("@/alerts/contacts", () => ({
  getDirectorContact: (...args: unknown[]) => mockGetDirectorContact(...args),
  getReceptionistContact: () => mockGetReceptionistContact(),
  getDevContact: () => mockGetDevContact(),
}));

describe("triggerAlert", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({});
    mockGetDirectorContact.mockResolvedValue({ email: "dir@test.com", phone: null });
    mockGetReceptionistContact.mockReturnValue({ email: "rec@test.com" });
    mockGetDevContact.mockReturnValue({ slackWebhook: "https://hooks.slack.com/xxx" });
  });

  it("triggers occupancy alert when value >= 95 and no cooldown", async () => {
    const { triggerAlert } = await import("@/alerts/smartAlerts");
    await triggerAlert("occupancy", {
      propertyId: "prop-1",
      value: 96,
    });

    expect(mockGetDirectorContact).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalled();
  });

  it("skips occupancy when in cooldown", async () => {
    mockFindFirst.mockResolvedValue({ id: "log-1" });
    const { triggerAlert } = await import("@/alerts/smartAlerts");
    await triggerAlert("occupancy", {
      propertyId: "prop-1",
      value: 96,
    });

    expect(mockGetDirectorContact).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("skips occupancy when value < 95", async () => {
    const { triggerAlert } = await import("@/alerts/smartAlerts");
    await triggerAlert("occupancy", {
      propertyId: "prop-1",
      value: 80,
    });

    expect(mockGetDirectorContact).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("triggers payment_failed for receptionist", async () => {
    const { triggerAlert } = await import("@/alerts/smartAlerts");
    await triggerAlert("payment_failed", {
      userId: "user-1",
      detail: "in_123",
    });

    expect(mockGetReceptionistContact).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalledWith(
      "rec@test.com",
      "Smart Alert: payment_failed",
      expect.stringContaining("in_123")
    );
    expect(mockCreate).toHaveBeenCalled();
  });

  it("triggers system_error for dev when count >= 3", async () => {
    const { triggerAlert } = await import("@/alerts/smartAlerts");
    await triggerAlert("system_error", {
      count: 5,
      lastError: "ECONNREFUSED",
    });

    expect(mockSendSlack).toHaveBeenCalledWith(
      "https://hooks.slack.com/xxx",
      expect.stringContaining("5")
    );
    expect(mockCreate).toHaveBeenCalled();
  });

  it("does nothing when no matching rules", async () => {
    const { triggerAlert } = await import("@/alerts/smartAlerts");
    await triggerAlert("unknown_event" as "occupancy", {} as AlertContext);

    expect(mockCreate).not.toHaveBeenCalled();
  });
});
