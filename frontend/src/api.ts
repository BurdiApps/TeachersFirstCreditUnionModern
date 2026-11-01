// Keep API calls in one place so cookies, CSRF headers, and error messages
// behave consistently for login, account data, and the assistant.
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
let antiforgeryRequestToken: string | null = null;

type ProblemDetails = {
  detail?: string;
  title?: string;
  message?: string;
  errors?: Record<string, string[]>;
};

async function getAntiforgeryToken(): Promise<string> {
  if (antiforgeryRequestToken) {
    return antiforgeryRequestToken;
  }

  const response = await fetch(`${apiBaseUrl}/api/auth/csrf`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Could not prepare a secure request. Check that the API is running.');
  }

  const result: { requestToken: string } = await response.json();
  antiforgeryRequestToken = result.requestToken;
  return result.requestToken;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const changesServerState = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  // Cookie sessions are attached by the browser. The extra request token
  // prevents another website from silently submitting a form as the member.
  if (changesServerState) {
    headers.set('X-CSRF-TOKEN', await getAntiforgeryToken());
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const body = await response.text();
    let message = `The request failed (${response.status}).`;

    if (body) {
      try {
        const problem: ProblemDetails = JSON.parse(body);
        const validationMessage = problem.errors
          ? Object.values(problem.errors).flat().join(' ')
          : undefined;
        message = validationMessage ?? problem.detail ?? problem.message ?? problem.title ?? message;
      } catch {
        message = body;
      }
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export type AuthStatus = {
  isAuthenticated: boolean;
  email: string | null;
};

export type MemberAccount = {
  id: string;
  name: string;
  maskedNumber: string;
  accountType: string;
  balance: number;
  availableBalance: number;
  annualPercentageYield: number | null;
};

export type MemberTransaction = {
  id: string;
  description: string;
  category: string;
  amount: number;
  postedAtUtc: string;
};
