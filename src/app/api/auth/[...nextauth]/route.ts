import NextAuth from "next-auth";

export const dynamic = "force-dynamic";

async function getHandler() {
  const { authOptions } = await import("@/lib/auth-options");
  return NextAuth(authOptions);
}

export async function GET(request: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  const handler = await getHandler();
  return handler(request, context);
}

export async function POST(request: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  const handler = await getHandler();
  return handler(request, context);
}
