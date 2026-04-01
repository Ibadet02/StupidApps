import type { Metadata } from "next";
import ExcuseApp from "./ExcuseApp";

export const metadata: Metadata = {
  title: "Excuse Generator — StupidApps",
  description:
    "Generate hilariously absurd excuses for any situation. Boss, partner, teacher — we've got you covered.",
};

export default function ExcuseGeneratorPage() {
  return <ExcuseApp />;
}
