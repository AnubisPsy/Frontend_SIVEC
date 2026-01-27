// ✅ PALETA DE COLORES PARA GRÁFICOS - MADEYSO
export const chartColors = {
  // Paleta principal - Colores corporativos MADEYSO
  madeyso: {
    primary: "#00A651", // Verde MADEYSO principal
    primaryLight: "#33B871", // Verde MADEYSO más claro
    primaryDark: "#008742", // Verde MADEYSO más oscuro
    secondary: "#9FD856", // Verde lima (la O)
    accent: "#E31E24", // Rojo Do it Best
    dark: "#1A1A1A", // Negro corporativo
    // Variaciones para diferentes usos
    green: {
      50: "#E6F7EE",
      100: "#B3E6CE",
      200: "#80D5AE",
      300: "#4DC48E",
      400: "#1AB36E",
      500: "#00A651", // Principal
      600: "#008542",
      700: "#006433",
      800: "#004324",
      900: "#002115",
    },
    lime: {
      50: "#F7FDE6",
      100: "#E8F9B8",
      200: "#D9F58A",
      300: "#CAF15C",
      400: "#BBED2E",
      500: "#9FD856", // Secundario
      600: "#8AC647",
      700: "#75B438",
      800: "#60A229",
      900: "#4B901A",
    },
    // Array de colores para gráficos
    palette: [
      "#00A651", // Verde MADEYSO principal
      "#9FD856", // Verde lima
      "#33B871", // Verde medio
      "#008742", // Verde oscuro
      "#BBED2E", // Lima brillante
      "#006433", // Verde muy oscuro
    ],
  } as const,

  // Paleta extendida para gráficos complejos (si necesitas más colores)
  extended: [
    "#00A651", // Verde MADEYSO
    "#9FD856", // Verde lima
    "#33B871", // Verde claro
    "#008742", // Verde medio
    "#BBED2E", // Lima brillante
    "#006433", // Verde oscuro
    "#75B438", // Lima medio
    "#4DC48E", // Verde agua
    "#8AC647", // Lima profundo
    "#1AB36E", // Verde brillante
  ] as const,

  // Estados específicos
  estados: {
    completado: "#00A651", // Verde MADEYSO
    enProceso: "#9FD856", // Verde lima
    pendiente: "#CBD5E1", // Gris claro
    noEntregado: "#E31E24", // Rojo
    cancelado: "#94A3B8", // Gris medio
  } as const,

  // Colores semánticos manteniendo la identidad MADEYSO
  semantico: {
    exito: "#00A651", // Verde MADEYSO
    advertencia: "#9FD856", // Verde lima (más suave que amarillo)
    error: "#E31E24", // Rojo Do it Best
    info: "#33B871", // Verde claro
    neutral: "#64748B", // Gris
  } as const,
} as const;

// ✅ HELPER: Obtener color por índice (para loops en gráficos)
export const getChartColor = (index: number): string => {
  return chartColors.madeyso.palette[
    index % chartColors.madeyso.palette.length
  ];
};

// ✅ HELPER: Obtener color de estado
export const getEstadoColor = (estadoId: number): string => {
  const colores: Record<number, string> = {
    4: chartColors.estados.completado, // Entregado
    5: chartColors.estados.noEntregado, // No entregado
    7: chartColors.estados.pendiente, // Pendiente
    8: chartColors.estados.enProceso, // En proceso
    9: chartColors.estados.completado, // Completado
  };
  return colores[estadoId] || chartColors.semantico.neutral;
};
