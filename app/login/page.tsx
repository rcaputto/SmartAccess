"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    // fake delay
    await new Promise((r) => setTimeout(r, 800));

    // fake auth
    localStorage.setItem("auth", "true");

    router.push("/bookings");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center">
      {/* BACKGROUND */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('../login-bg.jpg')" }}
      />

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* CARD */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white/90 p-8 shadow-xl backdrop-blur">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">SmartAccess</h1>
          <p className="text-sm text-gray-600">
            Accede a tu panel de gestión
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}