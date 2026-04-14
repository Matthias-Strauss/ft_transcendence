export function validatePassword(pw: string): string | null {
  if (typeof pw !== 'string') return 'Password must be a string';
  if (pw.length < 8) return 'Password must be at least 8 characters long';
  if (!/[A-Za-z]/.test(pw)) return 'Password must contain at least one letter';
  if (!/\d/.test(pw)) return 'Password must contain at least one number';
  if (!/[^A-Za-z0-9]/.test(pw))
    return 'Password must contain at least one special character (e.g. @)';
  return null;
}

export function isValidPassword(pw: string): boolean {
  return validatePassword(pw) === null;
}
