import { rmSync } from 'fs';

export default function globalSetup(): void {
  rmSync('allure-results', { recursive: true, force: true });
}
