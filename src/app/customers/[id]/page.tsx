import { api, HydrateClient } from "@/trpc/server";
import { CustomerDetail } from "./_components/customer-detail";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  void api.customer.getActivity.prefetch({ id });

  return (
    <HydrateClient>
      <CustomerDetail customerId={id} />
    </HydrateClient>
  );
}
