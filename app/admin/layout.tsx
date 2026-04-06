export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="nk-dashboard nk-fade-in">
      <div className="nk-dashboard-row">{children}</div>
    </div>
  );
}
