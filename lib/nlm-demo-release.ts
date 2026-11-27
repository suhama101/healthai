import release from "@/research/nlm-fixed-sample-release.json";
import { malariaDescriptionBank } from "@/lib/local-malaria-descriptions";

export function nlmSiteDemoEnabled() {
  return process.env.NLM_BROWSER_DEMO_ENABLED === "1"
    && release.descriptionBank === malariaDescriptionBank.version;
}
