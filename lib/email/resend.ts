import { Resend } from "resend";

/**
 * Singleton Resend client.
 * RESEND_API_KEY must be set in production environment variables.
 * In dev/test without a key the client is initialised with a dummy value —
 * calls will fail gracefully (no crashes, just logged errors).
 */
export const resend = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");

/** The "from" address used for all outgoing emails. */
export const FROM_EMAIL =
  process.env.EMAIL_FROM ?? "Focal <notifications@focaltasks.app>";
