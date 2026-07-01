import AdminHeader from "@/components/AdminHeader";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";

type MicroCMSAdminPageProps = {
  eyebrow: string;
  title: string;
  lead: string;
  endpointEnvValue: string | undefined;
  defaultEndpoint: string;
};

function getMicroCMSApiUrl(endpointEnvValue: string | undefined, defaultEndpoint: string) {
  const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN?.trim();
  const endpoint = endpointEnvValue?.trim() || defaultEndpoint;
  if (!serviceDomain) {
    return null;
  }

  return `https://${serviceDomain}.microcms.io/apis/${endpoint}`;
}

export default function MicroCMSAdminPage({
  eyebrow,
  title,
  lead,
  endpointEnvValue,
  defaultEndpoint,
}: MicroCMSAdminPageProps) {
  const cmsUrl = getMicroCMSApiUrl(endpointEnvValue, defaultEndpoint);

  return (
    <div className="site-shell">
      <AdminHeader />
      <main>
        <section className="section">
          <div className="section__head">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="section__title">{title}</h1>
            <p className="section__lead">{lead}</p>
          </div>
          <div className="card card__body">
            {cmsUrl ? (
              <Link href={cmsUrl} className="button-link button-link--primary" target="_blank" rel="noreferrer">
                microCMS を開く
              </Link>
            ) : (
              <p className="m-0">MICROCMS_SERVICE_DOMAIN が設定されていないため、microCMS へのリンクを生成できません。</p>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
