import { describe, expect, it } from 'vitest';
import { normalizeLogradouro } from './validators';

describe('normalizeLogradouro', () => {
  it('preserves trailing space while typing', () => {
    expect(normalizeLogradouro('Rua ')).toBe('R ');
    expect(normalizeLogradouro('Av ')).toBe('AV ');
  });

  it('normalizes common prefixes without blocking continuation typing', () => {
    expect(normalizeLogradouro('Rua das Flores')).toBe('R DAS FLORES');
    expect(normalizeLogradouro('Avenida Brasil')).toBe('AV BRASIL');
  });
});
