export type CompanyReadinessTone = 'ready' | 'attention' | 'onboarding';

export type CompanyWithReadiness = {
  id: string;
  readiness: { tone: CompanyReadinessTone };
};

export type OperationalPriority = {
  kind: 'emission-failure' | 'company-onboarding' | 'company-review' | 'healthy';
  title: string;
  description: string;
  href: string;
  tone: 'critical' | 'warning' | 'neutral' | 'success';
  count?: number;
};

export function getEmissionHealth(items: Array<{ status?: string | null }>) {
  const authorized = items.filter((item) => item.status === 'AUTHORIZED').length;
  const processing = items.filter(
    (item) => item.status === 'PENDING' || item.status === 'PROCESSING',
  ).length;
  const failed = items.filter(
    (item) => item.status === 'ERROR' || item.status === 'REJECTED',
  ).length;
  const total = items.length;

  return {
    total,
    authorized,
    processing,
    failed,
    other: Math.max(0, total - authorized - processing - failed),
    authorizationRate: total > 0 ? Math.round((authorized / total) * 100) : 0,
  };
}

export function buildOperationalPriorities(input: {
  failedEmissions: number;
  onboardingCompanies: number;
  attentionCompanies: number;
  isReadOnly: boolean;
}): OperationalPriority[] {
  const priorities: OperationalPriority[] = [];

  if (input.failedEmissions > 0) {
    priorities.push({
      kind: 'emission-failure',
      title: 'Resolver falhas fiscais',
      description: `${input.failedEmissions} emissao(oes) recente(s) com erro ou rejeicao.`,
      href: '/nfse',
      tone: 'critical',
      count: input.failedEmissions,
    });
  }

  if (input.onboardingCompanies > 0) {
    priorities.push({
      kind: 'company-onboarding',
      title: 'Concluir onboarding',
      description: `${input.onboardingCompanies} prestadora(s) ainda sem prontidao operacional.`,
      href: '/empresas',
      tone: 'warning',
      count: input.onboardingCompanies,
    });
  }

  if (input.attentionCompanies > 0) {
    priorities.push({
      kind: 'company-review',
      title: 'Revisar cadastros',
      description: `${input.attentionCompanies} prestadora(s) proximas da prontidao, mas com pendencias.`,
      href: '/empresas',
      tone: 'neutral',
      count: input.attentionCompanies,
    });
  }

  if (priorities.length === 0) {
    priorities.push({
      kind: 'healthy',
      title: 'Operacao sem pendencias criticas',
      description: 'Continue acompanhando as novas emissoes e a saude das prestadoras.',
      href: '/nfse',
      tone: 'success',
    });
  }

  return priorities;
}

export function selectCompaniesRequiringAction<T extends CompanyWithReadiness>(items: T[], limit = 4): T[] {
  const priority: Record<CompanyReadinessTone, number> = {
    onboarding: 0,
    attention: 1,
    ready: 2,
  };

  return items
    .filter((item) => item.readiness.tone !== 'ready')
    .sort((a, b) => priority[a.readiness.tone] - priority[b.readiness.tone])
    .slice(0, limit);
}
