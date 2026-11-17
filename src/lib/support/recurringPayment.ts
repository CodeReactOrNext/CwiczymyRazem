/**
 * One document per membership payment that has been credited to a supporter's
 * `supportTotal`, so a renewal is counted exactly once however many webhooks
 * BMC sends about it.
 *
 * Kept apart from `bmcFundingEvents` on purpose: the funding bar sums that
 * ledger as one-off coffees, and already accrues memberships from
 * `bmcRecurring`, so a payment written there would be counted twice.
 */
export const RECURRING_PAYMENTS_COLLECTION = "bmcRecurringPayments";

/**
 * A membership pays once per month, so subscription + calendar month of the
 * billing period is the payment. BMC does not document what an
 * `recurring_donation.updated` carries, and sends it for edits as well as
 * renewals — keying on the month means an edit inside a period that was
 * already paid credits nothing.
 */
export const recurringPaymentKey = (
  subscriptionId: string,
  periodStartSec: number,
): string => {
  const date = new Date(periodStartSec * 1000);
  const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  return `${subscriptionId}:${month}`;
};
