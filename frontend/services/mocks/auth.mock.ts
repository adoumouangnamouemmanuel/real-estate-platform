import type { User } from "@/types";

// TODO(backend): replace with real persistence once POST /api/v1/auth/* exists.
// Mutable (register/reset-password write to it) — resets on every page reload, since
// nothing here is persisted outside this module's memory. Passwords are plaintext
// because this is a fake in-memory directory, not a real credential store; never do
// this against a real database.
interface MockAccount {
  user: User;
  password: string;
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    user: {
      id: "u1",
      fullName: "Ama Boateng",
      email: "demo@byte.africa",
      role: "USER",
    },
    password: "Password123",
  },
  // Seeded so the Developer Dashboard (RequireAuth role="DEVELOPER") is reachable
  // in dev and E2E without a real backend granting roles.
  {
    user: {
      id: "u2",
      fullName: "Kwame Mensah",
      email: "developer@byte.africa",
      role: "DEVELOPER",
      developerId: "dev-1",
    },
    password: "Password123",
  },
];

export interface MockResetToken {
  email: string;
  expiresAt: number;
}

// Pre-seeded so both the "valid token" and "expired token" UI states are reachable
// without needing an email inbox: /reset-password?token=valid-token-demo|expired-token-demo
export const MOCK_RESET_TOKENS = new Map<string, MockResetToken>([
  [
    "valid-token-demo",
    { email: "demo@byte.africa", expiresAt: Date.now() + 30 * 60 * 1000 },
  ],
  [
    "expired-token-demo",
    { email: "demo@byte.africa", expiresAt: Date.now() - 1000 },
  ],
]);
