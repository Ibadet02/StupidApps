import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Play — StupidApps",
};

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-80px)]">
      {children}
    </div>
  );
}
