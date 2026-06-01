export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  // Le header et footer sont inclus directement dans la page d'accueil (premium custom).
  return <div className="flex min-h-screen flex-col">{children}</div>;
}
