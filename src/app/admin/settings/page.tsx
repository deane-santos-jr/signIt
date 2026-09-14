import { loadAdminSignature } from "@/lib/adminSignature";
import { AdminSignatureForm } from "./AdminSignatureForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const saved = await loadAdminSignature();

  return (
    <div className="max-w-xl">
      <h1 className="text-4xl">Your signature</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Stored once and applied when you countersign. Redraw anytime.
      </p>
      {saved?.signaturePng && (
        <div className="card reveal mt-8 p-6">
          <p className="label">Current</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={saved.signaturePng} alt="Saved signature" className="mt-3 h-20" />
          <p className="mt-1 text-sm text-ink-muted">{saved.signatureName}</p>
        </div>
      )}
      <AdminSignatureForm initialName={saved?.signatureName ?? ""} />
    </div>
  );
}
