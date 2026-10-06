export const buildContentSecurityPolicy = (
  supabaseUrl: string,
  production: boolean,
): string => {
  const connectSource = new URL(supabaseUrl).origin;
  return [
    "default-src 'self'",
    "img-src 'self' data: https://covers.openlibrary.org https://*.archive.org",
    `connect-src 'self' ${connectSource}`,
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'unsafe-inline'${production ? '' : " 'unsafe-eval'"}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
};
