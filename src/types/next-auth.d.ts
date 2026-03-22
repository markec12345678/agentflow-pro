import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      userId?: string;
      trialEndsAt?: string | null;
      subscriptionActive?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    trialEndsAt?: string | null;
    subscriptionActive?: boolean;
  }
}
