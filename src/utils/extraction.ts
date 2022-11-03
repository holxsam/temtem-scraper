import data from "../output/type-matchups.json";

export const extractPossibleMatchUpAlteringTraits = () => {
  const traits = data.map((matchup) => matchup.trait).filter((v) => v !== "");

  const d = new Set(traits);

  console.log(d);
};

extractPossibleMatchUpAlteringTraits();
