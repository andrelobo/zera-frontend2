import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Receipt, Search, CheckCircle2, AlertCircle, X, Plus, Trash2, PenLine, ChevronDown, Star } from 'lucide-react';
import { getCTNByCode, isValidCTN, searchCTN, searchCTNByItem } from '@/utils/ctn-data';
import { CNAE_LIST, formatCNAECode, getLC116Item, type CNAEEntry } from '@/utils/cnae-lc116';
import { getNBSDescricao, searchNBS, searchNBSByPrefix, type NBSEntry } from '@/utils/nbs-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

/** Um vínculo CTN + NBS associado a um CNAE */
interface CtnNbsVinculo {
  id: string; // unique key
  ctn: string | undefined;
  ctnDescricao?: string;
  nbs?: string;
  nbsDescricao?: string;
}

interface CnaeAdicionado {
  codigo: string;
  cnaeDescricao: string;
  lc116Descricao: string;
  lc116Item: string;
  vinculos: CtnNbsVinculo[];
  isManual?: boolean;
  isPrincipal?: boolean;
  vinculadoSN?: boolean;
}

interface RegimeCnaeItem {
  codigo: number | string;
  descricao: string;
  isPrincipal?: boolean;
}

interface Props {
  ctnSelecionado: string | null;
  onCtnChange: (codigo: string, descricao: string, itemFormatado: string) => void;
  savedCnaes?: CnaeAdicionado[];
  onCnaesChange?: (cnaes: CnaeAdicionado[]) => void;
  regimeCnaes?: RegimeCnaeItem[];
}

export type { CnaeAdicionado, CtnNbsVinculo };

let vinculoIdCounter = 0;
function nextVinculoId() {
  return `v_${++vinculoIdCounter}_${Date.now()}`;
}

function createVinculo(ctn?: string, ctnDescricao?: string, nbs?: string, nbsDescricao?: string): CtnNbsVinculo {
  return { id: nextVinculoId(), ctn: ctn || undefined, ctnDescricao, nbs: nbs || undefined, nbsDescricao };
}

