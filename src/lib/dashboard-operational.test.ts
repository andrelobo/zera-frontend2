import { describe, expect, it } from 'vitest';

import {
  buildOperationalPriorities,
  getEmissionHealth,
  selectCompaniesRequiringAction,
} from '@/lib/dashboard-operational';

describe('dashboard operacional', () => {
  it('resume a fila recente e calcula a taxa de autorizacao', () => {
    expect(
      getEmissionHealth([
        { status: 'AUTHORIZED' },
        { status: 'AUTHORIZED' },
        { status: 'PENDING' },
        { status: 'ERROR' },
      ]),
    ).toEqual({
      total: 4,
      authorized: 2,
      processing: 1,
      failed: 1,
      other: 0,
      authorizationRate: 50,
    });
  });

  it('mantem a taxa em zero quando a fila esta vazia', () => {
    expect(getEmissionHealth([]).authorizationRate).toBe(0);
  });

  it('ordena prioridades por severidade operacional', () => {
    const priorities = buildOperationalPriorities({
      failedEmissions: 2,
      onboardingCompanies: 1,
      attentionCompanies: 3,
      isReadOnly: false,
    });

    expect(priorities.map((item) => item.kind)).toEqual([
      'emission-failure',
      'company-onboarding',
      'company-review',
    ]);
    expect(priorities[0].href).toBe('/nfse');
  });

  it('devolve um estado saudavel quando nao ha pendencias', () => {
    expect(
      buildOperationalPriorities({
        failedEmissions: 0,
        onboardingCompanies: 0,
        attentionCompanies: 0,
        isReadOnly: true,
      }),
    ).toMatchObject([{ kind: 'healthy', href: '/nfse' }]);
  });

  it('limita o foco a quatro prestadoras que exigem acao', () => {
    const companies = Array.from({ length: 7 }, (_, index) => ({
      id: String(index),
      readiness: {
        tone: index < 2 ? ('ready' as const) : index < 5 ? ('attention' as const) : ('onboarding' as const),
      },
    }));

    expect(selectCompaniesRequiringAction(companies).map((item) => item.id)).toEqual(['5', '6', '2', '3']);
  });
});
