import { notFound } from 'next/navigation';
import PassportPreviewClient from './PassportPreviewClient';

export const dynamic = 'force-dynamic';

/**
 * Development-only design preview for the Employee Safety Passport.
 * Blocked in production builds so sample employee data and demo OTP UI never ship.
 */
export default function PassportDesignPreviewPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }
  return <PassportPreviewClient />;
}
