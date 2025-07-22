
"use client";

import { AppInitializer } from './components/AppInitializer';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { OrganizationSwitcher } from './components/OrganizationSwitcher';
import { OrganizationLogs } from './components/OrganizationLogs';

export default function HomePage() {
  return (
    <>
      <ThemeSwitcher />
      <AppInitializer />
      <OrganizationSwitcher />
      <OrganizationLogs />
    </>
  );
}
