/** Derives up to 2 uppercase initials from a display name, e.g. "Jane Doe" -> "JD". */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
