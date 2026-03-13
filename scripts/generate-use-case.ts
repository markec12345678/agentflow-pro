#!/usr/bin/env ts-node
/**
 * Use Case Boilerplate Generator
 * 
 * Generates use case boilerplate code for API route refactoring.
 * 
 * Usage:
 *   ts-node scripts/generate-use-case.ts GetGuests
 *   ts-node scripts/generate-use-case.ts CreateBooking --with-repository
 */

import * as fs from 'fs'
import * as path from 'path'

interface UseCaseTemplate {
  name: string
  entity: string
  action: string
  hasInput: boolean
  hasOutput: boolean
  hasRepository: boolean
}

function parseUseCaseName(name: string): { action: string; entity: string } {
  // Parse "GetGuests" → { action: "Get", entity: "Guests" }
  const match = name.match(/^([A-Z][a-z]+)([A-Z][a-zA-Z]+)$/)
  if (!match) {
    throw new Error(`Invalid use case name: ${name}. Use format like "GetGuests" or "CreateBooking"`)
  }
  return {
    action: match[1],
    entity: match[2]
  }
}

function generateUseCase(template: UseCaseTemplate): string {
  const { name, action, entity } = template

  return `/**
 * Use Case: ${name}
 * 
 * ${action}s ${entity}.
 */

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface ${name}Input {
  // TODO: Add input properties
  userId: string
}

export interface ${name}Output {
  // TODO: Add output properties
  success: boolean
}

// ============================================================================
// Use Case Class
// ============================================================================

export class ${name} {
  constructor(
    // TODO: Inject repositories
    // private ${entity.toLowerCase()}Repository: ${entity}Repository
  ) {}

  /**
   * ${action}s ${entity.toLowerCase()}
   */
  async execute(input: ${name}Input): Promise<${name}Output> {
    const { userId } = input

    // TODO: Implement business logic
    // 1. Validate input
    // 2. Get data from repository
    // 3. Apply business rules
    // 4. Return result

    return {
      success: true
    }
  }
}

// ============================================================================
// Repository Interfaces
// ============================================================================

// export interface ${entity}Repository {
//   // TODO: Add repository methods
// }
`
}

function generateApiRoute(template: UseCaseTemplate): string {
  const { name, action, entity } = template

  return `/**
 * API Route: ${name}
 * 
 * Refactored to use ${name} use case
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getUserId } from "@/lib/auth-users"
import { ${name} } from "@/core/use-cases/${name}"
import { handleApiError, withRequestLogging } from "@/app/api/middleware"

/**
 * POST /api/${entity.toLowerCase()}
 * ${action}s ${entity.toLowerCase()}
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<any>> {
  return withRequestLogging(
    request,
    async () => {
      try {
        // 1. Authenticate user
        const session = await getServerSession(authOptions)
        const userId = getUserId(session)
        
        if (!userId) {
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
          )
        }

        // 2. Parse request body
        const body = await request.json()

        // 3. Execute use case
        const useCase = new ${name}(
          // TODO: Inject repositories
        )

        const result = await useCase.execute({
          userId,
          ...body
        })

        // 4. Return response
        return NextResponse.json(result)
      } catch (error) {
        return handleApiError(error, {
          route: "/api/${entity.toLowerCase()}",
          method: "POST"
        })
      }
    },
    "/api/${entity.toLowerCase()}"
  )
}
`
}

async function main() {
  const args = process.argv.slice(2)
  const useCaseName = args[0]

  if (!useCaseName) {
    console.error('Usage: ts-node scripts/generate-use-case.ts <UseCaseName>')
    console.error('Example: ts-node scripts/generate-use-case.ts GetGuests')
    process.exit(1)
  }

  const { action, entity } = parseUseCaseName(useCaseName)
  
  const template: UseCaseTemplate = {
    name: useCaseName,
    action,
    entity,
    hasInput: true,
    hasOutput: true,
    hasRepository: args.includes('--with-repository')
  }

  // Generate use case file
  const useCasePath = path.join(process.cwd(), 'src/core/use-cases', `${useCaseName}.ts`)
  const useCaseCode = generateUseCase(template)
  fs.writeFileSync(useCasePath, useCaseCode, 'utf-8')
  console.log(`✅ Created: ${useCasePath}`)

  // Generate API route file (optional)
  if (args.includes('--with-route')) {
    const routePath = path.join(process.cwd(), 'src/app/api', entity.toLowerCase(), 'route.ts')
    const routeCode = generateApiRoute(template)
    fs.writeFileSync(routePath, routeCode, 'utf-8')
    console.log(`✅ Created: ${routePath}`)
  }

  console.log('\n📝 Next steps:')
  console.log(`1. Edit: src/core/use-cases/${useCaseName}.ts`)
  console.log(`2. Implement business logic in execute() method`)
  console.log(`3. Add repository interfaces if needed`)
  console.log(`4. Test the use case`)
  console.log(`5. Commit changes`)
}

main().catch(console.error)
