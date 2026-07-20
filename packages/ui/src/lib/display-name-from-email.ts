export function displayNameFromEmail(email: string): string {
  const localPart = email.split("@")[0] ?? "User";
  return localPart
    .split(/[._-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}
