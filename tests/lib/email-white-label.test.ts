/**
 * Email Template White-label Tests
 * Tests for white-label branding in email templates
 */

import { describe, it, expect } from "vitest";
import {
  renderEmailTemplate,
  EMAIL_TEMPLATES,
} from "@/lib/email-templates/guest-templates";

describe("Email Template White-label", () => {
  describe("renderEmailTemplate with branding", () => {
    it("should render template without branding (default)", () => {
      const { subject, body } = renderEmailTemplate("welcome", {
        guest_name: "John Doe",
        property_name: "Hotel Test",
      });

      expect(subject).toContain("Dobrodošli");
      expect(body).toContain("John Doe");
      expect(body).toContain("Hotel Test");
    });

    it("should apply custom primary color", () => {
      const { body } = renderEmailTemplate("welcome", {
        guest_name: "John Doe",
        property_name: "Hotel Test",
      }, {
        primaryColor: "#FF5733",
      });

      expect(body).toContain("#FF5733");
    });

    it("should apply custom gradient with primary and secondary colors", () => {
      const { body } = renderEmailTemplate("welcome", {
        guest_name: "John Doe",
        property_name: "Hotel Test",
      }, {
        primaryColor: "#FF5733",
        secondaryColor: "#C70039",
      });

      expect(body).toContain("linear-gradient(135deg, #FF5733 0%, #C70039 100%)");
    });

    it("should add logo when provided", () => {
      const { body } = renderEmailTemplate("welcome", {
        guest_name: "John Doe",
        property_name: "Hotel Test",
      }, {
        logoUrl: "https://example.com/logo.png",
      });

      expect(body).toContain('<img src="https://example.com/logo.png"');
      expect(body).toContain("alt=\"Logo\"");
    });

    it("should apply custom font family", () => {
      const { body } = renderEmailTemplate("welcome", {
        guest_name: "John Doe",
        property_name: "Hotel Test",
      }, {
        fontFamily: "Roboto",
      });

      expect(body).toContain("font-family: Roboto, sans-serif");
    });

    it("should remove AgentFlow branding when requested", () => {
      const { body } = renderEmailTemplate("welcome", {
        guest_name: "John Doe",
        property_name: "Hotel Test",
      }, {
        removeAgentFlowBranding: true,
        primaryColor: "#3B82F6",
      });

      expect(body).toContain("© 2026 {{property_name}}. Vse pravice pridržane.");
      expect(body).not.toContain("Powered by AgentFlow Pro");
    });

    it("should add small logo in footer when removeAgentFlowBranding is true", () => {
      const { body } = renderEmailTemplate("welcome", {
        guest_name: "John Doe",
        property_name: "Hotel Test",
      }, {
        removeAgentFlowBranding: true,
        logoSmall: "https://example.com/small-logo.png",
      });

      expect(body).toContain('<img src="https://example.com/small-logo.png"');
      expect(body).toContain("height: 40px");
    });

    it("should handle all branding options together", () => {
      const branding = {
        logoUrl: "https://example.com/logo.png",
        logoSmall: "https://example.com/small-logo.png",
        primaryColor: "#28a745",
        secondaryColor: "#218838",
        accentColor: "#1e7e34",
        fontFamily: "Open Sans",
        removeAgentFlowBranding: true,
      };

      const { body } = renderEmailTemplate("welcome", {
        guest_name: "John Doe",
        property_name: "Hotel Test",
      }, branding);

      // Check logo
      expect(body).toContain('<img src="https://example.com/logo.png"');

      // Check colors
      expect(body).toContain("linear-gradient(135deg, #28a745 0%, #218838 100%)");

      // Check font
      expect(body).toContain("font-family: Open Sans, sans-serif");

      // Check white-label footer
      expect(body).toContain("© 2026 {{property_name}}");
      expect(body).toContain("https://example.com/small-logo.png");
    });

    it("should preserve template variables when applying branding", () => {
      const { body } = renderEmailTemplate("welcome", {
        guest_name: "Jane Smith",
        property_name: "Grand Hotel",
        check_in_date: "2026-04-01",
      }, {
        primaryColor: "#007bff",
      });

      expect(body).toContain("Jane Smith");
      expect(body).toContain("Grand Hotel");
      expect(body).toContain("2026-04-01");
    });

    it("should work with all email templates", () => {
      const templateIds = Object.keys(EMAIL_TEMPLATES);

      templateIds.forEach((templateId) => {
        const { body } = renderEmailTemplate(templateId, {
          guest_name: "Test Guest",
          property_name: "Test Property",
        }, {
          primaryColor: "#FF5733",
          removeAgentFlowBranding: true,
        });

        expect(body).toBeDefined();
        expect(body.length).toBeGreaterThan(0);
      });
    });
  });

  describe("branding parameter validation", () => {
    it("should handle partial branding object", () => {
      const { body } = renderEmailTemplate("welcome", {
        guest_name: "John Doe",
        property_name: "Hotel Test",
      }, {
        primaryColor: "#FF5733",
        // Other branding fields are undefined
      });

      expect(body).toContain("#FF5733");
    });

    it("should handle null branding values gracefully", () => {
      const { body } = renderEmailTemplate("welcome", {
        guest_name: "John Doe",
        property_name: "Hotel Test",
      }, {
        logoUrl: null,
        logoSmall: null,
        primaryColor: "#3B82F6",
      });

      // Should not crash and should apply valid branding
      expect(body).toBeDefined();
    });
  });
});
