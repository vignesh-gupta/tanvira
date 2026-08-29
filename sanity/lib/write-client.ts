import { createClient } from "next-sanity"

import { apiVersion, dataset, projectId } from "../env"

// Write access — used only by sanity/seed.ts. Never import this into
// anything that ships to the browser; SANITY_API_TOKEN must stay server-only.
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})
