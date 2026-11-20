import { BadRequestException } from '@nestjs/common';
import { sanitizeFormulaExpression } from './sanitizer';

describe('sanitizeFormulaExpression', () => {
  it('accepts variable names that merely contain blocked words', () => {
    expect(sanitizeFormulaExpression('important_rate * 2')).toBe('important_rate * 2');
    expect(sanitizeFormulaExpression('base_cost + constructor_fee')).toBe('base_cost + constructor_fee');
    expect(sanitizeFormulaExpression('functional_units / 3')).toBe('functional_units / 3');
  });

  it('rejects code-like expressions', () => {
    for (const expr of ['eval(1)', 'import x', 'a.constructor', 'process.exit(1)', 'require(x)']) {
      expect(() => sanitizeFormulaExpression(expr)).toThrow(BadRequestException);
    }
  });

  it('rejects characters outside the math whitelist', () => {
    expect(() => sanitizeFormulaExpression('a; b')).toThrow(BadRequestException);
    expect(() => sanitizeFormulaExpression('a["b"]')).toThrow(BadRequestException);
  });
});
