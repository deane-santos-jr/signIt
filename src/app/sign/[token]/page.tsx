import { loadSignerByToken } from "@/lib/documents";
import { Wordmark } from "@/components/Wordmark";
import { SignerView } from "./SignerView";

export const dynamic = "force-dynamic";

export default async function SignPage({ params }: PageProps<"/sign/[token]">) {
  const { token } = await params;
  const found = await loadSignerByToken(token);

  if (!found || found.bundle.document.status === "draft") {
    return (
      <main className="mx-auto max-w-md px-6 py-28 text-center">
        <Wordmark className="text-ink-muted" />
        <h1 className="mt-6 text-3xl">This link is not valid</h1>
        <p className="mt-3 text-sm text-ink-muted">
          It may have been replaced. Ask the person who sent it for a new one.
        </p>
      </main>
    );
  }

  const { signer, bundle } = found;
  const myFields = bundle.fields
    .filter((f) => f.signerId === signer.id)
    .map((f) => ({ pageIndex: f.pageIndex, x: f.x, y: f.y, width: f.width, height: f.height }));

  return (
    <SignerView
      token={token}
      signerName={signer.name}
      documentTitle={bundle.document.title}
      clientName={bundle.document.clientName}
      alreadySigned={signer.signedAt !== null}
      completed={bundle.document.status === "completed"}
      fields={myFields}
    />
  );
}
