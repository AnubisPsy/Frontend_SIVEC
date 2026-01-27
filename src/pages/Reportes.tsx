// src/pages/Reportes.tsx - CON FILTROS SEGÚN ROL Y DATALISTS
import React, { useState, useEffect, useMemo } from "react";
import { viajesApi } from "../services/api";
import { Icons } from "../components/icons/IconMap";
import { useNotification } from "../hooks/useNotification";
import * as XLSX from "xlsx";
import { useAuth } from "../contexts/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import MadeysoLogo from "../assets/logos/madeyso_logo.png";
import ExcelJS from "exceljs";
import { AlignCenter } from "lucide-react";

interface FiltrosReporte {
  fecha_desde?: string;
  fecha_hasta?: string;
  piloto?: string;
  numero_vehiculo?: string;
  sucursal_id?: number;
}

type ModoReporte = "agregado" | "especificar";
type TipoAgrupacion = "piloto" | "vehiculo" | "sucursal" | "ninguno";

const Reportes = () => {
  const noti = useNotification();
  const { user } = useAuth();

  // Estados principales
  const [modo, setModo] = useState<ModoReporte>("agregado");
  const [agrupacion, setAgrupacion] = useState<TipoAgrupacion>("piloto");
  const [datos, setDatos] = useState<any[]>([]);
  const [columnas, setColumnas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados para listas de opciones
  const [sucursales, setSucursales] = useState<
    Array<{ sucursal_id: number; nombre_sucursal: string }>
  >([]);
  const [pilotos, setPilotos] = useState<string[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);

  // Filtros
  const [filtros, setFiltros] = useState<FiltrosReporte>({
    fecha_desde: new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0],
    fecha_hasta: new Date().toISOString().split("T")[0],
    // Jefe de yarda (rol_id = 2): filtro bloqueado en su sucursal
    // Admin (rol_id = 3): sin filtro (ve todas)
    sucursal_id: user?.rol_id === 2 ? user?.sucursal_id : undefined,
  });

  // Estados UI
  const [gruposExpandidos, setGruposExpandidos] = useState<Set<string>>(
    new Set(),
  );

  // Función para generar encabezado común
  const generarEncabezado = () => {
    const empresa = "MADERAS Y SUMINISTROS Oseguera S.A (MADEYSO)";
    const titulo = `Reporte ${modo === "agregado" ? "Agregado" : "Detallado"} - Agrupado por ${
      agrupacion === "piloto"
        ? "Piloto"
        : agrupacion === "vehiculo"
          ? "Vehículo"
          : agrupacion === "sucursal"
            ? "Sucursal"
            : "Sin Agrupar"
    }`;
    const periodo = `Periodo: ${new Date(filtros.fecha_desde || "").toLocaleDateString("es-HN")} - ${new Date(filtros.fecha_hasta || "").toLocaleDateString("es-HN")}`;
    const fechaGeneracion = `Generado: ${new Date().toLocaleDateString("es-HN")} ${new Date().toLocaleTimeString("es-HN")}`;
    const usuario = `Usuario: ${user?.nombre_usuario || "Sistema"}`;

    return { empresa, titulo, periodo, fechaGeneracion, usuario };
  };

  // Cargar listas de opciones al montar
  useEffect(() => {
    cargarSucursales();
    cargarPilotos();
    cargarVehiculos();
  }, []);

  // Recargar vehículos cuando cambia la sucursal (para jefes de yarda)
  useEffect(() => {
    if (user?.rol_id === 2) {
      cargarVehiculos();
    }
  }, [filtros.sucursal_id]);

  const cargarSucursales = async () => {
    try {
      const response = await viajesApi.obtenerSucursales();
      if (response.data.success) {
        setSucursales(response.data.data || []);
      }
    } catch (error) {
      console.error("Error cargando sucursales:", error);
    }
  };

  const cargarPilotos = async () => {
    try {
      const response = await viajesApi.obtenerTodosPilotos();
      if (response.data.success) {
        setPilotos(response.data.data || []);
      }
    } catch (error) {
      console.error("Error cargando pilotos:", error);
    }
  };

  const cargarVehiculos = async () => {
    try {
      // Jefe de yarda (rol_id = 2): solo vehículos de su sucursal
      // Admin (rol_id = 3): todos los vehículos
      const sucursal_id = user?.rol_id === 2 ? user?.sucursal_id : undefined;

      /*       console.log(
        "🚛 Cargando vehículos para sucursal:",
        sucursal_id,
        "(rol:",
        user?.rol_id,
        ")"
      ); */

      const response = await viajesApi.obtenerVehiculosPorSucursal(sucursal_id);
      if (response.data.success) {
        //  console.log("✅ Vehículos cargados:", response.data.data?.length);
        setVehiculos(response.data.data || []);
      }
    } catch (error) {
      console.error("Error cargando vehículos:", error);
    }
  };

  // Cargar datos cuando cambien filtros, modo o agrupación
  useEffect(() => {
    cargarReporte();
  }, [filtros, modo, agrupacion]);

  const cargarReporte = async () => {
    setLoading(true);
    try {
      const response = await viajesApi.obtenerReporteDinamico({
        ...filtros,
        modo,
        agrupar_por: agrupacion,
      });

      if (response.data.success) {
        setDatos(response.data.data || []);
        setColumnas(response.data.columnas_disponibles || []);
        /*         console.log(
          `✅ Reporte cargado (${modo}):`,
          response.data.data?.length || 0,
          "registros"
        ); */
      }
    } catch (error: any) {
      console.error("❌ Error cargando reporte:", error);
      noti.error({
        title: "Error",
        message: "No se pudo cargar el reporte",
      });
    } finally {
      setLoading(false);
    }
  };

  // Agrupar datos para modo "especificar"
  const datosAgrupados = useMemo(() => {
    if (modo !== "especificar" || agrupacion === "ninguno") {
      return { Sin_Grupo: datos };
    }

    const campo =
      agrupacion === "piloto"
        ? "piloto"
        : agrupacion === "vehiculo"
          ? "numero_vehiculo"
          : agrupacion === "sucursal"
            ? "sucursal"
            : "piloto";

    return datos.reduce((grupos: any, fila: any) => {
      const clave = fila[campo] || "Sin especificar";
      if (!grupos[clave]) grupos[clave] = [];
      grupos[clave].push(fila);
      return grupos;
    }, {});
  }, [datos, modo, agrupacion]);

  // Toggle expandir/colapsar grupo
  const toggleGrupo = (grupo: string) => {
    setGruposExpandidos((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(grupo)) {
        nuevo.delete(grupo);
      } else {
        nuevo.add(grupo);
      }
      return nuevo;
    });
  };

  // Expandir/Colapsar todos
  const expandirTodos = () => {
    setGruposExpandidos(new Set(Object.keys(datosAgrupados)));
  };

  const colapsarTodos = () => {
    setGruposExpandidos(new Set());
  };

  // Exportar a Excel CON LOGO Y ENCABEZADO
  const exportarExcel = async () => {
    try {
      const encabezado = generarEncabezado();
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Reporte");

      // ============================================
      // AGREGAR LOGO
      // ============================================
      const response = await fetch(MadeysoLogo);
      const imageBlob = await response.blob(); // ← RENOMBRADO de 'blob' a 'imageBlob'
      const arrayBuffer = await imageBlob.arrayBuffer();
      const imageId = workbook.addImage({
        buffer: arrayBuffer,
        extension: "png",
      });

      worksheet.addImage(imageId, {
        tl: { col: 0, row: 0 }, // Top-left corner
        ext: { width: 150, height: 75 }, // Tamaño del logo
      });

      // ============================================
      // ENCABEZADO (empezar después del logo)
      // ============================================
      worksheet.mergeCells("C1:G1");
      worksheet.getCell("C1").value = encabezado.empresa;
      worksheet.getCell("C1").font = { size: 16, bold: true };

      worksheet.mergeCells("C2:G2");
      worksheet.getCell("C2").value = encabezado.titulo;
      worksheet.getCell("C2").font = { size: 12 };

      worksheet.mergeCells("C3:G3");
      worksheet.getCell("C3").value = encabezado.periodo;

      worksheet.mergeCells("C4:G4");
      worksheet.getCell("C4").value = encabezado.fechaGeneracion;

      worksheet.mergeCells("C5:G5");
      worksheet.getCell("C5").value = encabezado.usuario;

      // Línea vacía
      let currentRow = 7;

      // ============================================
      // DATOS DEL REPORTE
      // ============================================
      if (modo === "agregado") {
        // Headers
        const headers = [
          columnas.find((c) => c.id === "grupo")?.nombre || "Grupo",
          "Total Viajes",
          "Total Facturas",
          "Total Guías",
          "Guías Entregadas",
          "No Entregadas",
          "% Éxito",
        ];

        worksheet.addRow(headers);
        worksheet.getRow(currentRow).font = { bold: true };
        worksheet.getRow(currentRow).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF2563EB" },
        };
        worksheet.getRow(currentRow).font = { color: { argb: "FFFFFFFF" } };
        currentRow++;

        // Data
        datos.forEach((fila) => {
          worksheet.addRow([
            fila.grupo,
            fila.total_viajes,
            fila.total_facturas,
            fila.total_guias,
            fila.guias_entregadas,
            fila.guias_no_entregadas,
            `${fila.porcentaje_exito}%`,
          ]);
        });
      } else {
        // MODO ESPECIFICAR
        const headers = [
          "Piloto",
          "ID Viaje",
          "Fecha",
          "Vehículo",
          "Sucursal",
          "Factura",
          "Guía",
          "Estado",
        ];

        worksheet.addRow(headers);
        worksheet.getRow(currentRow).font = { bold: true };
        worksheet.getRow(currentRow).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF2563EB" },
        };
        worksheet.getRow(currentRow).font = { color: { argb: "FFFFFFFF" } };
        currentRow++;

        Object.entries(datosAgrupados).forEach(
          ([grupo, filas]: [string, any]) => {
            // Fila de grupo
            const grupoRow = worksheet.addRow([`${grupo}`]);
            worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
            grupoRow.font = { bold: true };
            grupoRow.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFDBEAFE" },
            };
            currentRow++;

            // Filas del grupo
            filas.forEach((fila: any) => {
              worksheet.addRow([
                fila.piloto,
                fila.viaje_id,
                new Date(fila.fecha_viaje).toLocaleDateString("es-HN"),
                fila.numero_vehiculo,
                fila.sucursal,
                fila.numero_factura,
                fila.numero_guia,
                fila.estado_guia,
              ]);
              currentRow++;
            });
          },
        );
      }

      // Ajustar ancho de columnas
      worksheet.columns = [
        { width: 25 },
        { width: 12 },
        { width: 12 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
      ];

      // Guardar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const fileBlob = new Blob([buffer], {
        // ← RENOMBRADO de 'blob' a 'fileBlob'
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte_SIVEC_${modo}_${agrupacion}_${filtros.fecha_desde}_${filtros.fecha_hasta}.xlsx`;
      link.click();

      noti.success({
        title: "Exportado",
        message: "Reporte exportado con logo exitosamente",
      });
    } catch (error) {
      console.error("Error exportando Excel:", error);
      noti.error({
        title: "Error",
        message: "No se pudo exportar el reporte",
      });
    }
  };

  // Exportar a PDF CON ENCABEZADO Y LOGO
  const exportarPDF = () => {
    try {
      const encabezado = generarEncabezado();
      const doc = new jsPDF();

      // ============================================
      // LOGO (imagen a la izquierda)
      // ============================================
      const img = new Image();
      img.src = MadeysoLogo;

      img.onload = () => {
        // Logo en la esquina superior izquierda (ajusta tamaño según tu logo)
        doc.addImage(img, "PNG", 14, 10, 30, 15); // x, y, width, height

        // ============================================
        // ENCABEZADO (texto a la derecha del logo)
        // ============================================
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(encabezado.empresa, 50, 15); // Movido a la derecha del logo

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(encabezado.titulo, 50, 22);

        doc.setFontSize(10);
        doc.text(encabezado.periodo, 50, 28);
        doc.text(encabezado.fechaGeneracion, 50, 34);
        doc.text(encabezado.usuario, 50, 40);

        // Línea separadora
        doc.setLineWidth(0.5);
        doc.line(14, 45, 196, 45);

        // ============================================
        // TABLA DE DATOS
        // ============================================
        if (modo === "agregado") {
          // MODO AGREGADO
          const headers = [
            [
              columnas.find((c) => c.id === "grupo")?.nombre || "Grupo",
              "Viajes",
              "Facturas",
              "Guías",
              "Entregadas",
              "No Entregadas",
              "% Éxito",
            ],
          ];

          const body = datos.map((fila) => [
            fila.grupo,
            fila.total_viajes,
            fila.total_facturas,
            fila.total_guias,
            fila.guias_entregadas,
            fila.guias_no_entregadas,
            `${fila.porcentaje_exito}%`,
          ]);

          autoTable(doc, {
            startY: 50,
            head: headers,
            body: body,
            theme: "grid",
            headStyles: { fillColor: [0, 166, 81] },
            styles: { fontSize: 9, cellPadding: 3 },
          });
        } else {
          // MODO ESPECIFICAR
          const headers = [
            [
              "Piloto",
              "ID Viaje",
              "Fecha",
              "Vehículo",
              "Sucursal",
              "Factura",
              "Guía",
              "Estado",
            ],
          ];

          const body: any[] = [];

          Object.entries(datosAgrupados).forEach(
            ([grupo, filas]: [string, any]) => {
              // Fila de grupo
              body.push([
                {
                  content: `${grupo}`,
                  colSpan: 8,
                  styles: {
                    fontStyle: "bold",
                    fillColor: [230, 247, 238],
                    AlignCenter: "center",
                  },
                },
              ]);

              // Filas del grupo
              filas.forEach((fila: any) => {
                body.push([
                  fila.piloto,
                  fila.viaje_id,
                  new Date(fila.fecha_viaje).toLocaleDateString("es-HN"),
                  fila.numero_vehiculo,
                  fila.sucursal,
                  fila.numero_factura,
                  fila.numero_guia,
                  fila.estado_guia,
                ]);
              });
            },
          );

          autoTable(doc, {
            startY: 50,
            head: headers,
            body: body,
            theme: "grid",
            headStyles: { fillColor: [0, 166, 81] },
            styles: { fontSize: 8, cellPadding: 2 },
          });
        }

        // Pie de página
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(128);
          doc.text(
            `Página ${i} de ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: "center" },
          );
        }

        const nombreArchivo = `reporte_SIVEC_${modo}_${agrupacion}_${filtros.fecha_desde}_${filtros.fecha_hasta}.pdf`;
        doc.save(nombreArchivo);

        noti.success({
          title: "Exportado",
          message: `Reporte exportado como ${nombreArchivo}`,
        });
      };

      img.onerror = () => {
        console.error("Error cargando logo");
        noti.error({
          title: "Error",
          message: "No se pudo cargar el logo de la empresa",
        });
      };
    } catch (error) {
      console.error("Error exportando PDF:", error);
      noti.error({
        title: "Error",
        message: "No se pudo exportar el PDF",
      });
    }
  };
  const imprimirPDF = () => {
    try {
      const encabezado = generarEncabezado();
      const doc = new jsPDF();

      // ============================================
      // LOGO (imagen a la izquierda)
      // ============================================
      const img = new Image();
      img.src = MadeysoLogo;

      img.onload = () => {
        // Logo en la esquina superior izquierda
        doc.addImage(img, "PNG", 14, 10, 30, 15);

        // ============================================
        // ENCABEZADO (texto a la derecha del logo)
        // ============================================
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(encabezado.empresa, 50, 15);

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(encabezado.titulo, 50, 22);

        doc.setFontSize(10);
        doc.text(encabezado.periodo, 50, 28);
        doc.text(encabezado.fechaGeneracion, 50, 34);
        doc.text(encabezado.usuario, 50, 40);

        // Línea separadora
        doc.setLineWidth(0.5);
        doc.line(14, 45, 196, 45);

        // ============================================
        // TABLA DE DATOS
        // ============================================
        if (modo === "agregado") {
          // MODO AGREGADO
          const headers = [
            [
              columnas.find((c) => c.id === "grupo")?.nombre || "Grupo",
              "Viajes",
              "Facturas",
              "Guías",
              "Entregadas",
              "No Entregadas",
              "% Éxito",
            ],
          ];

          const body = datos.map((fila) => [
            fila.grupo,
            fila.total_viajes,
            fila.total_facturas,
            fila.total_guias,
            fila.guias_entregadas,
            fila.guias_no_entregadas,
            `${fila.porcentaje_exito}%`,
          ]);

          autoTable(doc, {
            startY: 50,
            head: headers,
            body: body,
            theme: "grid",
            headStyles: { fillColor: [0, 166, 81] }, // ✅ Verde MADEYSO
            styles: { fontSize: 9, cellPadding: 3 },
          });
        } else {
          // MODO ESPECIFICAR
          const headers = [
            [
              "Piloto",
              "ID Viaje",
              "Fecha",
              "Vehículo",
              "Sucursal",
              "Factura",
              "Guía",
              "Estado",
            ],
          ];

          const body: any[] = [];

          Object.entries(datosAgrupados).forEach(
            ([grupo, filas]: [string, any]) => {
              // Fila de grupo
              body.push([
                {
                  content: `${grupo}`,
                  colSpan: 8,
                  styles: {
                    fontStyle: "bold",
                    fillColor: [230, 247, 238], // ✅ Verde MADEYSO suave
                    halign: "left",
                  },
                },
              ]);

              // Filas del grupo
              filas.forEach((fila: any) => {
                body.push([
                  fila.piloto,
                  fila.viaje_id,
                  new Date(fila.fecha_viaje).toLocaleDateString("es-HN"),
                  fila.numero_vehiculo,
                  fila.sucursal,
                  fila.numero_factura,
                  fila.numero_guia,
                  fila.estado_guia,
                ]);
              });
            },
          );

          autoTable(doc, {
            startY: 50,
            head: headers,
            body: body,
            theme: "grid",
            headStyles: { fillColor: [0, 166, 81] }, // ✅ Verde MADEYSO
            styles: { fontSize: 8, cellPadding: 2 },
          });
        }

        // Pie de página
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(128);
          doc.text(
            `Página ${i} de ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: "center" },
          );
        }

        // ✅ SOLUCIÓN: Usar autoPrint() de jsPDF y abrir en nueva ventana
        doc.autoPrint();

        // Abrir en nueva ventana con el PDF
        window.open(doc.output("bloburl"), "_blank");

        noti.success({
          title: "PDF abierto",
          message: "El diálogo de impresión se abrirá automáticamente",
        });
      };

      img.onerror = () => {
        console.error("Error cargando logo");
        noti.error({
          title: "Error",
          message: "No se pudo cargar el logo de la empresa",
        });
      };
    } catch (error) {
      console.error("Error generando PDF para imprimir:", error);
      noti.error({
        title: "Error",
        message: "No se pudo generar el PDF para imprimir",
      });
    }
  };

  // Interceptar Ctrl+P para usar nuestra función de impresión personalizada
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detectar Ctrl+P (Windows/Linux) o Cmd+P (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault(); // Prevenir el diálogo de impresión por defecto
        imprimirPDF(); // Ejecutar nuestra función personalizada
      }
    };

    // Agregar listener
    window.addEventListener("keydown", handleKeyDown);

    // Limpiar listener al desmontar
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [imprimirPDF]); // Dependencia: se actualiza si imprimirPDF cambia

  const imprimir = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.history.back()}
                className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors flex items-center gap-2"
              >
                <Icons.chevronLeft className="w-5 h-5" />
                Volver
              </button>
              <div className="w-px h-6 bg-gray-300 dark:bg-slate-600"></div>
              <Icons.barChart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                Reportes Dinámicos
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportarExcel}
                disabled={loading || datos.length === 0}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white rounded-lg transition flex items-center gap-2 disabled:cursor-not-allowed"
              >
                <Icons.download className="w-4 h-4" />
                Exportar Excel
              </button>

              <button
                onClick={exportarPDF}
                disabled={loading || datos.length === 0}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white rounded-lg transition flex items-center gap-2 disabled:cursor-not-allowed"
              >
                <Icons.download className="w-4 h-4" />
                Exportar PDF
              </button>

              <button
                onClick={imprimirPDF}
                disabled={loading || datos.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white rounded-lg transition flex items-center gap-2 disabled:cursor-not-allowed"
              >
                <Icons.printer className="w-4 h-4" />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controles */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Fecha Desde
              </label>
              <input
                type="date"
                value={filtros.fecha_desde}
                onChange={(e) =>
                  setFiltros({ ...filtros, fecha_desde: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={filtros.fecha_hasta}
                onChange={(e) =>
                  setFiltros({ ...filtros, fecha_hasta: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              />
            </div>

            {/* Filtro de Sucursal - Solo para Admin */}
            {user?.rol_id === 3 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Sucursal
                </label>
                <input
                  list="sucursales-list"
                  value={
                    sucursales.find(
                      (s) => s.sucursal_id === filtros.sucursal_id,
                    )?.nombre_sucursal || ""
                  }
                  onChange={(e) => {
                    const sucursal = sucursales.find(
                      (s) => s.nombre_sucursal === e.target.value,
                    );
                    setFiltros({
                      ...filtros,
                      sucursal_id: sucursal?.sucursal_id,
                    });
                  }}
                  placeholder="Todas las sucursales"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                />
                <datalist id="sucursales-list">
                  {sucursales.map((s) => (
                    <option key={s.sucursal_id} value={s.nombre_sucursal} />
                  ))}
                </datalist>
              </div>
            )}

            {/* Filtro de Piloto - Datalist para todos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Piloto (opcional)
              </label>
              <input
                list="pilotos-list"
                value={filtros.piloto || ""}
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    piloto: e.target.value || undefined,
                  })
                }
                placeholder="Seleccione o escriba"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              />
              <datalist id="pilotos-list">
                {pilotos.map((piloto, idx) => (
                  <option key={idx} value={piloto} />
                ))}
              </datalist>
            </div>

            {/* Filtro de Vehículo - Select (Dropdown) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Vehículo (opcional)
              </label>
              <select
                value={filtros.numero_vehiculo || ""}
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    numero_vehiculo: e.target.value || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              >
                <option value="">Todos los vehículos</option>
                {vehiculos.map((v) => (
                  <option key={v.vehiculo_id} value={v.numero_vehiculo}>
                    {v.numero_vehiculo} - {v.placa}{" "}
                    {v.sucursales?.nombre_sucursal &&
                      `(${v.sucursales.nombre_sucursal})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modo y Agrupación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-slate-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Modo de Vista
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setModo("agregado")}
                  className={`flex items-center justify-center gap-2 flex-1 px-4 py-2 rounded-lg font-medium transition ${
                    modo === "agregado"
                      ? "bg-madeyso-primary-dark text-white"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                  }`}
                >
                  <Icons.barChart className="w-4 h-4" />
                  Agregado
                </button>
                <button
                  onClick={() => setModo("especificar")}
                  className={`flex items-center justify-center gap-2 flex-1 px-4 py-2 rounded-lg font-medium transition ${
                    modo === "especificar"
                      ? "bg-madeyso-primary-dark text-white"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                  }`}
                >
                  <Icons.list className="w-4 h-4" />
                  Especificar
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Agrupar por
              </label>
              <select
                value={agrupacion}
                onChange={(e) =>
                  setAgrupacion(e.target.value as TipoAgrupacion)
                }
                className="w-full max-w-xs px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-madeyso-primary focus:border-transparent"
              >
                <option value="piloto">Piloto</option>
                <option value="vehiculo">Vehículo</option>
                <option value="sucursal">Sucursal</option>
                {modo === "especificar" && (
                  <option value="ninguno">Sin agrupar</option>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          {/* Header con controles para modo especificar */}
          {modo === "especificar" &&
            agrupacion !== "ninguno" &&
            datos.length > 0 && (
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-slate-700">
                <div className="text-sm text-gray-600 dark:text-slate-400">
                  {datos.length} registros en{" "}
                  {Object.keys(datosAgrupados).length} grupos
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={expandirTodos}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 rounded transition"
                  >
                    Expandir Todos
                  </button>
                  <button
                    onClick={colapsarTodos}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 rounded transition"
                  >
                    Colapsar Todos
                  </button>
                </div>
              </div>
            )}

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Icons.refresh className="w-8 h-8 animate-spin text-madeyso-primary" />
                <span className="ml-3 text-gray-600 dark:text-slate-400">
                  Cargando reporte...
                </span>
              </div>
            ) : datos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-slate-400">
                <Icons.alertCircle className="w-12 h-12 mb-3" />
                <p>No hay datos para mostrar con los filtros seleccionados</p>
              </div>
            ) : modo === "agregado" ? (
              // MODO AGREGADO: Tabla simple con totales
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-900">
                  <tr>
                    {columnas
                      .filter((c) => c.visible)
                      .map((col) => (
                        <th
                          key={col.id}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
                        >
                          {col.nombre}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {datos.map((fila, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-slate-100">
                        {fila.grupo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                        {fila.total_viajes}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                        {fila.total_facturas}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                        {fila.total_guias}
                      </td>
                      <td className="px-6 py-4 text-sm text-green-600 dark:text-green-400">
                        {fila.guias_entregadas}
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600 dark:text-red-400">
                        {fila.guias_no_entregadas}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            fila.porcentaje_exito >= 90
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : fila.porcentaje_exito >= 70
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {fila.porcentaje_exito}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              // MODO ESPECIFICAR: Tabla con grupos colapsables
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-900">
                  <tr>
                    <th className="w-10"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                      Piloto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                      ID Viaje
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                      Vehículo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                      Sucursal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                      Factura
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                      Guía
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(datosAgrupados).map(
                    ([grupo, filas]: [string, any]) => {
                      const expandido = gruposExpandidos.has(grupo);

                      // Calcular totales del grupo
                      const totalGuias = filas.length;
                      const guiasEntregadas = filas.filter(
                        (r: any) => r.estado_guia === "Entregada",
                      ).length;
                      const guiasNoEntregadas = filas.filter(
                        (r: any) => r.estado_guia === "No Entregada",
                      ).length;
                      const porcentajeExito =
                        totalGuias > 0
                          ? Math.round((guiasEntregadas / totalGuias) * 100)
                          : 0;
                      const viajesUnicos = new Set(
                        filas.map((r: any) => r.viaje_id),
                      ).size;
                      const facturasUnicas = new Set(
                        filas.map((r: any) => r.numero_factura),
                      ).size;

                      return (
                        <React.Fragment key={grupo}>
                          {/* Fila de grupo */}
                          {agrupacion !== "ninguno" && (
                            <tr
                              className="bg-madeyso-green-50 dark:bg-blue-900/20 hover:bg-madeyso-green-100 dark:hover:bg-blue-900/30 cursor-pointer border-t-2 border-blue-200 dark:border-blue-800"
                              onClick={() => toggleGrupo(grupo)}
                            >
                              <td className="px-6 py-3">
                                {expandido ? (
                                  <Icons.chevronDown className="w-4 h-4 text-madeyso-primary dark:text-madeyso-primary-light" />
                                ) : (
                                  <Icons.chevronRight className="w-4 h-4 text-madeyso-primary dark:text-madeyso-primary-light" />
                                )}
                              </td>
                              <td colSpan={8} className="px-6 py-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-blue-900 dark:text-blue-300">
                                    {grupo}
                                  </span>
                                  <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                      <span className="font-semibold">
                                        {viajesUnicos}
                                      </span>{" "}
                                      viajes
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="font-semibold">
                                        {facturasUnicas}
                                      </span>{" "}
                                      facturas
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="font-semibold">
                                        {totalGuias}
                                      </span>{" "}
                                      guías
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="font-semibold text-green-600 dark:text-green-400">
                                        {guiasEntregadas}
                                      </span>{" "}
                                      entregadas
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="font-semibold text-red-600 dark:text-red-400">
                                        {guiasNoEntregadas}
                                      </span>{" "}
                                      no entregadas
                                    </span>
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-semibold ${
                                        porcentajeExito >= 90
                                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                          : porcentajeExito >= 70
                                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                      }`}
                                    >
                                      {porcentajeExito}% éxito
                                    </span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Filas de detalle */}
                          {(agrupacion === "ninguno" || expandido) &&
                            filas.map((fila: any, idx: number) => (
                              <tr
                                key={`${grupo}-${idx}`}
                                className="hover:bg-gray-50 dark:hover:bg-slate-700/50 border-b border-gray-100 dark:border-slate-800"
                              >
                                <td></td>
                                <td className="px-6 py-3 text-sm text-gray-700 dark:text-slate-300">
                                  {fila.piloto}
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-700 dark:text-slate-300">
                                  {fila.viaje_id}
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-700 dark:text-slate-300">
                                  {new Date(
                                    fila.fecha_viaje,
                                  ).toLocaleDateString("es-HN")}
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-700 dark:text-slate-300">
                                  {fila.numero_vehiculo}
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-700 dark:text-slate-300">
                                  {fila.sucursal}
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-700 dark:text-slate-300">
                                  {fila.numero_factura}
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-700 dark:text-slate-300">
                                  {fila.numero_guia}
                                </td>
                                <td className="px-6 py-3 text-sm">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      fila.estado_guia === "Entregada"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                    }`}
                                  >
                                    {fila.estado_guia}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </React.Fragment>
                      );
                    },
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reportes;
