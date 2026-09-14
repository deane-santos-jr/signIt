import { loadAdminSignature } from "@/lib/adminSignature";
import { AdminSignatureForm } from "./AdminSignatureForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const saved = await loadAdminSignature();

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold tracking-tight">Your signature</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Stored once and applied when you countersign. Redraw anytime.
      </p>
      {saved?.signaturePng && (
        <div className="mt-6 rounded-md border border-neutral-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Current</p>
          <img src={saved.signaturePng} alt="Saved signature" className="mt-2 h-20" />
          <p className="mt-1 text-sm">{saved.signatureName}</p>
        </div>
      )}
      <AdminSignatureForm initialName={saved?.signatureName ?? ""} />
    </div>
  );
}
