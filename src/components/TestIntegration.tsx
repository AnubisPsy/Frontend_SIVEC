// src/components/TestIntegration.tsx
import React, { useState } from "react";
import api from "../services/api";
import { Icons } from "./icons/IconMap";

const TestIntegration: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const ejecutarProcesamiento = async () => {
    setLoading(true);
    try {
      // Simulamos llamada a endpoint de procesamiento automático
      // Este endpoint necesitaríamos crearlo en el backend
      const response = await api.post("/api/integracion/procesar-pendientes");
      setResultado(response.data);
    } catch (error: any) {
      setResultado({
        success: false,
        error: error.response?.data?.error || "Error de conexión",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
          <Icons.activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
          Prueba de Integración Automática
        </h3>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-3">
            <Icons.info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <h4 className="font-semibold text-blue-900 dark:text-blue-300">
              ¿Cómo funciona?
            </h4>
          </div>
          <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-2 ml-8">
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
                1.
              </span>
              <span>SIVEC consulta la base de datos externa (TestSIVEC)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
                2.
              </span>
              <span>Busca facturas con estado 5 o 6 y piloto correcto</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
                3.
              </span>
              <span>Si encuentra una guía, crea automáticamente el viaje</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
                4.
              </span>
              <span>Actualiza el estado de la factura a "despachada"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
                5.
              </span>
              <span>Registra todo en el log de detecciones</span>
            </li>
          </ol>
        </div>

        <button
          onClick={ejecutarProcesamiento}
          disabled={loading}
          className={`w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? (
            <>
              <Icons.refresh className="w-5 h-5 animate-spin" />
              <span>Procesando...</span>
            </>
          ) : (
            <>
              <Icons.send className="w-5 h-5" />
              <span>Ejecutar Procesamiento Automático</span>
            </>
          )}
        </button>

        {resultado && (
          <div
            className={`rounded-lg p-4 border-2 ${
              resultado.success
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              {resultado.success ? (
                <Icons.checkCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <Icons.xCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              <h4
                className={`font-semibold ${
                  resultado.success
                    ? "text-green-900 dark:text-green-300"
                    : "text-red-900 dark:text-red-300"
                }`}
              >
                Resultado del Procesamiento
              </h4>
            </div>

            <pre
              className={`text-sm ${
                resultado.success
                  ? "text-green-800 dark:text-green-300"
                  : "text-red-800 dark:text-red-300"
              } overflow-x-auto bg-white dark:bg-slate-700 p-3 rounded border ${
                resultado.success
                  ? "border-green-200 dark:border-green-800"
                  : "border-red-200 dark:border-red-800"
              }`}
            >
              {JSON.stringify(resultado, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestIntegration;
