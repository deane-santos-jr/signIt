import { NewDocumentForm } from "./NewDocumentForm";

export default function NewDocumentPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-4xl">New document</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Upload the PDF and list who signs. Signature boxes come next.
      </p>
      <NewDocumentForm />
    </div>
  );
}
