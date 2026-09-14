import { NewDocumentForm } from "./NewDocumentForm";

export default function NewDocumentPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold tracking-tight">New document</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Upload the PDF and list who signs. You place the signature boxes on the next screen.
      </p>
      <NewDocumentForm />
    </div>
  );
}
