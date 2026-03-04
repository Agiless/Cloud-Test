"use client";

import { useState } from "react";
import LoginView from "@/components/LoginView";
import TestView from "@/components/TestView";

export default function Home() {
  const [user, setUser] = useState<{ name: string; batchNumber: string } | null>(null);

  if (!user) {
    return (
      <LoginView
        onLogin={(name, batchNumber) => setUser({ name, batchNumber })}
      />
    );
  }

  return (
    <TestView
      name={user.name}
      batchNumber={user.batchNumber}
      onLogout={() => setUser(null)}
    />
  );
}
