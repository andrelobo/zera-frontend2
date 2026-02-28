import React, { useState } from 'react';
import { Settings, Plus, Pencil, Trash2, Check, X } from 'lucide-react';

interface ConfigItem {
  id: string;
  natureza: string;
  descricao: string;
}

interface Props {
  items: ConfigItem[];
  onChange: (items: ConfigItem[]) => void;
}

const ConfigOperacionaisSection: React.FC<Props> = ({ items, onChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ natureza: '', descricao: '' });
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ natureza: '', descricao: '' });

  const startEdit = (item: ConfigItem) => {
    setEditingId(item.id);
    setDraft({ natureza: item.natureza, descricao: item.descricao });
  };

  const saveEdit = () => {
    if (!editingId) return;
    onChange(items.map(i => i.id === editingId ? { ...i, ...draft } : i));
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const deleteItem = (id: string) => {
    onChange(items.filter(i => i.id !== id));
  };

  const addItem = () => {
    if (!newItem.natureza.trim() && !newItem.descricao.trim()) return;
    onChange([...items, { id: crypto.randomUUID(), ...newItem }]);
    setNewItem({ natureza: '', descricao: '' });
    setAdding(false);
  };

  return (
    <div className="section-card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title mb-0">
          <Settings className="w-5 h-5 text-primary" />
          Lista Serviço
        </h2>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar
        </button>
      </div>

      {/* Table header */}
      {(items.length > 0 || adding) && (
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground mb-1 px-1">
          <span>Natureza</span>
          <span>Descrição</span>
          <span className="w-16 text-center">Ações</span>
        </div>
      )}

      {/* Items list */}
      <div className="space-y-1">
        {items.map(item => (
          <div key={item.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center px-1 py-1.5 rounded-md hover:bg-muted/50 transition-colors">
            {editingId === item.id ? (
              <>
                <input
                  className="field-input text-xs py-1"
                  value={draft.natureza}
                  onChange={e => setDraft(d => ({ ...d, natureza: e.target.value }))}
                  autoFocus
                />
                <input
                  className="field-input text-xs py-1"
                  value={draft.descricao}
                  onChange={e => setDraft(d => ({ ...d, descricao: e.target.value }))}
                />
                <div className="flex gap-1 w-16 justify-center">
                  <button type="button" onClick={saveEdit} className="p-1 rounded hover:bg-accent text-green-600"><Check className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={cancelEdit} className="p-1 rounded hover:bg-accent text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                </div>
              </>
            ) : (
              <>
                <span className="text-sm truncate">{item.natureza}</span>
                <span className="text-sm truncate text-muted-foreground">{item.descricao}</span>
                <div className="flex gap-1 w-16 justify-center">
                  <button type="button" onClick={() => startEdit(item)} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => deleteItem(item.id)} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Add row */}
        {adding && (
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center px-1 py-1.5 bg-muted/30 rounded-md">
            <input
              className="field-input text-xs py-1"
              placeholder="Natureza"
              value={newItem.natureza}
              onChange={e => setNewItem(n => ({ ...n, natureza: e.target.value }))}
              autoFocus
            />
            <input
              className="field-input text-xs py-1"
              placeholder="Descrição"
              value={newItem.descricao}
              onChange={e => setNewItem(n => ({ ...n, descricao: e.target.value }))}
            />
            <div className="flex gap-1 w-16 justify-center">
              <button type="button" onClick={addItem} className="p-1 rounded hover:bg-accent text-green-600"><Check className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => { setAdding(false); setNewItem({ natureza: '', descricao: '' }); }} className="p-1 rounded hover:bg-accent text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )}
      </div>

      {items.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground py-3 text-center">
          Nenhuma configuração adicionada. Clique em "Adicionar" para começar.
        </p>
      )}
    </div>
  );
};

export default ConfigOperacionaisSection;
