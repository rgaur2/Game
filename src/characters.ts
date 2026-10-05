export type CharacterId = "moss" | "ember" | "tide";

export type CharacterLook = {
  id: CharacterId;
  name: string;
  blurb: string;
  aura: string;
  body: string;
  belly: string;
  leaf: string;
  crown: string;
  wing: string;
};

export const CHARACTERS: CharacterLook[] = [
  {
    id: "moss",
    name: "Moss",
    blurb: "Soft and steady",
    aura: "rgba(140, 255, 190, 0.28)",
    body: "#d8ffe8",
    belly: "#9dffd0",
    leaf: "#6fd36a",
    crown: "#c6e85a",
    wing: "rgba(160, 220, 90, 0.55)",
  },
  {
    id: "ember",
    name: "Ember",
    blurb: "Warm and quick",
    aura: "rgba(255, 160, 70, 0.32)",
    body: "#ffe4c4",
    belly: "#ffb06a",
    leaf: "#e25822",
    crown: "#ffd15a",
    wing: "rgba(255, 140, 60, 0.55)",
  },
  {
    id: "tide",
    name: "Tide",
    blurb: "Cool and light",
    aura: "rgba(120, 200, 255, 0.32)",
    body: "#e7f6ff",
    belly: "#8fd4ff",
    leaf: "#3a8fd4",
    crown: "#c9f4ff",
    wing: "rgba(130, 196, 255, 0.55)",
  },
];
