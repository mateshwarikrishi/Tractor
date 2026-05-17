import { api, HydrateClient } from "@/trpc/server";
import { CreateOrderForm } from "./_components/create-order-form";

export default async function NewOrderPage() {
  void api.customer.getAll.prefetch();

  return (
    <HydrateClient>
      <CreateOrderForm />
    </HydrateClient>
  );
}
