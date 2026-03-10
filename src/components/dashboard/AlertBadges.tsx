import React from 'react';
import { AlertTriangle, TrendingUp, Lightbulb, Clock } from 'lucide-react';

export interface AlertItem {
  tipo: 'warning' | 'danger' | 'info' | 'success';
  mensagem: string;
}

interface Props {
  alertas: AlertItem[];
}

const iconMap = {
  warning: <Clock className="w-3.5 h-3.5" />,
  danger: <AlertTriangle className="w-3.5 h-3.5" />,
  info: <Lightbulb className="w-3.5 h-3.5" />,
  success: <TrendingUp className="w-3.5 h-3.5" />,
};

const colorMap = {
  warning: 'bg-warning/10 text-warning border-warning/30',
  danger: 'bg-destructive/10 text-destructive border-destructive/30',
  info: 'bg-primary/10 text-primary border-primary/30',
  success: 'bg-accent/10 text-accent border-accent/30',
};

const AlertBadges: React.FC<Props> = ({ alertas }) => {
  if (alertas.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {alertas.map((a, i) => (
        <div
          key={i}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${colorMap[a.tipo]}`}
        >
          {iconMap[a.tipo]}
          {a.mensagem}
        </div>
      ))}
    </div>
  );
};

export default AlertBadges;
