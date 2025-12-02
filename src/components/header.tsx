import { UserWallet } from "./user-wallet";
import { Sheet, Waypoints } from "lucide-react";

export function Header() {
  return (
    <header className="p-4 border-b">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Waypoints className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text">
            LiquiSwap
          </h1>
        </div>
        <UserWallet />
      </div>
    </header>
  );
}
