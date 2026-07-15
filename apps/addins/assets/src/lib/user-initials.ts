export interface UserInitialsInput {
  name?: string | null;
  email?: string | null;
}

export function getUserInitials({ name, email }: UserInitialsInput): string {
  const trimmedName = name?.trim();

  if (trimmedName) {
    const parts = trimmedName.split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    }

    const single = parts[0]!;
    return single.slice(0, 2).toUpperCase();
  }

  const trimmedEmail = email?.trim();

  if (trimmedEmail) {
    const localPart = trimmedEmail.split("@")[0] ?? trimmedEmail;
    const cleaned = localPart.replace(/[^a-zA-Z0-9]/g, "");

    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2).toUpperCase();
    }

    if (cleaned.length === 1) {
      return cleaned.toUpperCase();
    }
  }

  return "?";
}
