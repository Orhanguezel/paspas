import { siteSettings } from '@/modules/siteSettings/schema';

export { siteSettings as appSettingsTable };

export type AppSettingRow = typeof siteSettings.$inferSelect;

function parseValue(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function rowToDto(row: AppSettingRow) {
  return {
    id: row.id,
    key: row.key,
    value: parseValue(row.value),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
