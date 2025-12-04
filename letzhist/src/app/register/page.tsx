"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("Account created! You can now log in.");
    } else {
      setMessage(data.error || "An error occurred.");
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <h1 className="text-xl font-semibold mb-4">Register</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Username"
          className="border rounded px-3 py-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          className="border rounded px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="border rounded px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="bg-blue-600 text-white rounded px-3 py-2">
          Create account
        </button>

        {message && (
          <p className="text-sm text-center text-slate-700 mt-2">{message}</p>
        )}

        <p className="text-sm text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
