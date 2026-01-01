"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";

function AuthPage() {
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Handle authentication logic here
    router.push("/hotels");
  };
  return (
    <section className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome!</CardTitle>
          <CardDescription>
            Please sign in to continue to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Username"
                // value={username}
                // onChange={(e) => setUsername(e.target.value)}
                // disabled={isLoading}
                autoFocus
              />
              {/* {error && <p className="text-sm text-red-500">{error}</p>} */}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                // value={username}
                // onChange={(e) => setUsername(e.target.value)}
                // disabled={isLoading}
                autoFocus
              />
              {/* {error && <p className="text-sm text-red-500">{error}</p>} */}
            </div>
            <Button type="submit" className="w-full cursor-pointer">
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

export default AuthPage;
