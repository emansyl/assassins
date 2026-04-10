export const HBS_EMAIL_DOMAINS = [
  "@mba2026.hbs.edu",
  "@mba2027.hbs.edu",
  "@mba2028.hbs.edu",
  "@mba2029.hbs.edu",
  "@mba2030.hbs.edu",
  "@mba2031.hbs.edu"
] as const;

export function isValidHBSEmail(email: string): boolean {
  return HBS_EMAIL_DOMAINS.some((domain) =>
    email.toLowerCase().endsWith(domain)
  );
}
