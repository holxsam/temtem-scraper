export type TemType =
  | "neutral"
  | "wind"
  | "earth"
  | "water"
  | "fire"
  | "nature"
  | "electric"
  | "mental"
  | "digital"
  | "melee"
  | "crystal"
  | "toxic";

export type TypeEffectiveness = Record<TemType, number>;
export type MatchUps = Record<TemType, string>;

export type Trait = {
  name: string;
  description: string;
  modifier: TypeEffectiveness;
};

export type SpecieData = {
  name: string;
  // matchups: TraitMatchUp[];
};

export type TraitMatchUp = {
  trait: string;
  matchupMap: MatchUps;
};

export type TraitMatchUpMap = Record<TraitMatchUp["trait"], TraitMatchUp>;
