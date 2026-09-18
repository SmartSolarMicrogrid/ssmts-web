import type { ReservationType } from '../../types';
interface TypePillProps { type: ReservationType; }
export default function TypePill({ type }: TypePillProps) {
  return <span className={`type-pill type-${type.toLowerCase()}`}>{type}</span>;
}
