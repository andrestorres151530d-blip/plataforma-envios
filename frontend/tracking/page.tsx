"use client";

import { useState, FormEvent } from "react";

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

export default function TrackingPage() {
  const [tracking, setTracking] = useState("");
  const [result, setResult] = useState<Shipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `http://localhost:3001/shipments/${tracking.trim()}`
      );
      const data = await res.json();

      if (data.error) {
        setError("No se encontró un envío con ese tracking");
      } else {
        setResult(data);
      }
    } catch (err) {
      console.error(err);
      setError("Error consultando el envío");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Buscar Envío por Tracking
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Ej. MXABC123"
            className="w-full border px-3 py-2 rounded"
            required
          />

          <button
            className="w-full bg-black text-white py-2 rounded font-semibold"
            disabled={loading}
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-red-600 text-center">{error}</p>
        )}

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded border">
            <h2 className="font-semibold text-lg mb-2">
              Resultados del envío
            </h2>
            <p>
              <b>Tracking:</b> {result.tracking}
            </p>
            <p>
              <b>Estado:</b> {result.status}
            </p>
            <p>
              <b>Origen:</b> {result.fromCity}
            </p>
            <p>
              <b>Destino:</b> {result.toCity}
            </p>
            <p>
              <b>Peso:</b> {result.weight} kg
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
