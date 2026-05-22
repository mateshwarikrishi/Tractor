import { api, HydrateClient } from "@/trpc/server";
import { OrderDetail } from "./_components/order-detail";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  void api.order.getById.prefetch({ id });

  return (
    <HydrateClient>
      <OrderDetail orderId={id} />
    </HydrateClient>
  );
}
