import type { ReactNode } from "react";

type AdminPageShellProps = {
  title: string;
  lead?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  variant?: "wide" | "narrow";
};

export default function AdminPageShell({
  title,
  lead,
  actions,
  children,
  variant = "wide",
}: AdminPageShellProps) {
  return (
    <section className="section admin-page">
      <div className={`admin-shell admin-shell--${variant}`}>
        <div className="admin-shell__head">
          <div className="grid gap-1">
            <h1 className="section__title">{title}</h1>
            {lead ? <p className="section__lead">{lead}</p> : null}
          </div>
          {actions ? <div className="admin-shell__actions">{actions}</div> : null}
        </div>
        <div className="admin-shell__body">{children}</div>
      </div>
    </section>
  );
}
