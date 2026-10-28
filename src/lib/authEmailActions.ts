export type MagicLinkRequest = {
  email: string;
  options: { shouldCreateUser: false; emailRedirectTo: string };
};

export type PasswordRecoveryRequest = {
  email: string;
  options: { redirectTo: string };
};

export function buildMagicLinkRequest(email: string, redirectTo: string): MagicLinkRequest {
  return { email, options: { shouldCreateUser: false, emailRedirectTo: redirectTo } };
}

export function buildPasswordRecoveryRequest(email: string, redirectTo: string): PasswordRecoveryRequest {
  return { email, options: { redirectTo } };
}

type EmailAuthClient = {
  auth: {
    signInWithOtp(request: MagicLinkRequest): Promise<{ error: unknown | null }>;
    resetPasswordForEmail(email: string, options: { redirectTo: string }): Promise<{ error: unknown | null }>;
  };
};

export function requestMagicLink(client: EmailAuthClient, email: string, redirectTo: string) {
  return client.auth.signInWithOtp(buildMagicLinkRequest(email, redirectTo));
}

export function requestPasswordRecovery(client: EmailAuthClient, email: string, redirectTo: string) {
  const request = buildPasswordRecoveryRequest(email, redirectTo);
  return client.auth.resetPasswordForEmail(request.email, request.options);
}
