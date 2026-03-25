import { describe, expect, it } from 'vitest';
import { promoteSelectedCnaeAsPrincipal, type CNAEAtividade } from './CNAESection';

describe('CNAESection logic', () => {
  it('marks only the selected CNAE as principal', () => {
    const atividades: CNAEAtividade[] = [
      {
        codigo: '8650003',
        descricao: 'Atividades de psicologia e psicanálise',
        isPrincipal: true,
        isManual: true,
        anexo: 'III',
        anexoLoading: false,
      },
      {
        codigo: '8122200',
        descricao: 'Imunização e controle de pragas urbanas',
        isPrincipal: false,
        isManual: true,
        anexo: 'III',
        anexoLoading: false,
      },
    ];

    const next = promoteSelectedCnaeAsPrincipal(atividades, '8122200');
    expect(next[0].isPrincipal).toBe(false);
    expect(next[1].isPrincipal).toBe(true);
  });
});
