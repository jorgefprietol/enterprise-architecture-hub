import { expect, test } from '@playwright/test';

test('executive dashboard, scoring, maturity and bidirectional traceability', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Visión ejecutiva' })).toBeVisible();
  await expect(page.getByText('Gestión de pedidos comerciales', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Priorización de inversión' }).click();
  await page.getByLabel('Presupuesto USD').fill('0');
  await expect(page.getByText('Financiable', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Madurez y evidencia' }).click();
  await expect(page.getByText('Mapa de madurez', { exact: true })).toBeVisible();
  await page.getByText('Ver evidencia').first().click();
  await expect(page.getByText(/Escenario ficticio Meridian/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Trazabilidad tecnológica' }).click();
  await expect(page.getByRole('heading', { name: 'Gestión de pedidos comerciales' })).toBeVisible();
  await expect(page.getByText('Order Management', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Gobernanza', exact: true }).click();
  await expect(page.getByText('Modelo consistente')).toBeVisible();
});

test('authorized edits persist and can be removed through the UI', async ({ page }) => {
  test.skip(!process.env.EDITOR_TOKEN, 'Set EDITOR_TOKEN to exercise writes.');
  const name = `Retención ${Date.now()}`;
  await page.goto('/');
  await page.getByRole('button', { name: 'Configurar clave de edición' }).click();
  await page.getByLabel('Clave de edición', { exact: true }).fill(process.env.EDITOR_TOKEN!);
  await page.getByRole('button', { name: 'Guardar clave en esta sesión' }).click();
  await page.getByRole('button', { name: 'Estrategia y objetivos' }).click();
  await page.getByRole('button', { name: 'Nuevo objetivo' }).click();
  await page.getByLabel('Objetivo estratégico', { exact: true }).fill(name);
  await page.getByLabel('Indicador / unidad').fill('Retención (%)');
  await page.getByLabel('Responsable', { exact: true }).fill('Equipo de clientes');
  await page.getByLabel('Meta', { exact: true }).fill('85');
  await page.getByRole('button', { name: 'Guardar registro' }).click();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Estrategia y objetivos' }).click();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Configurar clave de edición' }).click();
  await page.getByLabel('Clave de edición', { exact: true }).fill(process.env.EDITOR_TOKEN!);
  await page.getByRole('button', { name: 'Guardar clave en esta sesión' }).click();
  await page.getByRole('button', { name: `Eliminar ${name}`, exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await expect(page.getByRole('heading', { name, exact: true })).toHaveCount(0);
});

test('mobile navigation and capability filtering fit the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Mapa de capacidades' }).click();
  await page.getByLabel('Buscar capacidades').fill('inventario');
  await expect(page.getByText('Gestión de disponibilidad de inventario', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