const CTNSection: React.FC<Props> = ({ ctnSelecionado, onCtnChange, savedCnaes, onCnaesChange, regimeCnaes }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [cnaes, setCnaesLocal] = useState<CnaeAdicionado[]>(savedCnaes || []);

  const setCnaes: React.Dispatch<React.SetStateAction<CnaeAdicionado[]>> = useCallback((action) => {
    setCnaesLocal(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      onCnaesChange?.(next);
      return next;
    });
  }, [onCnaesChange]);

  // Sync from saved data on load
  useEffect(() => {
    if (savedCnaes && savedCnaes.length > 0 && cnaes.length === 0) {
      setCnaesLocal(savedCnaes);
    }
  }, [savedCnaes]);

  // Auto-sync CNAEs from regime tributário tab (add new + remove deleted)
  useEffect(() => {
    if (!regimeCnaes) return;
    const regimeCodes = new Set(regimeCnaes.map(rc => String(rc.codigo).replace(/\D/g, '')));

    setCnaes(prev => {
      // Remove items that came from regime (vinculadoSN) but are no longer in regimeCnaes
      let updated = prev.filter(c => !c.vinculadoSN || regimeCodes.has(c.codigo));

      // Add new items from regime not yet present
      const existingCodes = new Set(updated.map(c => c.codigo));
      for (const rc of regimeCnaes) {
        const codigo = String(rc.codigo).replace(/\D/g, '');
        if (!codigo || existingCodes.has(codigo)) continue;
        const lc = getLC116Item(codigo);
        const ctnCode = lc?.ctn;
        const ctnEntry = ctnCode ? getCTNByCode(ctnCode) : null;
        const vinculo = createVinculo(
          ctnCode,
          ctnEntry?.descricao || lc?.descricao,
          lc?.nbs || ctnEntry?.nbs,
          lc?.nbs ? (getNBSDescricao(lc.nbs) || lc.nbs) : ctnEntry?.nbs ? (getNBSDescricao(ctnEntry.nbs) || ctnEntry.nbs) : undefined,
        );
        updated.push({
          codigo,
          cnaeDescricao: rc.descricao || 'Importado do Regime',
          lc116Descricao: lc?.descricao || '',
          lc116Item: lc?.item || '',
          vinculos: [vinculo],
          isPrincipal: !!rc.isPrincipal,
          vinculadoSN: true,
        });
      }

      return updated;
    });
  }, [regimeCnaes]);
  const [pendingEntry, setPendingEntry] = useState<CNAEEntry | null>(null);
  const [pendingPrincipal, setPendingPrincipal] = useState(false);
  const [pendingVincularSN, setPendingVincularSN] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualCnae, setManualCnae] = useState('');
  const [manualCtn, setManualCtn] = useState('');
  const [manualNbs, setManualNbs] = useState('');
  const [manualDescricao, setManualDescricao] = useState('');
  const [manualIsPrincipal, setManualIsPrincipal] = useState(false);
  const [manualVincularSN, setManualVincularSN] = useState(false);
  const [manualCnaeDescricaoIBGE, setManualCnaeDescricaoIBGE] = useState('');
  const [ctnQuery, setCtnQuery] = useState('');
  const [detectedItem, setDetectedItem] = useState<string | null>(null);
  const [nbsQuery, setNbsQuery] = useState('');
  const [detectedNbsPrefix, setDetectedNbsPrefix] = useState<string | null>(null);
  const [showCnaeDropdown, setShowCnaeDropdown] = useState(false);
  const [showCtnDropdown, setShowCtnDropdown] = useState(false);
  const [showNbsDropdown, setShowNbsDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cnaeDropdownRef = useRef<HTMLDivElement>(null);
  const ctnDropdownRef = useRef<HTMLDivElement>(null);
  const nbsDropdownRef = useRef<HTMLDivElement>(null);

  const cnaeManualResults = useMemo(() => {
    const q = manualCnae.trim();
    if (!q) return [];
    const normalized = q.toLowerCase();
    const digits = q.replace(/\D/g, '');
    const matches: CNAEEntry[] = [];
    for (const entry of CNAE_LIST) {
      if (matches.length >= 30) break;
      if (digits && entry.codigo.startsWith(digits)) {
        matches.push(entry);
      } else if (entry.descricao.toLowerCase().includes(normalized)) {
        matches.push(entry);
      }
    }
    return matches;
  }, [manualCnae]);

  const ctnResults = useMemo(() => {
    if (detectedItem) {
      return searchCTNByItem(detectedItem, ctnQuery.trim(), 30);
    }
    return searchCTN(ctnQuery.trim(), 30);
  }, [ctnQuery, detectedItem]);

  const nbsResults = useMemo(() => {
    if (detectedNbsPrefix) {
      return searchNBSByPrefix(detectedNbsPrefix, nbsQuery.trim(), 30);
    }
    return searchNBS(nbsQuery.trim(), 30);
  }, [nbsQuery, detectedNbsPrefix]);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    const normalized = q.toLowerCase();
    const digits = q.replace(/\D/g, '');
    const addedCodes = new Set(cnaes.map(c => c.codigo));
    const matches: CNAEEntry[] = [];
    for (const entry of CNAE_LIST) {
      if (matches.length >= 30) break;
      if (addedCodes.has(entry.codigo)) continue;
      if (digits && entry.codigo.startsWith(digits)) {
        matches.push(entry);
      } else if (!digits && entry.descricao.toLowerCase().includes(normalized)) {
        matches.push(entry);
      }
    }
    return matches;
  }, [query, cnaes]);

  const selectedEntry = ctnSelecionado ? getCTNByCode(ctnSelecionado) : null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
      if (cnaeDropdownRef.current && !cnaeDropdownRef.current.contains(e.target as Node)) {
        setShowCnaeDropdown(false);
      }
      if (ctnDropdownRef.current && !ctnDropdownRef.current.contains(e.target as Node)) {
        setShowCtnDropdown(false);
      }
      if (nbsDropdownRef.current && !nbsDropdownRef.current.contains(e.target as Node)) {
        setShowNbsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleManualCnaeChange = (value: string) => {
    setManualCnae(value);
    setShowCnaeDropdown(value.trim().length > 0);
    const digits = value.replace(/\D/g, '');
    const cnaeEntry = CNAE_LIST.find(e => e.codigo === digits);
    setManualCnaeDescricaoIBGE(cnaeEntry?.descricao || '');
    if (digits.length >= 7) {
      const lc = getLC116Item(digits);
      if (lc) {
        const itemParts = lc.item.split('.');
        const itemNum = itemParts[0].padStart(2, '0');
        setDetectedItem(itemNum);
        if (lc.ctn) {
          setManualCtn(lc.ctn);
          setCtnQuery('');
        }
        if (lc.nbs) {
          setManualNbs(lc.nbs);
          setNbsQuery('');
          const nbsPrefix = lc.nbs.substring(0, 4);
          setDetectedNbsPrefix(nbsPrefix);
        } else {
          setDetectedNbsPrefix(null);
        }
        setManualDescricao(lc.descricao);
      } else {
        setDetectedItem(null);
        setDetectedNbsPrefix(null);
      }
    } else {
      setDetectedItem(null);
      setDetectedNbsPrefix(null);
    }
  };

  const handleAddCNAE = (entry: CNAEEntry) => {
    setPendingEntry(entry);
    setPendingPrincipal(false);
    setPendingVincularSN(false);
    setQuery('');
    setIsOpen(false);
  };

  const handleConfirmPending = () => {
    if (!pendingEntry) return;
    const entry = pendingEntry;
    const ctnEntry = entry.lc116.ctn ? getCTNByCode(entry.lc116.ctn) : null;
    const vinculo = createVinculo(
      entry.lc116.ctn,
      ctnEntry?.descricao || entry.lc116.descricao,
      entry.lc116.nbs || ctnEntry?.nbs,
      getNBSDescricao(entry.lc116.nbs || ctnEntry?.nbs || '') || undefined,
    );
    const novo: CnaeAdicionado = {
      codigo: entry.codigo,
      cnaeDescricao: entry.descricao,
      lc116Descricao: entry.descricaoLC116,
      lc116Item: entry.lc116.item,
      vinculos: [vinculo],
      isPrincipal: pendingPrincipal,
      vinculadoSN: pendingVincularSN,
    };
    setCnaes(prev => {
      if (pendingPrincipal) {
        return [...prev.map(c => ({ ...c, isPrincipal: false })), novo];
      }
      return [...prev, novo];
    });
    if (!ctnSelecionado && entry.lc116.ctn) {
      const ctnEntry = getCTNByCode(entry.lc116.ctn);
      if (ctnEntry) {
        onCtnChange(ctnEntry.codigo, ctnEntry.descricao, ctnEntry.itemFormatado);
      } else {
        onCtnChange(entry.lc116.ctn, entry.lc116.descricao, entry.lc116.item);
      }
    }
    setPendingEntry(null);
  };

  const handleCancelPending = () => {
    setPendingEntry(null);
  };

  const handleRemoveCNAE = (codigo: string) => {
    setCnaes(prev => prev.filter(c => c.codigo !== codigo));
  };

  const handleSelectCNAEForCTN = (cnae: CnaeAdicionado) => {
    const firstVinculo = cnae.vinculos[0];
    if (firstVinculo?.ctn) {
      const ctnEntry = getCTNByCode(firstVinculo.ctn);
      if (ctnEntry) {
        onCtnChange(ctnEntry.codigo, ctnEntry.descricao, ctnEntry.itemFormatado);
      }
    }
  };

  const handleTogglePrincipal = (codigo: string) => {
    setCnaes(prev => prev.map(c => ({
      ...c,
      isPrincipal: c.codigo === codigo ? !c.isPrincipal : false,
    })));
  };

  const handleToggleVinculadoSN = (codigo: string) => {
    setCnaes(prev => prev.map(c =>
      c.codigo === codigo ? { ...c, vinculadoSN: !c.vinculadoSN } : c
    ));
  };

  const handleAddVinculo = (cnaeCodigo: string, ctn?: string, nbs?: string) => {
    const ctnEntry = ctn ? getCTNByCode(ctn) : null;
    const vinculo = createVinculo(
      ctn,
      ctnEntry?.descricao || undefined,
      nbs || ctnEntry?.nbs || undefined,
      nbs ? (getNBSDescricao(nbs) || nbs) : ctnEntry?.nbs ? (getNBSDescricao(ctnEntry.nbs) || ctnEntry.nbs) : undefined,
    );
    setCnaes(prev => prev.map(c =>
      c.codigo === cnaeCodigo ? { ...c, vinculos: [...c.vinculos, vinculo] } : c
    ));
  };

  const handleRemoveVinculo = (cnaeCodigo: string, vinculoId: string) => {
    setCnaes(prev => prev.map(c =>
      c.codigo === cnaeCodigo
        ? { ...c, vinculos: c.vinculos.filter(v => v.id !== vinculoId) }
        : c
    ));
  };

  const handleUpdateVinculoCtn = (cnaeCodigo: string, vinculoId: string, newCtn: string) => {
    const ctnEntry = newCtn ? getCTNByCode(newCtn) : null;
    setCnaes(prev => prev.map(c =>
      c.codigo === cnaeCodigo
        ? {
            ...c,
            vinculos: c.vinculos.map(v =>
              v.id === vinculoId
                ? {
                    ...v,
                    ctn: newCtn || undefined,
                    ctnDescricao: ctnEntry?.descricao || undefined,
                    nbs: ctnEntry?.nbs || v.nbs,
                    nbsDescricao: ctnEntry?.nbs ? (getNBSDescricao(ctnEntry.nbs) || undefined) : v.nbsDescricao,
                  }
                : v
            ),
          }
        : c
    ));
  };

  const handleUpdateVinculoNbs = (cnaeCodigo: string, vinculoId: string, newNbs: string) => {
    setCnaes(prev => prev.map(c =>
      c.codigo === cnaeCodigo
        ? {
            ...c,
            vinculos: c.vinculos.map(v =>
              v.id === vinculoId
                ? { ...v, nbs: newNbs || undefined, nbsDescricao: newNbs ? (getNBSDescricao(newNbs) || newNbs) : undefined }
                : v
            ),
          }
        : c
    ));
  };

  const handleAddManual = () => {
    const codigo = manualCnae.replace(/\D/g, '');
    if (!codigo) return;
    if (cnaes.some(c => c.codigo === codigo)) return;
    const ctnCode = manualCtn.replace(/\D/g, '') || undefined;
    const ctnEntry = ctnCode ? getCTNByCode(ctnCode) : null;
    const lc = getLC116Item(codigo);
    const vinculo = createVinculo(
      ctnCode,
      ctnEntry?.descricao || (ctnCode ? manualDescricao : undefined),
      manualNbs || undefined,
      manualNbs ? (getNBSDescricao(manualNbs) || manualNbs) : undefined,
    );
    const novo: CnaeAdicionado = {
      codigo,
      cnaeDescricao: manualCnaeDescricaoIBGE || manualDescricao || 'Inclusão manual',
      lc116Descricao: lc?.descricao || manualDescricao || '',
      lc116Item: lc?.item || '',
      vinculos: [vinculo],
      isManual: true,
      isPrincipal: manualIsPrincipal,
      vinculadoSN: manualVincularSN,
    };
    setCnaes(prev => {
      if (manualIsPrincipal) {
        return [...prev.map(c => ({ ...c, isPrincipal: false })), novo];
      }
      return [...prev, novo];
    });
    if (!ctnSelecionado && vinculo.ctn) {
      const ctnEntry = getCTNByCode(vinculo.ctn);
      if (ctnEntry) {
        onCtnChange(ctnEntry.codigo, ctnEntry.descricao, ctnEntry.itemFormatado);
      } else {
        onCtnChange(vinculo.ctn, novo.cnaeDescricao, '');
      }
    }
    setManualCnae('');
    setManualCtn('');
    setManualNbs('');
    setManualDescricao('');
    setManualCnaeDescricaoIBGE('');
    setManualIsPrincipal(false);
    setManualVincularSN(false);
    setCtnQuery('');
    setNbsQuery('');
    setShowManualForm(false);
  };

  const formatCTNDisplay = (codigo: string) => {
    if (codigo.length === 6) {
      return `${codigo.slice(0, 2)}.${codigo.slice(2, 4)}.${codigo.slice(4, 6)}`;
    }
    return codigo;
  };

  return (
    <div>
      <h3 className="text-xs font-bold flex items-center gap-1.5 mb-2" style={{ color: 'hsl(144, 72%, 28%)' }}>
        Parâmetro Municipal
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 items-stretch">
        {/* CNAE Card */}
        <div ref={cnaeDropdownRef} className={`radio-card flex flex-col items-start ${manualCnae ? 'radio-card-selected' : ''}`}>
          <div className="text-sm font-bold leading-tight min-h-[2rem] flex items-center" style={{ color: 'hsl(144, 72%, 28%)' }}>1. Código Cnae<span className="text-red-500">*</span></div>
          <div className="w-full space-y-1">
            <div className="relative">
              <Input
                placeholder="Ex: 6201-5/00 ou 6201500"
                value={manualCnae}
                onChange={e => handleManualCnaeChange(e.target.value)}
                onFocus={() => { if (manualCnae.trim()) setShowCnaeDropdown(true); }}
                className="h-8 text-sm pr-8"
              />
              <button
                type="button"
                onClick={() => setShowCnaeDropdown(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showCnaeDropdown && cnaeManualResults.length > 0 && (
                <div className="absolute z-30 top-full mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                  {cnaeManualResults.map(entry => (
                    <button
                      key={entry.codigo}
                      type="button"
                      onClick={() => {
                        handleManualCnaeChange(entry.codigo);
                        setShowCnaeDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 border-b border-border/50 last:border-b-0 hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-mono text-xs font-semibold text-primary">{formatCNAECode(entry.codigo)}</span>
                      <p className="text-xs text-foreground/70 line-clamp-1">{entry.descricao}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {manualCnaeDescricaoIBGE && (
              <p className="text-xs text-foreground/70 leading-snug">{manualCnaeDescricaoIBGE}</p>
            )}
          </div>
        </div>

        {/* CTN Card */}
        <div ref={ctnDropdownRef} className={`radio-card flex flex-col items-start ${manualCtn ? 'radio-card-selected' : ''}`}>
          <div className="text-sm font-bold leading-tight min-h-[2rem] flex items-center" style={{ color: 'hsl(144, 72%, 28%)' }}>2. Código Tributação Nacional<span className="text-red-500">*</span></div>
          <div className="w-full space-y-1">
            <div className="relative">
              <Input
                placeholder="Buscar CTN..."
                value={showCtnDropdown ? ctnQuery : (manualCtn ? formatCTNDisplay(manualCtn) : '')}
                onChange={e => {
                  setCtnQuery(e.target.value);
                  setShowCtnDropdown(true);
                }}
                onFocus={() => { setCtnQuery(''); setShowCtnDropdown(true); }}
                className="h-8 text-sm pr-8"
              />
              <button
                type="button"
                onClick={() => { if (!showCtnDropdown) setCtnQuery(''); setShowCtnDropdown(v => !v); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showCtnDropdown && ctnResults.length > 0 && (
                <div className="absolute z-30 top-full mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                  {ctnResults.map(entry => {
                    const isSelected = manualCtn === entry.codigo;
                    return (
                      <button
                        key={entry.codigo}
                        type="button"
                        title={`${formatCTNDisplay(entry.codigo)} (${entry.itemFormatado}) — ${entry.descricao}`}
                        onClick={() => {
                          setManualCtn(entry.codigo);
                          setCtnQuery('');
                          setShowCtnDropdown(false);
                          if (entry.nbs && !manualNbs) setManualNbs(entry.nbs);
                        }}
                        className={`w-full text-left px-3 py-2 border-b border-border/50 last:border-b-0 hover:bg-muted/50 transition-colors ${isSelected ? 'bg-primary/10' : ''}`}
                      >
                        <span className="font-mono text-xs font-semibold text-primary">{formatCTNDisplay(entry.codigo)}</span>
                        <span className="text-xs text-muted-foreground ml-2">({entry.itemFormatado})</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary inline ml-2" />}
                        <p className="text-xs text-foreground/70 line-clamp-1">{entry.descricao}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {manualCtn && (
              <p className="text-xs text-foreground/70 leading-snug line-clamp-2" title={getCTNByCode(manualCtn)?.descricao || ''}>{getCTNByCode(manualCtn)?.descricao || ''}</p>
            )}
          </div>
        </div>

        {/* NBS Card */}
        <div ref={nbsDropdownRef} className={`radio-card flex flex-col items-start ${manualNbs ? 'radio-card-selected' : ''}`}>
          <div className="text-sm font-bold leading-tight min-h-[2rem] flex items-center" style={{ color: 'hsl(144, 72%, 28%)' }}>3. Nomenclatura Brasileira Serviços</div>
          <div className="w-full space-y-1">
            <div className="relative">
              <Input
                placeholder="Buscar NBS..."
                value={showNbsDropdown ? nbsQuery : manualNbs}
                onChange={e => {
                  setNbsQuery(e.target.value);
                  setShowNbsDropdown(true);
                }}
                onFocus={() => { setNbsQuery(''); setShowNbsDropdown(true); }}
                className="h-8 text-sm pr-8"
              />
              <button
                type="button"
                onClick={() => { if (!showNbsDropdown) setNbsQuery(''); setShowNbsDropdown(v => !v); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showNbsDropdown && nbsResults.length > 0 && (
                <div className="absolute z-30 top-full mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                  {nbsResults.map(entry => {
                    const isSelected = manualNbs === entry.codigo;
                    return (
                      <button
                        key={entry.codigo}
                        type="button"
                        title={`${entry.codigo} — ${entry.descricao}`}
                        onClick={() => {
                          setManualNbs(entry.codigo);
                          setNbsQuery('');
                          setShowNbsDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 border-b border-border/50 last:border-b-0 hover:bg-muted/50 transition-colors ${isSelected ? 'bg-primary/10' : ''}`}
                      >
                        <span className="font-mono text-xs font-semibold text-primary">{entry.codigo}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary inline ml-2" />}
                        <p className="text-xs text-foreground/70 line-clamp-1">{entry.descricao}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {manualNbs && (
              <p className="text-xs text-foreground/70 leading-snug line-clamp-2" title={getNBSDescricao(manualNbs) || ''}>{getNBSDescricao(manualNbs) || ''}</p>
            )}
          </div>
        </div>
      </div>

      {manualCnae.replace(/\D/g, '') && (
        <div className="flex justify-end -mt-1">
          <Button
            type="button"
            size="sm"
            onClick={handleAddManual}
            disabled={!manualCnae.replace(/\D/g, '')}
            className="text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </Button>
        </div>
      )}


      {/* Pending confirmation panel */}
      {pendingEntry && (
        <div className="mt-3 p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">Confirmar adição do Cnaë</p>
            <button type="button" onClick={handleCancelPending} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-foreground/90">
              <span className="font-mono font-semibold text-primary">{formatCNAECode(pendingEntry.codigo)}</span>
              <span className="ml-2">{pendingEntry.descricao}</span>
            </p>
            {pendingEntry.lc116.ctn && (
              <p className="text-muted-foreground">
                CTN {formatCTNDisplay(pendingEntry.lc116.ctn)}: {pendingEntry.lc116.descricao}
              </p>
            )}
            {(pendingEntry.lc116.nbs || (pendingEntry.lc116.ctn && getCTNByCode(pendingEntry.lc116.ctn)?.nbs)) && (
              <p className="text-muted-foreground">
                NBS {pendingEntry.lc116.nbs || getCTNByCode(pendingEntry.lc116.ctn!)?.nbs}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleCancelPending} className="text-xs">
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={handleConfirmPending} className="text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Adicionar
            </Button>
          </div>
        </div>
      )}

      {/* Lista de CNAEs adicionados — agrupado por CNAE, 1:N vínculos */}
      {cnaes.length > 0 && (
        <div className="mt-1 space-y-2">
          
          <div className="space-y-1.5">
            {cnaes.map((cnae, index) => (
              <CnaeListItem
                key={cnae.codigo}
                cnae={cnae}
                ordem={index + 1}
                onRemove={() => handleRemoveCNAE(cnae.codigo)}
                onTogglePrincipal={() => handleTogglePrincipal(cnae.codigo)}
                onToggleVinculadoSN={() => handleToggleVinculadoSN(cnae.codigo)}
                onAddVinculo={(ctn, nbs) => handleAddVinculo(cnae.codigo, ctn, nbs)}
                onRemoveVinculo={(vinculoId) => handleRemoveVinculo(cnae.codigo, vinculoId)}
                onUpdateVinculoCtn={(vinculoId, ctn) => handleUpdateVinculoCtn(cnae.codigo, vinculoId, ctn)}
                onUpdateVinculoNbs={(vinculoId, nbs) => handleUpdateVinculoNbs(cnae.codigo, vinculoId, nbs)}
                formatCTNDisplay={formatCTNDisplay}
              />
            ))}
          </div>
        </div>
      )}

      {!selectedEntry && !isOpen && cnaes.length === 0 && (
        null
      )}
    </div>
  );
};

/* ─── Sub-component for each CNAE list item (agrupado, 1:N) ─── */
interface CnaeListItemProps {
  cnae: CnaeAdicionado;
  ordem: number;
  onRemove: () => void;
  onTogglePrincipal: () => void;
  onToggleVinculadoSN: () => void;
  onAddVinculo: (ctn?: string, nbs?: string) => void;
  onRemoveVinculo: (vinculoId: string) => void;
  onUpdateVinculoCtn: (vinculoId: string, ctn: string) => void;
  onUpdateVinculoNbs: (vinculoId: string, nbs: string) => void;
  formatCTNDisplay: (c: string) => string;
}

const CnaeListItem: React.FC<CnaeListItemProps> = ({
  cnae, ordem, onRemove, onTogglePrincipal, onToggleVinculadoSN, onAddVinculo, onRemoveVinculo,
  onUpdateVinculoCtn, onUpdateVinculoNbs, formatCTNDisplay
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCtnQuery, setNewCtnQuery] = useState('');
  const [newCtn, setNewCtn] = useState('');
  const [newNbsQuery, setNewNbsQuery] = useState('');
  const [newNbs, setNewNbs] = useState('');
  const [showNewCtnDropdown, setShowNewCtnDropdown] = useState(false);
  const [showNewNbsDropdown, setShowNewNbsDropdown] = useState(false);
  const ctnFormRef = useRef<HTMLDivElement>(null);
  const nbsFormRef = useRef<HTMLDivElement>(null);

  const newCtnResults = useMemo(() => searchCTN(newCtnQuery.trim(), 15), [newCtnQuery]);
  const newNbsResults = useMemo(() => searchNBS(newNbsQuery.trim(), 15), [newNbsQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ctnFormRef.current && !ctnFormRef.current.contains(e.target as Node)) {
        setShowNewCtnDropdown(false);
      }
      if (nbsFormRef.current && !nbsFormRef.current.contains(e.target as Node)) {
        setShowNewNbsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleConfirmAdd = () => {
    if (!newCtn && !newNbs) return;
    onAddVinculo(newCtn || undefined, newNbs || undefined);
    setNewCtn('');
    setNewNbs('');
    setNewCtnQuery('');
    setNewNbsQuery('');
    setShowAddForm(false);
  };

  return (
    <div className="group rounded-md border transition-colors border-border bg-background hover:border-primary/20">
      <div className="flex items-start gap-1.5 px-2 py-1.5">
        {/* Conteúdo CNAE + vínculos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground shrink-0">{ordem}.</span>
            <span className="font-mono text-xs font-semibold text-primary">{formatCNAECode(cnae.codigo)}</span>
            <span className="text-xs text-foreground/90 truncate">{cnae.cnaeDescricao.replace(/[.\s]+$/, '')}</span>
            {cnae.isManual && (
              <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded shrink-0">Manual</span>
            )}
          </div>
          {cnae.vinculos.length > 0 && (
            <div className="mt-1 pl-0">
              {cnae.vinculos.map((vinculo, idx) => (
                <div
                  key={vinculo.id}
                  className="flex items-start gap-2 py-0.5 text-xs text-foreground/80"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    {vinculo.ctn && (
                      <p className="leading-relaxed text-justify">
                        <span className="font-mono font-semibold text-primary whitespace-nowrap">|{vinculo.ctn}|</span>
                        {' '}{(vinculo.ctnDescricao || '').replace(/[.\s]+$/, '')}.
                      </p>
                    )}
                    {vinculo.nbs && (
                      <p className="leading-relaxed text-justify">
                        <span className="font-mono font-semibold text-primary whitespace-nowrap">|{vinculo.nbs}|</span>
                        {' '}{(vinculo.nbsDescricao || '').replace(/[.\s]+$/, '')}.
                      </p>
                    )}
                    {!vinculo.ctn && !vinculo.nbs && <span className="text-muted-foreground italic">Sem CTN/NBS</span>}
                  </div>
                  {cnae.vinculos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveVinculo(vinculo.id)}
                      title="Remover vínculo"
                      className="shrink-0 p-1 rounded text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Botões excluir e adicionar à direita, sempre visíveis */}
        <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
          <button
            type="button"
            onClick={onRemove}
            title="Remover CNAE"
            className="p-1 rounded-md text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm(v => !v)}
            title="Adicionar novo CTN/NBS"
            className="p-1 rounded-md text-primary/70 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Formulário inline para adicionar novo vínculo CTN/NBS */}
      {showAddForm && (
        <div className="border-t border-primary/20 bg-primary/5 p-2.5 space-y-2">
          <p className="text-[11px] font-semibold text-foreground/70">Novo vínculo CTN / NBS</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* CTN input */}
            <div ref={ctnFormRef} className="relative">
              <Input
                placeholder="Buscar CTN..."
                value={showNewCtnDropdown ? newCtnQuery : (newCtn ? formatCTNDisplay(newCtn) : '')}
                onChange={e => { setNewCtnQuery(e.target.value); setShowNewCtnDropdown(true); }}
                onFocus={() => { setNewCtnQuery(''); setShowNewCtnDropdown(true); }}
                className="h-7 text-xs"
              />
              {showNewCtnDropdown && newCtnResults.length > 0 && (
                <div className="absolute z-30 top-full mt-1 w-full max-h-36 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                  {newCtnResults.map(entry => (
                    <button
                      key={entry.codigo}
                      type="button"
                      onClick={() => {
                        setNewCtn(entry.codigo);
                        setNewCtnQuery('');
                        setShowNewCtnDropdown(false);
                        if (entry.nbs && !newNbs) setNewNbs(entry.nbs);
                      }}
                      className="w-full text-left px-2 py-1.5 border-b border-border/50 last:border-b-0 hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-mono text-[11px] font-semibold text-primary">{formatCTNDisplay(entry.codigo)}</span>
                      <span className="text-[11px] text-muted-foreground ml-1">({entry.itemFormatado})</span>
                      <p className="text-[11px] text-foreground/70 line-clamp-1">{entry.descricao}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* NBS input */}
            <div ref={nbsFormRef} className="relative">
              <Input
                placeholder="Buscar NBS..."
                value={showNewNbsDropdown ? newNbsQuery : newNbs}
                onChange={e => { setNewNbsQuery(e.target.value); setShowNewNbsDropdown(true); }}
                onFocus={() => { setNewNbsQuery(''); setShowNewNbsDropdown(true); }}
                className="h-7 text-xs"
              />
              {showNewNbsDropdown && newNbsResults.length > 0 && (
                <div className="absolute z-30 top-full mt-1 w-full max-h-36 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                  {newNbsResults.map(entry => (
                    <button
                      key={entry.codigo}
                      type="button"
                      onClick={() => {
                        setNewNbs(entry.codigo);
                        setNewNbsQuery('');
                        setShowNewNbsDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1.5 border-b border-border/50 last:border-b-0 hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-mono text-[11px] font-semibold text-primary">{entry.codigo}</span>
                      <p className="text-[11px] text-foreground/70 line-clamp-1">{entry.descricao}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)} className="text-[11px] h-7 px-2">
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={handleConfirmAdd} disabled={!newCtn && !newNbs} className="text-[11px] h-7 px-3 gap-1">
              <Plus className="w-3 h-3" />
              Adicionar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CTNSection;
