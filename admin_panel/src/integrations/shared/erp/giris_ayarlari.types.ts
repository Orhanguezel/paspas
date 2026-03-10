export type LoginRole = 'admin' | 'sevkiyatci' | 'operator' | 'satin_almaci';

export interface LoginRoleUserItem {
  userId: string;
  email: string;
  fullName: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface LoginRoleSummary {
  role: LoginRole;
  activeCount: number;
  totalCount: number;
  primaryUserId: string | null;
  primaryUserName: string | null;
  primaryUserEmail: string | null;
  lastLoginAt: string | null;
  users: LoginRoleUserItem[];
}

export interface LoginSettingsDto {
  settings: {
    showQuickLogin: boolean;
    allowPasswordLogin: boolean;
    roleCardsEnabled: boolean;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireNumber: boolean;
      requireSpecialChar: boolean;
    };
    redirects: Record<LoginRole, string>;
    enabledRoles: LoginRole[];
  };
  runtime: {
    publicUrl: string;
    frontendUrl: string;
    corsOrigins: string[];
    tempLoginEnabled: boolean;
    adminAllowlist: string[];
  };
  branding: {
    loginLogoUrl: string | null;
  };
  roles: LoginRoleSummary[];
  summary: {
    totalLoginUsers: number;
    activeLoginUsers: number;
    passiveLoginUsers: number;
  };
  gaps: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toStr(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function toNum(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeLoginSettings(raw: unknown): LoginSettingsDto {
  const row = isRecord(raw) ? raw : {};
  const settings = isRecord(row.settings) ? row.settings : {};
  const redirects = isRecord(settings.redirects) ? settings.redirects : {};
  const runtime = isRecord(row.runtime) ? row.runtime : {};
  const branding = isRecord(row.branding) ? row.branding : {};
  const summary = isRecord(row.summary) ? row.summary : {};
  const roles = Array.isArray(row.roles) ? row.roles : [];

  return {
    settings: {
      showQuickLogin: settings.showQuickLogin === true,
      allowPasswordLogin: settings.allowPasswordLogin !== false,
      roleCardsEnabled: settings.roleCardsEnabled !== false,
      passwordPolicy: isRecord(settings.passwordPolicy)
        ? {
            minLength: Math.max(toNum(settings.passwordPolicy.minLength, 8), 6),
            requireUppercase: settings.passwordPolicy.requireUppercase !== false,
            requireNumber: settings.passwordPolicy.requireNumber !== false,
            requireSpecialChar: settings.passwordPolicy.requireSpecialChar === true,
          }
        : {
            minLength: 8,
            requireUppercase: true,
            requireNumber: true,
            requireSpecialChar: false,
          },
      redirects: {
        admin: toStr(redirects.admin, '/admin/dashboard'),
        sevkiyatci: toStr(redirects.sevkiyatci, '/admin/satis-siparisleri'),
        operator: toStr(redirects.operator, '/admin/operator'),
        satin_almaci: toStr(redirects.satin_almaci, '/admin/satin-alma'),
      },
      enabledRoles: Array.isArray(settings.enabledRoles)
        ? settings.enabledRoles
            .map((value) => String(value))
            .filter((value): value is LoginRole => ['admin', 'sevkiyatci', 'operator', 'satin_almaci'].includes(value))
        : ['admin', 'sevkiyatci', 'operator', 'satin_almaci'],
    },
    runtime: {
      publicUrl: toStr(runtime.publicUrl),
      frontendUrl: toStr(runtime.frontendUrl),
      corsOrigins: Array.isArray(runtime.corsOrigins) ? runtime.corsOrigins.map((value) => toStr(value)).filter(Boolean) : [],
      tempLoginEnabled: runtime.tempLoginEnabled === true,
      adminAllowlist: Array.isArray(runtime.adminAllowlist) ? runtime.adminAllowlist.map((value) => toStr(value)).filter(Boolean) : [],
    },
    branding: {
      loginLogoUrl: branding.loginLogoUrl ? toStr(branding.loginLogoUrl) : null,
    },
    roles: roles.map((item) => {
      const role = isRecord(item) ? item : {};
      return {
        role: toStr(role.role, 'operator') as LoginRole,
        activeCount: toNum(role.activeCount),
        totalCount: toNum(role.totalCount),
        primaryUserId: role.primaryUserId ? toStr(role.primaryUserId) : null,
        primaryUserName: role.primaryUserName ? toStr(role.primaryUserName) : null,
        primaryUserEmail: role.primaryUserEmail ? toStr(role.primaryUserEmail) : null,
        lastLoginAt: role.lastLoginAt ? toStr(role.lastLoginAt) : null,
        users: Array.isArray(role.users)
          ? role.users.map((user) => {
              const r = isRecord(user) ? user : {};
              return {
                userId: toStr(r.userId),
                email: toStr(r.email),
                fullName: r.fullName ? toStr(r.fullName) : null,
                isActive: r.isActive === true,
                lastLoginAt: r.lastLoginAt ? toStr(r.lastLoginAt) : null,
              };
            })
          : [],
      };
    }),
    summary: {
      totalLoginUsers: toNum(summary.totalLoginUsers),
      activeLoginUsers: toNum(summary.activeLoginUsers),
      passiveLoginUsers: toNum(summary.passiveLoginUsers),
    },
    gaps: Array.isArray(row.gaps) ? row.gaps.map((value) => toStr(value)).filter(Boolean) : [],
  };
}
