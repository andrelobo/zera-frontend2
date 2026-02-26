import { useMemo, useState } from 'react';
import { Briefcase, Plus, Search, Trash2 } from 'lucide-react';
import { CNAE_LIST, formatCNAECode } from '@/utils/cnae-lc116';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CNAEAtividade {
  codigo: number | string;
  descricao: string;
  isPrincipal: boolean;
}

interface Props {
  cnpj: string;
  cnaeEscolhido: string | null;
  onCnaeEscolhidoChange: (codigo: string, descricao: string) => void;
  rbt12?: number;
  cnaesLista?: CNAEAtividade[];
  onCnaesListaChange?: (lista: CNAEAtividade[]) => void;
}

export type { CNAEAtividade };

const CNAESection = ({
  cnaeEscolhido,
  onCnaeEscolhidoChange,
  cnaesLista = [],
  onCnaesListaChange,
}: Props) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const value = query.trim();
    if (!value) return [];
    const normalized = value.toLowerCase();
    const digits = value.replace(/\D/g, '');
    const existing = new Set(cnaesLista.map((item) => String(item.codigo).replace(/\D/g, '')));

    return CNAE_LIST.filter((entry) => {
      if (existing.has(entry.codigo)) return false;
      if (digits) return entry.codigo.startsWith(digits);
      return entry.descricao.toLowerCase().includes(normalized);
    }).slice(0, 20);
  }, [query, cnaesLista]);

  const addCnae = (codigo: string, descricao: string) => {
    const next = [...cnaesLista, { codigo, descricao, isPrincipal: cnaesLista.length === 0 }];
    onCnaesListaChange?.(next);
    if (!cnaeEscolhido) {
      onCnaeEscolhidoChange(codigo, descricao);
    }
    setQuery('');
  };

  const removeCnae = (codigo: string) => {
    const next = cnaesLista.filter((item) => String(item.codigo) !== codigo);
    onCnaesListaChange?.(next);
    if (cnaeEscolhido === codigo && next.length > 0) {
      onCnaeEscolhidoChange(String(next[0].codigo), next[0].descricao);
    }
  };

  const selectPrincipal = (codigo: string, descricao: string) => {
    const next = cnaesLista.map((item) => ({
      ...item,
      isPrincipal: String(item.codigo) === codigo,
    }));
    onCnaesListaChange?.(next);
    onCnaeEscolhidoChange(codigo, descricao);
  };

  return (
    <div className="section-card p-3">
      <h2 className="section-title text-sm mb-2">
        <Briefcase className="w-4 h-4 text-primary" />
        Código CNAE
      </h2>

      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Digite código ou descrição CNAE"
              className="pl-8"
            />
          </div>
        </div>

        {results.length > 0 && (
          <div className="rounded-lg border border-border overflow-hidden">
            {results.map((entry) => (
              <button
                key={entry.codigo}
                type="button"
                onClick={() => addCnae(entry.codigo, entry.descricao)}
                className="w-full flex items-center justify-between gap-2 p-2 text-left border-b border-border last:border-b-0 hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-primary font-mono">
                    {formatCNAECode(entry.codigo)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{entry.descricao}</p>
                </div>
                <Button type="button" size="sm" variant="ghost" className="shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </button>
            ))}
          </div>
        )}
      </div>

      {cnaesLista.length > 0 && (
        <div className="mt-3 rounded-lg border border-border overflow-hidden">
          {cnaesLista.map((item) => {
            const codigo = String(item.codigo);
            const selected = cnaeEscolhido === codigo;
            return (
              <div
                key={codigo}
                className={`flex items-center gap-2 p-2 border-b border-border last:border-b-0 ${selected ? 'bg-primary/5' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => selectPrincipal(codigo, item.descricao)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="text-xs">
                    <span className="font-mono font-semibold text-primary">{formatCNAECode(codigo)}</span>
                    <span className="text-muted-foreground"> - {item.descricao}</span>
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => removeCnae(codigo)}
                  className="p-1 rounded hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CNAESection;
