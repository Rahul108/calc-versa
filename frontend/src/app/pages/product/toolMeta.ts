import type { CalcApp } from '../../types';
import { humanize } from '../../lib/format';

/** Field whose value is the money amount (for currency formatting and analytics). */
export function amountFieldOf(app: CalcApp): string | undefined {
  return app.uiConfig?.analytics?.amountField ?? app.uiConfig?.summaryMetrics?.[0]?.key;
}

/** Field that holds the record's date (stored as record_date by the gateway). */
export function dateFieldOf(app: CalcApp, fieldIds: string[]): string | undefined {
  return ['record_date', 'expense_date'].find((id) => fieldIds.includes(id));
}

export function outputLabel(app: CalcApp, outputId: string): string {
  return app.formulaConfig?.outputs?.find((o) => o.id === outputId)?.label ?? humanize(outputId);
}

export function outputFormat(app: CalcApp, outputId: string): string | undefined {
  return app.formulaConfig?.outputs?.find((o) => o.id === outputId)?.format;
}

export function hasFormulaRules(app: CalcApp): boolean {
  return (app.formulaConfig?.rules?.length ?? 0) > 0;
}

export function isTracker(app: CalcApp): boolean {
  return app.uiConfig?.toolType === 'tracker';
}
