import { JarItem } from "@/types/gift";

// Kept apart from iqooModels so importing the list doesn't pull three.js into the first page bundle.
export const ITEMS: JarItem[] = [
  { id: "cashew", name: "Roasted Cashews", color: 0xe3c288 },
  { id: "kaju", name: "Kaju Katli", color: 0xefe6cf },
  { id: "ladoo", name: "Motichoor Ladoo", color: 0xf0a22e },
  { id: "cran", name: "Masala Cranberry", color: 0xa3162b },
  { id: "kiwi", name: "Dried Kiwi", color: 0x6f9a2a },
  { id: "mocha", name: "Mocha Cashews", color: 0x6b4129 },
  { id: "chikki", name: "Almond Chikki", color: 0xc98a3c },
  { id: "soan", name: "Soan Papdi", color: 0xf3d27a },
  { id: "pan", name: "Pan Shot", color: 0x2f6b3a },
  { id: "mix", name: "Dry Fruit Mix", color: 0xb98a5a },
];
