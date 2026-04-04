import { serverFetchJson } from "@/lib/server/server-fetch";
import FinancePropertyPage, {
  type FinanceSummary,
} from "@/app/components/finance/finance-property-page";

export default async function FinancePropertyPageRoute({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;

  const summary = await serverFetchJson<FinanceSummary>(
    `/api/finance/properties/${propertyId}`
  );

  return (
    <FinancePropertyPage propertyId={propertyId} summary={summary} />
  );
}

