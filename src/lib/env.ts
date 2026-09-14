function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export const env = {
  adminEmail: () => required("ADMIN_EMAIL").toLowerCase(),
  authSecret: () => required("AUTH_SECRET"),
  appUrl: () => required("APP_URL").replace(/\/$/, ""),
  mailFrom: () => required("MAIL_FROM"),
  resendApiKey: () => required("RESEND_API_KEY"),
};
