// src/components/TestIntegration.tsx
import React, { useState } from 'react';
import api from '../services/api';

const TestIntegration: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const ejecutarProcesamiento = async () => {
    setLoading(true);
    try {
      // Simulamos llamada a endpoint de procesamiento automático
      // Este endpoint necesitaríamos crearlo en el backend
      const response = await api.post('/api/integracion/procesar-pendientes');
      setResultado(response.data);
    } catch (error: any) {
      setResultado({
        success: false,
        error: error.response?.data?.error || 'Error de conexión'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Prueba de Integración Automática
      </h3>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">¿Cómo funciona?</h4>
          <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
            <li>SIVEC consulta la base de datos externa (TestSIVEC)</li>
            <li>Busca facturas con estado 5 o 6 y piloto correcto</li>
            <li>Si encuentra una guía, crea automáticamente el viaje</li>
            <li>Actualiza el estado de la factura a "despachada"</li>
            <li>Registra todo en el log de detecciones</li>
          </ol>
        </div>

        <button
          onClick={ejecutarProcesamiento}
          disabled={loading}
          className={`w-full btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Procesando...
            </span>
          ) : (
            'Ejecutar Procesamiento Automático'
          )}
        </button>

        {resultado && (
          <div className={`rounded-lg p-4 ${
            resultado.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <h4 className={`font-medium mb-2 ${
              resultado.success ? 'text-green-900' : 'text-red-900'
            }`}>
              Resultado del Procesamiento
            </h4>
            
            <pre className={`text-sm ${
              resultado.success ? 'text-green-800' : 'text-red-800'
            } overflow-x-auto`}>
              {JSON.stringify(resultado, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestIntegration;