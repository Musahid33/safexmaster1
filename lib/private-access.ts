/**
 * Private-section access for the Employee Safety Passport.
 *
 * Suggestions, Feedback, Grievances and Speak Up records are private: they open only
 * after the employee verifies the mobile number registered in the directory via OTP.
 *
 * SECURITY: an OTP must be generated, delivered (SMS) and verified by a trusted server.
 * Client-side generation or comparison is never real verification — a fake gateway is
 * acceptable only inside clearly-labelled design previews, never in the shipped app.
 * The absence of a gateway must fail closed (blocked), not open.
 */
export type PrivateAccessGateway = {
  /** Sends a fresh OTP to the registered mobile number. Rejects on unknown/unregistered numbers. */
  sendOtp(mobile: string): Promise<void>;
  /** Returns true only when the server-side OTP for this mobile matches and is unexpired. */
  verifyOtp(mobile: string, otp: string): Promise<boolean>;
};

/** Indian mobile numbers: 10 digits starting 6–9; a leading +91/91/0 is tolerated. */
export function validRegisteredMobile(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  const national = digits.length === 12 && digits.startsWith('91')
    ? digits.slice(2)
    : digits.length === 11 && digits.startsWith('0')
      ? digits.slice(1)
      : digits;
  return /^[6-9]\d{9}$/.test(national);
}

/** OTP codes are exactly 6 digits; anything else is rejected before hitting the gateway. */
export function validOtpCode(value: string): boolean {
  return /^\d{6}$/.test(value.trim());
}

export function normalizeMobile(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}
