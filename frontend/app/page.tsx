"use client";

import { useState } from "react";

type Shipment = {
  tracking: string;
  sender: string;
  receiver: string;
  fromCity: string;
  toCity: string;
  weight: number;
  status: string;
  createdAt: string;
};

export default function Home() {
  const [form, setForm] = useState({
    sender: "",
    receiver: "",
    fromCity: "",
    toCity: "",
    weight: 1,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Shipment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "weight" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("http://localhost:3001/shipments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Error creando el envío");
      }

      const data = (await res.json()) as Shipment;
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Hubo un problema creando el envío");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Plataforma de envíos – Crear envío
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Remitente
            </label>
            <input
              name="sender"
              value={form.sender}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              placeholder="Nombre del remitente"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Destinatario
            </label>
            <input
              name="receiver"
              value={form.receiver}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              placeholder="Nombre del destinatario"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Ciudad origen
              </label>
              <input
                name="fromCity"
                value={form.fromCity}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
                placeholder="Ej. CDMX"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Ciudad destino
              </label>
              <input
                name="toCity"
                value={form.toCity}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
                placeholder="Ej. Guadalajara"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Peso (kg)
            </label>
            <input
              type="number"
              min={0.1}
              step={0.1}
              name="weight"
              value={form.weight}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-md font-semibold hover:bg-gray-800 transition"
          >
            {loading ? "Creando envío..." : "Crear envío"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-red-600 text-sm text-center">{error}</p>
        )}

        {result && (
          <div className="mt-6 border rounded-md p-4 bg-gray-50">
            <h2 className="font-semibold mb-2">Envío creado correctamente 🎉</h2>
            <p>
              <span className="font-medium">Tracking:</span>{" "}
              <span className="font-mono">{result.tracking}</span>
            </p>
            <p>
              <span className="font-medium">Estado:</span> {result.status}
            </p>
            <p>
              <span className="font-medium">De:</span> {result.fromCity} →{" "}
              <span className="font-medium">A:</span> {result.toCity}
            </p>
            <p>
              <span className="font-medium">Peso:</span> {result.weight} kg
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
