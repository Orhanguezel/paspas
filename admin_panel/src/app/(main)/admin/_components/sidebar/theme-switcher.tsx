"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { persistPreference } from "@/lib/preferences/preferences-storage";
import { applyThemeMode } from "@/lib/preferences/theme-utils";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";
import { useAdminSettings } from '../admin-settings-provider';
import { useStatusQuery } from '@/integrations/hooks';
import { normalizeMeFromStatus } from '@/integrations/shared';
import type { AuthStatusResponse } from '@/integrations/shared';

export function ThemeSwitcher() {
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const setThemeMode = usePreferencesStore((s) => s.setThemeMode);
  const { saveAdminConfig } = useAdminSettings();
  const { data: statusData } = useStatusQuery();
  const me = normalizeMeFromStatus(statusData as AuthStatusResponse | undefined);
  if (!me?.isAdmin) return null;

  const handleValueChange = async () => {
    const newTheme = themeMode === "dark" ? "light" : "dark";
    applyThemeMode(newTheme);
    setThemeMode(newTheme);
    persistPreference("theme_mode", newTheme);
    saveAdminConfig();
  };

  return (
    <Button size="icon" onClick={handleValueChange}>
      {themeMode === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
