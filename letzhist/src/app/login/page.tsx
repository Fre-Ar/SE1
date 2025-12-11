"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage]   = useState("");

  const { refreshUser } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      redirect: 'manual',
    });

    if (res.status === 302|| res.status === 0) {
        // Successful login! The server sent a redirect response.
        // We must now manually tell the client to navigate.
        await refreshUser();
        
        router.refresh();
        router.push('/');
        return;
    }
    if (res.status === 401) {
      setMessage("Invalid credentials.");
    }else {
      // Handles 400 (Bad Request), 500 (Server Error), etc.
      setMessage("Login failed due to a server error. Status: " + res.status);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-md">
      <h1 className="text-xl font-semibold mb-4">Log in</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          className="border rounded px-3 py-2"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="border rounded px-3 py-2"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button className="bg-uni-blue text-white rounded px-3 py-2">
          Log in
        </button>

        {message && (
          <p className="text-md text-center text-red-600 mt-2 bg-red-100 rounded py-2">{message}</p>
        )}
      </form>
    </div>
  );
}
