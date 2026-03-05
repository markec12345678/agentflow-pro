import { NextRequest, NextResponse } from 'next/server';
import { skillsIntegration } from '@/lib/skills-integration';

export const dynamic = "force-dynamic";

/**
 * GET /api/skills - List all available skills
 */
export async function GET() {
  try {
    const skills = skillsIntegration.getSkills();
    const executions = skillsIntegration.getExecutions();

    return NextResponse.json({
      success: true,
      data: {
        skills,
        executions: executions.slice(-10), // Last 10 executions
        total: skills.length,
        active: skills.filter(s => s.status === 'active').length
      }
    });
  } catch (error) {
    console.error('Skills API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch skills' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/skills - Execute a skill
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skill, input } = body;

    if (!skill || !input) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Skill and input are required' } },
        { status: 400 }
      );
    }

    const execution = await skillsIntegration.executeSkill(skill, input);

    return NextResponse.json({
      success: true,
      data: {
        execution,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Skill execution error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'EXECUTION_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
