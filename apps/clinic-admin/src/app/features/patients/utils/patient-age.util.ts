/** Pure, dependency-free so it can be reused from a table cell, a card, or a future API layer. */
export function calculateAge(dateOfBirth: string, referenceDate: Date = new Date()): number {
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  let age = referenceDate.getFullYear() - year;

  const hasHadBirthdayThisYear =
    referenceDate.getMonth() + 1 > month ||
    (referenceDate.getMonth() + 1 === month && referenceDate.getDate() >= day);

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
}
