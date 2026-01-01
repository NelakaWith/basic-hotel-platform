"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "@/lib/auth-storage";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    if (auth?.user) {
      // Auto-forward authenticated visitors to the primary dashboard view.
      router.replace("/hotels");
    }
  }, [router]);

  return (
    <main>
      <div></div>
    </main>
  );
}
