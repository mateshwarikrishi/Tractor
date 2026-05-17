import { api, HydrateClient } from "@/trpc/server";
import { UserTable } from "./_components/user-table";
import { UserForm } from "./_components/user-form";

export default async function UsersPage() {
  void api.user.getAll.prefetch();

  return (
    <HydrateClient>
      <div className="p-4 md:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground text-sm">Manage application users</p>
          </div>
          <UserForm />
        </div>
        <UserTable />
      </div>
    </HydrateClient>
  );
}
