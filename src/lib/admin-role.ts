import type { Role } from '@/lib/types';

export interface AdminRoleInput {
  email: string | null | undefined;
  emailVerified: boolean;
  claims?: Record<string, unknown> | null;
  profileRole: string | null | undefined;
  allowedEmails: readonly string[];
}

export function normalizeAdminEmails(value: string | null | undefined): string[] {
  return String(value || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isDesignatedAdminEmail(
  email: string | null | undefined,
  allowedEmails: readonly string[],
): boolean {
  return Boolean(email && allowedEmails.includes(email.trim().toLowerCase()));
}

export function resolveEffectiveRole({
  email,
  emailVerified,
  claims,
  profileRole,
  allowedEmails,
}: AdminRoleInput): Role {
  const isDesignatedAdmin = isDesignatedAdminEmail(email, allowedEmails);
  const hasAdminClaim = claims?.admin === true;

  return isDesignatedAdmin && emailVerified && hasAdminClaim && profileRole === 'admin'
    ? 'admin'
    : 'volunteer';
}
