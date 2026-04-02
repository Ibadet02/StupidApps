import type { Metadata } from "next";
import TypingSoundsApp from "./TypingSoundsApp";

export const metadata: Metadata = {
  title: "Typing Sound Customizer — StupidApps",
  description:
    "Every key you type makes a different sound — farts, cat meows, gun shots, or moaning. Pick a sound pack and type away.",
};

export default function TypingSoundsPage() {
  return <TypingSoundsApp />;
}
