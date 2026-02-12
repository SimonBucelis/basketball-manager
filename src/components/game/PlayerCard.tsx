import type { ReactNode } from 'react';
import type { PlayerData } from '@/lib/gameModels';
import { calculateWage } from '@/lib/gameModels';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const roleColor: Record<string, string> = {
  Defender: 'text-role-defender',
  Sharpshooter: 'text-role-sharpshooter',
  Playmaker: 'text-role-playmaker',
};

interface Props {
  player: PlayerData;
  teamPrestige: number;
  children?: ReactNode;
}

export default function PlayerCard({ player: p, teamPrestige, children }: Props) {
  const wage = p.wage || calculateWage(p, teamPrestige);
  const starColor = p.potentialStars >= 4 ? 'text-star-gold' : p.potentialStars >= 3 ? 'text-star-silver' : 'text-star-dim';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="rounded-xl border border-border bg-card p-4 hover:bg-accent/30 transition-colors">
          <h4 className="font-bold text-primary">{p.name}</h4>
          <p className={`text-xs font-medium mb-3 ${roleColor[p.role] || 'text-muted-foreground'}`}>{p.role}</p>

          <div className="flex justify-between mb-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Rating</p>
              <p className="text-xl font-bold text-success">{p.rating}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase">Age</p>
              <p className={`text-xl font-bold ${p.age < 24 ? 'text-success' : p.age > 30 ? 'text-warning' : ''}`}>{p.age}</p>
            </div>
          </div>

          <div className="text-center mb-3">
            <p className="text-[10px] text-muted-foreground uppercase">Potential</p>
            <p className={`text-lg ${starColor}`}>{'★'.repeat(p.potentialStars)}</p>
          </div>

          <div className="bg-muted rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Wage/year</p>
            <p className="text-base font-bold text-star-gold">${wage.toLocaleString()}</p>
          </div>

          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{p.name} • {p.role} • Age {p.age} • OVR {p.rating} • Potential {'★'.repeat(p.potentialStars)} • Wage ${wage.toLocaleString()}/yr</p>
      </TooltipContent>
    </Tooltip>
  );
}
