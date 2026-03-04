import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Briefcase, Star, Loader2, AlertCircle, Trash2, CheckCircle2, Plus, X, ChevronDown, Search, ShieldCheck, ShieldX } from 'lucide-react';
import { validateCNPJ } from '@/utils/validators';
import { CNAE_LIST, formatCNAECode as formatCNAECodeFromList, getLC116Item } from '@/utils/cnae-lc116';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

// Faixas de alíquota efetiva mín/máx por anexo do Simples Nacional
const ALIQUOTA_RANGE: Record<string, { min: string; max: string }> = {
  'I':   { min: '4,00%',  max: '19,00%' },
  'II':  { min: '4,50%',  max: '30,00%' },
  'III': { min: '6,00%',  max: '33,00%' },
  'IV':  { min: '4,50%',  max: '33,00%' },
  'V':   { min: '15,50%', max: '30,50%' },
};

function getAliquotaRange(anexo: string | null | undefined): string | null {
  if (!anexo) return null;
  const key = anexo.replace(/[^IViv]/g, '').toUpperCase();
  const range = ALIQUOTA_RANGE[key];
  return range ? `${range.min} a ${range.max}` : null;
}

interface CNAEAtividade {
  codigo: number | string;
  descricao: string;
  isPrincipal: boolean;
  isManual?: boolean;
  anexo?: string | null;
  anexoLoading?: boolean;
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

function formatCNAECode(codigo: number | string): string {
  const str = String(codigo).replace(/\D/g, '').padStart(7, '0');
  if (str.length >= 7) return `${str.slice(0, 4)}-${str.slice(4, 5)}/${str.slice(5, 7)}`;
  return str;
}

const CNAESection: React.FC<Props> = ({ cnpj, cnaeEscolhido, onCnaeEscolhidoChange, rbt12 = 0, cnaesLista, onCnaesListaChange }) => {
  const [manualActivities, setManualActivitiesRaw] = useState<CNAEAtividade[]>(cnaesLista || []);
  const [manualCnae, setManualCnae] = useState('');
  const [manualCnaeDescricaoIBGE, setManualCnaeDescricaoIBGE] = useState('');
  const [showCnaeDropdown, setShowCnaeDropdown] = useState(false);
  const [anexoCache, setAnexoCache] = useState<Record<string, string | null>>({});
  const cnaeDropdownRef = useRef<HTMLDivElement>(null);

  // Sync from parent on load
  useEffect(() => {
    if (cnaesLista && cnaesLista.length > 0 && manualActivities.length === 0) {
      setManualActivitiesRaw(cnaesLista);
    }
  }, [cnaesLista]);

  const setManualActivities = useCallback((updater: CNAEAtividade[] | ((prev: CNAEAtividade[]) => CNAEAtividade[])) => {
    setManualActivitiesRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      onCnaesListaChange?.(next);
      return next;
    });
  }, [onCnaesListaChange]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cnaeDropdownRef.current && !cnaeDropdownRef.current.contains(e.target as Node)) setShowCnaeDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const cnaeManualResults = useMemo(() => {
    const q = manualCnae.trim();
    if (!q) return [];
    const normalized = q.toLowerCase();
    const digits = q.replace(/\D/g, '');
    const matches: typeof CNAE_LIST = [];
    for (const entry of CNAE_LIST) {
      if (matches.length >= 30) break;
      if (digits && entry.codigo.startsWith(digits)) matches.push(entry);
      else if (entry.descricao.toLowerCase().includes(normalized)) matches.push(entry);
    }
    return matches;
  }, [manualCnae]);

  // Fetch anexo info for dropdown results
  useEffect(() => {
    if (cnaeManualResults.length === 0) return;
    const toFetch = cnaeManualResults.filter(e => !(e.codigo in anexoCache)).map(e => e.codigo);
    if (toFetch.length === 0) return;

    const fetchAnexos = async () => {
      // 1. Batch query from DB
      const { data } = await supabase
        .from('cnae_catalogo')
        .select('codigo_cnae, anexo')
        .in('codigo_cnae', toFetch);

      const newCache: Record<string, string | null> = {};
      const found = new Set<string>();
      if (data) {
        for (const row of data) {
          newCache[row.codigo_cnae] = row.anexo;
          found.add(row.codigo_cnae);
        }
      }

      // 2. For codes not in DB, call AI fallback (limit to first 5 to avoid too many calls)
      const notFound = toFetch.filter(c => !found.has(c)).slice(0, 5);
      const aiPromises = notFound.map(async (code) => {
        const entry = cnaeManualResults.find(e => e.codigo === code);
        try {
          const { data: aiData } = await supabase.functions.invoke('cnae-anexo-lookup', {
            body: { codigo_cnae: code, descricao: entry?.descricao || '' },
          });
          newCache[code] = aiData?.success ? aiData.anexo : null;
        } catch {
          newCache[code] = null;
        }
      });
      await Promise.all(aiPromises);

      // Mark remaining not-fetched as null
      for (const code of toFetch) {
        if (!(code in newCache)) newCache[code] = null;
      }

      setAnexoCache(prev => ({ ...prev, ...newCache }));
    };

    fetchAnexos();
  }, [cnaeManualResults]);

  const handleRemove = (e: React.MouseEvent, codigo: string) => {
    e.stopPropagation();
    setManualActivities((prev) => prev.filter((a) => String(a.codigo) !== codigo));
    if (cnaeEscolhido === codigo) {
      const remaining = manualActivities.filter((a) => String(a.codigo) !== codigo);
      if (remaining.length > 0) onCnaeEscolhidoChange(String(remaining[0].codigo), remaining[0].descricao);
    }
  };

  const handleSelect = (atividade: CNAEAtividade) => {
    onCnaeEscolhidoChange(String(atividade.codigo), atividade.descricao);
  };

  const handleManualCnaeChange = (value: string) => {
    setManualCnae(value);
    setShowCnaeDropdown(value.trim().length > 0);
    const digits = value.replace(/\D/g, '');
    const cnaeEntry = CNAE_LIST.find(e => e.codigo === digits);
    setManualCnaeDescricaoIBGE(cnaeEntry?.descricao || '');
  };

  const checkAnexo = async (codigoCnae: string, descricao?: string): Promise<string | null> => {
    try {
      // 1. Try local database first
      const { data } = await supabase
        .from('cnae_catalogo')
        .select('anexo')
        .eq('codigo_cnae', codigoCnae)
        .maybeSingle();
      if (data?.anexo) return data.anexo;

      // 2. Fallback: AI lookup via edge function (also saves to DB)
      const { data: aiData, error } = await supabase.functions.invoke('cnae-anexo-lookup', {
        body: { codigo_cnae: codigoCnae, descricao: descricao || '' },
      });
      if (!error && aiData?.success) {
        return aiData.anexo || null;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleAddManual = async () => {
    const cleaned = manualCnae.replace(/\D/g, '');
    if (cleaned.length < 7) return;
    if (manualActivities.some((a) => String(a.codigo).replace(/\D/g, '') === cleaned)) return;
    
    // Use cache if available, otherwise fetch
    let anexo: string | null = null;
    if (cleaned in anexoCache) {
      anexo = anexoCache[cleaned];
    } else {
      anexo = await checkAnexo(cleaned, manualCnaeDescricaoIBGE);
      setAnexoCache(prev => ({ ...prev, [cleaned]: anexo }));
    }

    const nova: CNAEAtividade = {
      codigo: cleaned,
      descricao: manualCnaeDescricaoIBGE || 'Inclusão manual',
      isPrincipal: false,
      isManual: true,
      anexo,
      anexoLoading: false,
    };
    setManualActivities((prev) => [...prev, nova]);
    setManualCnae('');
    setManualCnaeDescricaoIBGE('');
    if (!cnaeEscolhido) onCnaeEscolhidoChange(cleaned, nova.descricao);
  };

  const selectedActivity = manualActivities.find((a) => String(a.codigo) === cnaeEscolhido);

  return (
    <div className="section-card p-3">
      <h2 className="section-title text-sm mb-2">
        <Briefcase className="w-4 h-4 text-primary" />
        Código Cnae
      </h2>

      {/* Campo de pesquisa CNAE — acima da lista */}
      <div className="space-y-2">
        <div ref={cnaeDropdownRef} className={`radio-card flex flex-col items-start p-2 ${manualCnae ? 'radio-card-selected' : ''}`}>
          <div className="text-xs font-bold leading-tight flex items-center gap-1 mb-1 text-primary"><Search className="w-3.5 h-3.5" />Pesquise</div>
          <div className="w-full space-y-1">
            <div className="relative">
              <Input placeholder="Ex: 6201-5/00 ou 6201500" value={manualCnae} onChange={e => handleManualCnaeChange(e.target.value)} onFocus={() => { if (manualCnae.trim()) setShowCnaeDropdown(true); }} className="h-8 text-sm pr-8" />
              <button type="button" onClick={() => setShowCnaeDropdown(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showCnaeDropdown && cnaeManualResults.length > 0 && (
                <div className="absolute z-30 top-full mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                  {cnaeManualResults.map(entry => (
                    <button key={entry.codigo} type="button" onClick={() => { handleManualCnaeChange(entry.codigo); setShowCnaeDropdown(false); }} className="w-full text-left px-3 py-1.5 border-b border-border/50 last:border-b-0 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-primary shrink-0">{formatCNAECodeFromList(entry.codigo)}</span>
                        <span className="text-xs text-foreground/70 truncate flex-1">{entry.descricao}</span>
                        {entry.codigo in anexoCache && (() => {
                          const anexo = anexoCache[entry.codigo];
                          const isIII = anexo?.toUpperCase().includes('III');
                          return (
                            <span className={`flex items-center gap-0.5 text-[10px] px-1 py-0.5 rounded font-medium shrink-0 ${isIII ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-destructive bg-destructive/10'}`}>
                              {isIII ? <ShieldCheck className="w-2.5 h-2.5" /> : <ShieldX className="w-2.5 h-2.5" />}
                              {anexo || '?'}
                            </span>
                          );
                        })()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {manualCnaeDescricaoIBGE && <p className="text-xs text-foreground/70 leading-snug">{manualCnaeDescricaoIBGE}</p>}
          </div>
        </div>

        {manualCnae.replace(/\D/g, '') && (
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={handleAddManual} disabled={!manualCnae.replace(/\D/g, '')} className="text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </Button>
          </div>
        )}
      </div>

      {/* Lista de CNAEs adicionados */}
      {manualActivities.length > 0 && (
        <div className="mt-3">
          <p className="section-title text-sm mb-1.5"><Briefcase className="w-4 h-4 text-primary" />Lista Cnae</p>
          <div className="border border-border rounded-lg divide-y divide-border">
            {manualActivities.map((atividade) => {
              const codigo = String(atividade.codigo);
              const isSelected = cnaeEscolhido === codigo;
              return (
                <div key={codigo} className={`group flex items-center gap-2 px-2.5 py-1.5 transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                  <button type="button" onClick={() => handleSelect(atividade)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                    <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-primary' : 'border-muted-foreground/40'}`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                    <p className="text-xs text-foreground leading-snug truncate">
                      {atividade.isManual && <span className="text-muted-foreground font-medium">Manual </span>}
                      <span className="font-semibold text-primary font-mono">{formatCNAECode(atividade.codigo)}</span>
                      <span className="text-muted-foreground"> - </span>
                      <span>{atividade.descricao}</span>
                      {atividade.anexoLoading && <span className="text-muted-foreground"> - <Loader2 className="w-3 h-3 animate-spin inline" /></span>}
                      {!atividade.anexoLoading && atividade.anexo !== undefined && (
                        <span className={atividade.anexo?.toUpperCase().includes('III') ? 'text-green-600' : 'text-destructive'}>
                          {' - '}{atividade.anexo ? `Anexo ${atividade.anexo}` : 'Não encontrado'}
                        </span>
                      )}
                    </p>
                  </button>
                  <button type="button" onClick={(e) => handleRemove(e, codigo)} title="Remover" className="shrink-0 p-1 rounded text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CNAESection;
