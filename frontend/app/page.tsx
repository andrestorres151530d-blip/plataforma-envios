"use client";

import { useEffect, useMemo, useState } from "react";

type ShipmentStatus =
  | "CREADO"
  | "EN_RECOLECCION"
  | "EN_RUTA"
  | "EN_ADUANA"
  | "ENTREGADO"
  | "INCIDENCIA";

type ShipmentHistoryEntry = {
  status: ShipmentStatus;
  note: string;
  at: string;
};

type Shipment = {
  tracking: string;
  sender: string;
  receiver: string;
  fromCity: string;
  toCity: string;
  weight: number;
  serviceLevel: "Express" | "Estandar";
  status: ShipmentStatus;
  price: number;
  createdAt: string;
  estimatedDelivery: string;
  history: ShipmentHistoryEntry[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const statusCopy: Record<ShipmentStatus, string> = {
  CREADO: "Creado",
  EN_RECOLECCION: "En recolección",
  EN_RUTA: "En ruta",
  EN_ADUANA: "Aduana",
  ENTREGADO: "Entregado",
  INCIDENCIA: "Incidencia",
};

const badgeStyles: Record<ShipmentStatus, string> = {
  CREADO: "bg-blue-50 text-blue-700 border border-blue-200",
  EN_RECOLECCION: "bg-amber-50 text-amber-700 border border-amber-200",
  EN_RUTA: "bg-purple-50 text-purple-700 border border-purple-200",
  EN_ADUANA: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  ENTREGADO: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  INCIDENCIA: "bg-red-50 text-red-700 border border-red-200",
};

export default function Home() {
  const [form, setForm] = useState({
    sender: "",
    receiver: "",
    fromCity: "",
    toCity: "",
    weight: 1,
    serviceLevel: "Express" as "Express" | "Estandar",
  });

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingQuery, setTrackingQuery] = useState("");
  const [trackingResult, setTrackingResult] = useState<Shipment | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const fetchShipments = async () => {
    const res = await fetch(`${API_BASE}/shipments`);
    if (!res.ok) return;
    const data = (await res.json()) as Shipment[];
    setShipments(data);
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "weight" ? Number(value) : value,
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTrackingResult(null);

    try {
      const res = await fetch(`${API_BASE}/shipments`, {
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
      setTrackingResult(data);
      setShipments((prev) => [data, ...prev]);
      setForm({
        sender: "",
        receiver: "",
        fromCity: "",
        toCity: "",
        weight: 1,
        serviceLevel: "Express",
      });
    } catch (err) {
      console.error(err);
      setError("Hubo un problema creando el envío");
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async () => {
    if (!trackingQuery) return;
    setTrackingError(null);
    setTrackingResult(null);
    try {
      const res = await fetch(`${API_BASE}/shipments/${trackingQuery}`);
      if (!res.ok) throw new Error("No encontrado");
      const data = (await res.json()) as Shipment;
      setTrackingResult(data);
    } catch (err) {
      console.error(err);
      setTrackingError("No encontramos ese tracking. Verifica e intenta de nuevo.");
    }
  };

  const stats = useMemo(() => {
    const delivered = shipments.filter((s) => s.status === "ENTREGADO");
    const inTransit = shipments.filter((s) =>
      ["EN_RUTA", "EN_RECOLECCION", "EN_ADUANA"].includes(s.status),
    );
    const revenue = shipments.reduce((acc, s) => acc + (s.price || 0), 0);

    return {
      total: shipments.length,
      delivered: delivered.length,
      inTransit: inTransit.length,
      revenue,
    };
  }, [shipments]);

  const formatDate = (value: string) =>
    new Date(value).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
                Plataforma premium
              </p>
              <h1 className="mt-2 text-3xl font-semibold">
                Orquestador de envíos optimizado
              </h1>
              <p className="mt-2 text-slate-300">
                Crea, monitorea y acelera tus entregas con visibilidad total.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
                SLA 99.9%
              </span>
              <span className="rounded-full bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
                Tracking en vivo
              </span>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard title="Órdenes activas" value={stats.total} badge="live" />
          <StatCard
            title="Entregados"
            value={stats.delivered}
            badge="success"
          />
          <StatCard
            title="En tránsito"
            value={stats.inTransit}
            badge="focus"
          />
          <StatCard
            title="Ingresos estimados"
            value={`$${stats.revenue.toLocaleString("es-MX")}`}
            badge="currency"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-300">Nuevo envío</p>
                  <h2 className="text-xl font-semibold">
                    Configura y cotiza en segundos
                  </h2>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                  Optimización dinámica de ruta
                </div>
              </div>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <TextField
                  label="Remitente"
                  name="sender"
                  value={form.sender}
                  onChange={handleChange}
                  placeholder="Ej. ElectroNova"
                />
                <TextField
                  label="Destinatario"
                  name="receiver"
                  value={form.receiver}
                  onChange={handleChange}
                  placeholder="Ej. Hotel Turquesa"
                />
                <TextField
                  label="Ciudad origen"
                  name="fromCity"
                  value={form.fromCity}
                  onChange={handleChange}
                  placeholder="Guadalajara"
                />
                <TextField
                  label="Ciudad destino"
                  name="toCity"
                  value={form.toCity}
                  onChange={handleChange}
                  placeholder="Cancún"
                />
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    name="weight"
                    value={form.weight}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Nivel de servicio
                  </label>
                  <select
                    name="serviceLevel"
                    value={form.serviceLevel}
                    onChange={handleSelectChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
                  >
                    <option value="Express">Express (prioritario)</option>
                    <option value="Estandar">Estandar</option>
                  </select>
                </div>

                <div className="col-span-2 flex items-center justify-between rounded-xl border border-blue-300/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
                  <span>
                    Tarifas calculadas en tiempo real según peso y SLA
                  </span>
                  <span className="font-mono text-blue-200">24/7</span>
                </div>

                <div className="col-span-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-2 font-semibold text-slate-900 shadow-lg shadow-blue-500/20 transition hover:shadow-blue-500/30 disabled:opacity-60"
                  >
                    {loading ? "Optimizando..." : "Crear envío"}
                  </button>
                  {error && <span className="text-red-300 text-sm">{error}</span>}
                </div>
              </form>

              {trackingResult && (
                <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-100">Nuevo envío</p>
                      <h3 className="text-lg font-semibold text-emerald-50">
                        Tracking {trackingResult.tracking}
                      </h3>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyles[trackingResult.status]}`}
                    >
                      {statusCopy[trackingResult.status]}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-3 text-sm text-emerald-50/90">
                    <p>
                      {trackingResult.fromCity} → {trackingResult.toCity}
                    </p>
                    <p>Servicio: {trackingResult.serviceLevel}</p>
                    <p>Peso: {trackingResult.weight} kg</p>
                    <p>Tarifa: ${trackingResult.price}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Tracking avanzado</p>
                  <h2 className="text-xl font-semibold">Visibilidad total</h2>
                </div>
                <button
                  onClick={fetchShipments}
                  className="text-xs text-blue-200 underline"
                >
                  Refrescar
                </button>
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  value={trackingQuery}
                  onChange={(e) => setTrackingQuery(e.target.value)}
                  placeholder="Ej. MXABCD123"
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
                />
                <button
                  onClick={handleTrack}
                  className="rounded-lg bg-blue-500 px-4 py-2 font-semibold text-slate-900 shadow-lg shadow-blue-500/20"
                >
                  Buscar
                </button>
              </div>
              {trackingError && (
                <p className="mt-2 text-sm text-red-200">{trackingError}</p>
              )}

              {trackingResult && (
                <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-300">Tracking</p>
                      <h3 className="font-semibold">{trackingResult.tracking}</h3>
                      <p className="text-xs text-slate-400">
                        ETA {formatDate(trackingResult.estimatedDelivery)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyles[trackingResult.status]}`}
                    >
                      {statusCopy[trackingResult.status]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
                    <p>
                      {trackingResult.fromCity} → {trackingResult.toCity}
                    </p>
                    <p>Servicio {trackingResult.serviceLevel}</p>
                    <p>Peso {trackingResult.weight} kg</p>
                    <p>Tarifa ${trackingResult.price}</p>
                  </div>

                  <div className="mt-3 rounded-lg border border-white/5 bg-black/20 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Eventos
                    </p>
                    <div className="mt-2 space-y-2">
                      {trackingResult.history.map((event, idx) => (
                        <div
                          key={`${event.at}-${idx}`}
                          className="flex items-start gap-3 rounded-lg bg-white/5 p-2"
                        >
                          <div className="mt-1 h-2 w-2 rounded-full bg-blue-300" />
                          <div>
                            <p className="text-sm font-semibold">
                              {statusCopy[event.status]}
                            </p>
                            <p className="text-xs text-slate-400">
                              {formatDate(event.at)}
                            </p>
                            <p className="text-sm text-slate-200">{event.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm text-emerald-50 shadow-lg">
              <p className="font-semibold">Nuevas rutas inteligentes</p>
              <p className="text-emerald-100">
                Asignación automática al mejor carrier según ciudad destino,
                SLA y congestión real-time.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300">Operaciones en vivo</p>
              <h2 className="text-xl font-semibold">Panel de entregas</h2>
            </div>
            <div className="flex gap-2 text-xs text-slate-300">
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200">
                Última actualización en tiempo real
              </span>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm text-slate-100">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-2 py-2">Tracking</th>
                  <th className="px-2 py-2">Ruta</th>
                  <th className="px-2 py-2">Servicio</th>
                  <th className="px-2 py-2">Peso</th>
                  <th className="px-2 py-2">Tarifa</th>
                  <th className="px-2 py-2">Estado</th>
                  <th className="px-2 py-2">ETA</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((shipment) => (
                  <tr
                    key={shipment.tracking}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="px-2 py-3 font-mono text-xs">
                      {shipment.tracking}
                    </td>
                    <td className="px-2 py-3 text-sm">
                      {shipment.fromCity} → {shipment.toCity}
                      <p className="text-xs text-slate-400">
                        {shipment.sender} → {shipment.receiver}
                      </p>
                    </td>
                    <td className="px-2 py-3 text-xs text-slate-300">
                      {shipment.serviceLevel}
                    </td>
                    <td className="px-2 py-3 text-xs">{shipment.weight} kg</td>
                    <td className="px-2 py-3 text-xs">${shipment.price}</td>
                    <td className="px-2 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyles[shipment.status]}`}
                      >
                        {statusCopy[shipment.status]}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-xs text-slate-300">
                      {formatDate(shipment.estimatedDelivery)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

type StatBadge = "live" | "success" | "focus" | "currency";

function StatCard({
  title,
  value,
  badge,
}: {
  title: string;
  value: string | number;
  badge: StatBadge;
}) {
  const badgeText: Record<StatBadge, string> = {
    live: "Live",
    success: "SLA",
    focus: "Tracking",
    currency: "MXN",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span>{badgeText[badge]}</span>
        <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-slate-200">
          {title}
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold">{value}</p>
      <p className="text-xs text-slate-400">Optimizado por telemetría</p>
    </div>
  );
}

function TextField({
  label,
  name,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-300">{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
      />
    </div>
  );
}
