/**
 * OpenAPI/Swagger Documentation Generator
 * 
 * Auto-generates API documentation from route files
 * Access at: /api/docs
 */

import { NextRequest, NextResponse } from 'next/server';

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'AgentFlow Pro API',
    version: '1.0.0',
    description: 'Multi-Agent AI Platform for Business Automation',
    contact: {
      name: 'AgentFlow Pro',
      email: 'support@agentflow.pro',
      url: 'https://agentflow.pro',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3002',
      description: 'Development server',
    },
    {
      url: 'https://agentflow-pro.vercel.app',
      description: 'Production server',
    },
  ],
  tags: [
    { name: 'Authentication', description: 'User authentication endpoints' },
    { name: 'Properties', description: 'Property management' },
    { name: 'Reservations', description: 'Booking and reservations' },
    { name: 'Guests', description: 'Guest management' },
    { name: 'Tourism', description: 'Tourism-specific features' },
    { name: 'Workflows', description: 'Workflow automation' },
    { name: 'Agents', description: 'AI agents' },
    { name: 'Analytics', description: 'Analytics and reporting' },
    { name: 'Payments', description: 'Payment processing' },
    { name: 'Settings', description: 'System settings' },
  ],
  paths: {
    // Authentication
    '/api/v1/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Successful login',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    session: { $ref: '#/components/schemas/Session' },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid credentials' },
          429: { description: 'Too many attempts (rate limited)' },
        },
      },
    },
    '/api/v1/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'User registration',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string' },
                },
                required: ['email', 'password', 'name'],
              },
            },
          },
        },
        responses: {
          201: { description: 'User created' },
          400: { description: 'Invalid input' },
          409: { description: 'Email already exists' },
        },
      },
    },
    
    // Properties
    '/api/properties': {
      get: {
        tags: ['Properties'],
        summary: 'List all properties',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
          },
          {
            name: 'offset',
            in: 'query',
            schema: { type: 'integer', default: 0 },
          },
        ],
        responses: {
          200: {
            description: 'List of properties',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Property' },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Properties'],
        summary: 'Create property',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PropertyInput',
              },
            },
          },
        },
        responses: {
          201: { description: 'Property created' },
          400: { description: 'Invalid input' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    
    // Tourism
    '/api/v1/tourism/calendar': {
      get: {
        tags: ['Tourism'],
        summary: 'Get calendar availability',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'propertyId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'startDate',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'endDate',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: {
          200: {
            description: 'Calendar data',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/CalendarEntry' },
                },
              },
            },
          },
        },
      },
    },
    
    // Health Check
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'Service healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                    version: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Session: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },
      Property: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          address: { type: 'string' },
          rooms: { type: 'integer' },
          amenities: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      PropertyInput: {
        type: 'object',
        required: ['name', 'address'],
        properties: {
          name: { type: 'string' },
          address: { type: 'string' },
          rooms: { type: 'integer' },
        },
      },
      CalendarEntry: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date' },
          status: {
            type: 'string',
            enum: ['available', 'booked', 'blocked'],
          },
          reservationId: { type: 'string' },
        },
      },
    },
  },
};

export async function GET(request: NextRequest) {
  const acceptHeader = request.headers.get('accept');
  
  // Return Swagger UI HTML
  if (acceptHeader?.includes('text/html')) {
    return NextResponse.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AgentFlow Pro API Documentation</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
          <style>
            body { margin: 0; padding: 0; }
            #swagger-ui { max-width: 1460px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div id="swagger-ui"></div>
          <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
          <script>
            window.onload = () => {
              window.ui = SwaggerUIBundle({
                url: '/api/v1/system/openapi.json',
                dom_id: '#swagger-ui',
                presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
                layout: "BaseLayout",
              });
            };
          </script>
        </body>
      </html>
    `);
  }
  
  // Return OpenAPI JSON spec
  return NextResponse.json(openApiSpec);
}
