import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { AccountPanel } from "@/pages/account/account-panel";

const accountSearchSchema = z.object({
  addinOnly: z.boolean().optional(),
});

export const Route = createFileRoute("/_protected/solo/account")({
  validateSearch: accountSearchSchema,
  component: AccountPanel,
});
