/**
 * AgentFlow Pro - Authentication API Endpoints
 * Complete user authentication and management API
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth';

// POST /api/auth - Handle authentication operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'register':
        return await register(data);
      
      case 'login':
        return await login(data);
      
      case 'oauth':
        return await oauthLogin(data);
      
      case 'refresh':
        return await refreshToken(data);
      
      case 'logout':
        return await logout(data);
      
      case 'verify_email':
        return await verifyEmail(data);
      
      case 'request_password_reset':
        return await requestPasswordReset(data);
      
      case 'reset_password':
        return await resetPassword(data);
      
      case 'change_password':
        return await changePassword(data);
      
      case 'update_profile':
        return await updateProfile(data);
      
      case 'create_team':
        return await createTeam(data);
      
      case 'add_team_member':
        return await addTeamMember(data);
      
      case 'accept_invitation':
        return await acceptInvitation(data);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/auth - Handle authentication queries
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'me':
        return await getCurrentUser(request);
      
      case 'teams':
        return await getUserTeams(request);
      
      case 'team_members':
        const teamId = searchParams.get('teamId');
        if (!teamId) {
          return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
        }
        return await getTeamMembers(teamId);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Authentication handlers
async function register(data: {
  email: string;
  name: string;
  password: string;
  plan?: 'starter' | 'pro' | 'enterprise';
}) {
  const { email, name, password, plan } = data;
  
  if (!email || !name || !password) {
    return NextResponse.json({ error: 'Email, name, and password are required' }, { status: 400 });
  }

  // Validate email
  if (!authService.validateEmail(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  // Validate password
  const passwordValidation = authService.validatePassword(password);
  if (!passwordValidation.isValid) {
    return NextResponse.json({ 
      error: 'Invalid password', 
      details: passwordValidation.errors 
    }, { status: 400 });
  }

  try {
    const result = await authService.registerUser({ email, name, password, plan });
    
    return NextResponse.json({
      success: true,
      data: {
        user: result.user,
        tokens: result.tokens
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 }
    );
  }
}

async function login(data: {
  email: string;
  password: string;
}) {
  const { email, password } = data;
  
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  try {
    const result = await authService.loginUser({ email, password });
    
    return NextResponse.json({
      success: true,
      data: {
        user: result.user,
        tokens: result.tokens
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 401 }
    );
  }
}

async function oauthLogin(data: {
  provider: 'google' | 'github';
  profile: {
    email: string;
    name: string;
    providerId: string;
  };
}) {
  const { provider, profile } = data;
  
  if (!provider || !profile.email || !profile.name || !profile.providerId) {
    return NextResponse.json({ error: 'Provider and profile data are required' }, { status: 400 });
  }

  try {
    const result = await authService.oauthLogin(provider, profile);
    
    return NextResponse.json({
      success: true,
      data: {
        user: result.user,
        tokens: result.tokens
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'OAuth login failed' },
      { status: 500 }
    );
  }
}

async function refreshToken(data: {
  refreshToken: string;
}) {
  const { refreshToken } = data;
  
  if (!refreshToken) {
    return NextResponse.json({ error: 'Refresh token is required' }, { status: 400 });
  }

  try {
    const tokens = await authService.refreshToken(refreshToken);
    
    return NextResponse.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Token refresh failed' },
      { status: 401 }
    );
  }
}

async function logout(data: {
  userId: string;
}) {
  const { userId } = data;
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    await authService.logout(userId);
    
    return NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Logout failed' },
      { status: 500 }
    );
  }
}

async function verifyEmail(data: {
  token: string;
}) {
  const { token } = data;
  
  if (!token) {
    return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
  }

  try {
    await authService.verifyEmail(token);
    
    return NextResponse.json({
      success: true,
      data: { message: 'Email verified successfully' }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Email verification failed' },
      { status: 400 }
    );
  }
}

async function requestPasswordReset(data: {
  email: string;
}) {
  const { email } = data;
  
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    await authService.requestPasswordReset(email);
    
    return NextResponse.json({
      success: true,
      data: { message: 'Password reset link sent to email' }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Password reset request failed' },
      { status: 500 }
    );
  }
}

async function resetPassword(data: {
  token: string;
  newPassword: string;
}) {
  const { token, newPassword } = data;
  
  if (!token || !newPassword) {
    return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
  }

  // Validate new password
  const passwordValidation = authService.validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    return NextResponse.json({ 
      error: 'Invalid password', 
      details: passwordValidation.errors 
    }, { status: 400 });
  }

  try {
    await authService.resetPassword(token, newPassword);
    
    return NextResponse.json({
      success: true,
      data: { message: 'Password reset successfully' }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Password reset failed' },
      { status: 400 }
    );
  }
}

async function changePassword(data: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  const { userId, currentPassword, newPassword } = data;
  
  if (!userId || !currentPassword || !newPassword) {
    return NextResponse.json({ error: 'User ID, current password, and new password are required' }, { status: 400 });
  }

  // Validate new password
  const passwordValidation = authService.validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    return NextResponse.json({ 
      error: 'Invalid password', 
      details: passwordValidation.errors 
    }, { status: 400 });
  }

  try {
    await authService.changePassword(userId, currentPassword, newPassword);
    
    return NextResponse.json({
      success: true,
      data: { message: 'Password changed successfully' }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Password change failed' },
      { status: 400 }
    );
  }
}

async function updateProfile(data: {
  userId: string;
  name?: string;
  email?: string;
}) {
  const { userId, name, email } = data;
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  if (!name && !email) {
    return NextResponse.json({ error: 'Name or email is required' }, { status: 400 });
  }

  if (email && !authService.validateEmail(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  try {
    const user = await authService.updateProfile(userId, { name, email });
    
    return NextResponse.json({
      success: true,
      data: user
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Profile update failed' },
      { status: 500 }
    );
  }
}

async function createTeam(data: {
  userId: string;
  name: string;
  plan: 'starter' | 'pro' | 'enterprise';
}) {
  const { userId, name, plan } = data;
  
  if (!userId || !name || !plan) {
    return NextResponse.json({ error: 'User ID, name, and plan are required' }, { status: 400 });
  }

  try {
    const team = await authService.createTeam(userId, { name, plan });
    
    return NextResponse.json({
      success: true,
      data: team
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Team creation failed' },
      { status: 500 }
    );
  }
}

async function addTeamMember(data: {
  teamId: string;
  userId: string;
  role: 'admin' | 'member';
  invitedBy: string;
}) {
  const { teamId, userId, role, invitedBy } = data;
  
  if (!teamId || !userId || !role || !invitedBy) {
    return NextResponse.json({ error: 'Team ID, user ID, role, and invited by are required' }, { status: 400 });
  }

  try {
    const teamMember = await authService.addTeamMember(teamId, userId, role, invitedBy);
    
    return NextResponse.json({
      success: true,
      data: teamMember
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add team member' },
      { status: 500 }
    );
  }
}

async function acceptInvitation(data: {
  teamMemberId: string;
}) {
  const { teamMemberId } = data;
  
  if (!teamMemberId) {
    return NextResponse.json({ error: 'Team member ID is required' }, { status: 400 });
  }

  try {
    await authService.acceptTeamInvitation(teamMemberId);
    
    return NextResponse.json({
      success: true,
      data: { message: 'Invitation accepted' }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}

// Query handlers
async function getCurrentUser(request: NextRequest) {
  // Get token from Authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token and get user
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const user = await authService.getUserById(decoded.userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

async function getUserTeams(request: NextRequest) {
  // Get token from Authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const teams = await authService.getUserTeams(decoded.userId);
    
    return NextResponse.json({
      success: true,
      data: teams
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

async function getTeamMembers(teamId: string) {
  try {
    const teamMembers = await authService.getTeamMembers(teamId);
    
    return NextResponse.json({
      success: true,
      data: teamMembers
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get team members' },
      { status: 500 }
    );
  }
}

// Import jwt for token verification
import jwt from 'jsonwebtoken';
