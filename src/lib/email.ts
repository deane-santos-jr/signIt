import { Resend } from "resend";
import { env } from "./env";

function client(): Resend {
  return new Resend(env.resendApiKey());
}

export async function sendLoginLink(to: string, url: string): Promise<void> {
  const { error } = await client().emails.send({
    from: env.mailFrom(),
    to,
    subject: "Your signIt login link",
    text: `Open this link to log in to signIt. It works once and expires in 15 minutes.\n\n${url}`,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}

type SignedCopy = {
  to: string[];
  documentTitle: string;
  clientName: string;
  pdf: Uint8Array;
  fileName: string;
};

export async function sendSignedCopy(copy: SignedCopy): Promise<void> {
  const { error } = await client().emails.send({
    from: env.mailFrom(),
    to: copy.to,
    subject: `Signed: ${copy.documentTitle}`,
    text: `All parties have signed "${copy.documentTitle}" for ${copy.clientName}. The completed document is attached.`,
    attachments: [
      {
        filename: copy.fileName,
        content: Buffer.from(copy.pdf).toString("base64"),
      },
    ],
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}
