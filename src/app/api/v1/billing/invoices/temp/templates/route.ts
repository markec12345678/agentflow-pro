import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  template: {
    header: string;
    footer: string;
    layout: "standard" | "detailed" | "minimal";
    colors: {
      primary: string;
      secondary: string;
    };
    logo?: string;
    companyInfo: {
      name: string;
      address: string;
      phone: string;
      email: string;
      taxId: string;
    };
  };
}

/**
 * GET /api/invoices/templates
 * Get all invoice templates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user has access (receptor, admin)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || !['admin', 'receptor'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Receptor or Admin access required' } },
        { status: 403 }
      );
    }

    // Get templates (in real implementation, this would fetch from database)
    const mockTemplates: InvoiceTemplate[] = [
      {
        id: "tpl_1",
        name: "Standard Template",
        description: "Clean and professional invoice template",
        isDefault: true,
        template: {
          header: "INVOICE",
          footer: "Thank you for your business!",
          layout: "standard",
          colors: {
            primary: "#2563eb",
            secondary: "#64748b"
          },
          companyInfo: {
            name: "Hotel Alpina",
            address: "Cankarjeva ulica 5, 1000 Ljubljana",
            phone: "+386 1 234 5678",
            email: "info@hotel-alpina.si",
            taxId: "SI12345678"
          }
        }
      },
      {
        id: "tpl_2",
        name: "Detailed Template",
        description: "Comprehensive template with detailed breakdown",
        isDefault: false,
        template: {
          header: "DETAILED INVOICE",
          footer: "Payment terms and conditions apply",
          layout: "detailed",
          colors: {
            primary: "#059669",
            secondary: "#6b7280"
          },
          companyInfo: {
            name: "Hotel Alpina",
            address: "Cankarjeva ulica 5, 1000 Ljubljana",
            phone: "+386 1 234 5678",
            email: "info@hotel-alpina.si",
            taxId: "SI12345678"
          }
        }
      },
      {
        id: "tpl_3",
        name: "Minimal Template",
        description: "Simple and clean template for quick invoices",
        isDefault: false,
        template: {
          header: "BILL",
          footer: "Payment appreciated",
          layout: "minimal",
          colors: {
            primary: "#6b7280",
            secondary: "#9ca3af"
          },
          companyInfo: {
            name: "Hotel Alpina",
            address: "Cankarjeva ulica 5, 1000 Ljubljana",
            phone: "+386 1 234 5678",
            email: "info@hotel-alpina.si",
            taxId: "SI12345678"
          }
        }
      }
    ];

    return NextResponse.json({
      success: true,
      data: { templates: mockTemplates }
    });

  } catch (error) {
    logger.error('Get invoice templates error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoices/templates
 * Create a new invoice template
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user has access (receptor, admin)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || !['admin', 'receptor'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Receptor or Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, template, isDefault = false } = body;

    if (!name || !template) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Name and template are required' } },
        { status: 400 }
      );
    }

    // Validate template structure
    const validationResult = validateTemplate(template);
    if (!validationResult.valid) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validationResult.message } },
        { status: 400 }
      );
    }

    // Create template (in real implementation)
    const newTemplate: InvoiceTemplate = {
      id: `tpl_${Date.now()}`,
      name,
      description: description || "",
      isDefault,
      template
    };

    logger.info('Created invoice template:', newTemplate);

    // Log activity
    await logActivity(userId, "Invoice Template Created", `Created template: ${name}`, request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: { 
        message: 'Invoice template created successfully',
        template: newTemplate
      }
    });

  } catch (error) {
    logger.error('Create invoice template error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

function validateTemplate(template: any): { valid: boolean; message?: string } {
  if (!template.header || typeof template.header !== 'string') {
    return { valid: false, message: 'Template header is required' };
  }

  if (!template.footer || typeof template.footer !== 'string') {
    return { valid: false, message: 'Template footer is required' };
  }

  const validLayouts = ["standard", "detailed", "minimal"];
  if (!template.layout || !validLayouts.includes(template.layout)) {
    return { valid: false, message: 'Invalid template layout' };
  }

  if (!template.colors || !template.colors.primary || !template.colors.secondary) {
    return { valid: false, message: 'Template colors are required' };
  }

  if (!template.companyInfo || !template.companyInfo.name || !template.companyInfo.address) {
    return { valid: false, message: 'Company information is required' };
  }

  return { valid: true };
}

async function logActivity(userId: string, action: string, details: string, ipAddress: string) {
  // In real implementation, this would be stored in database
  logger.info('Activity log:', {
    userId,
    action,
    details,
    ipAddress,
    timestamp: new Date().toISOString()
  });
}
}
