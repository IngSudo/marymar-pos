const CLAVE_CARRITO = 'marymar_pos_carrito';
const CLAVE_PENDIENTES = 'marymar_pos_pendientes';

function leer(clave, porDefecto) {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo ? JSON.parse(crudo) : porDefecto;
  } catch {
    return porDefecto;
  }
}

function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {}
}

export function leerCarrito() {
  return leer(CLAVE_CARRITO, []);
}

export function guardarCarrito(carrito) {
  guardar(CLAVE_CARRITO, carrito);
}

export function leerPendientes() {
  return leer(CLAVE_PENDIENTES, []);
}

export function guardarPendientes(pendientes) {
  guardar(CLAVE_PENDIENTES, pendientes);
}
