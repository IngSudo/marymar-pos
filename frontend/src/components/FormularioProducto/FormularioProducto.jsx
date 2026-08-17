import { useEffect, useState } from "react";
import { obtenerCategorias, crearCategoria } from "../../api/categorias";
import { crearProducto, editarProducto } from "../../api/productos";
import "./FormularioProducto.scss";

export default function FormularioProducto({ productoExistente, onGuardado }) {
  const esEdicion = Boolean(productoExistente);

  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState(productoExistente?.nombre || "");
  const [precio, setPrecio] = useState(productoExistente?.precio || "");
  const [costoEstimado, setCostoEstimado] = useState(
    productoExistente?.costoEstimado || "",
  );
  const [categoriaId, setCategoriaId] = useState(
    productoExistente?.categoriaId || "",
  );
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerCategorias()
      .then(setCategorias)
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setGuardando(true);

    try {
      let idCategoriaFinal = categoriaId;

      if (!idCategoriaFinal && nuevaCategoria.trim()) {
        const creada = await crearCategoria(nuevaCategoria.trim());
        idCategoriaFinal = creada.id;
      }

      if (!idCategoriaFinal) {
        setError("Selecciona o escribe una categoría");
        setGuardando(false);
        return;
      }

      const payload = {
        nombre,
        precio: Number(precio),
        costoEstimado: Number(costoEstimado),
        categoriaId: Number(idCategoriaFinal),
      };

      if (esEdicion) {
        await editarProducto(productoExistente.id, {
          ...payload,
          activo: productoExistente.activo,
        });
      } else {
        await crearProducto(payload);
      }

      onGuardado();
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo guardar el plato");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="form-producto" onSubmit={handleSubmit}>
      {error && <div className="form-producto__error">{error}</div>}

      <label>Nombre del plato</label>
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
        autoFocus
      />

      <label>Precio de venta ($)</label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={precio}
        onChange={(e) => setPrecio(e.target.value)}
        required
      />

      <label>Costo estimado ($)</label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={costoEstimado}
        onChange={(e) => setCostoEstimado(e.target.value)}
        required
      />

      <label>Categoría</label>
      <select
        value={categoriaId}
        onChange={(e) => {
          setCategoriaId(e.target.value);
          setNuevaCategoria("");
        }}
      >
        <option value="">-- Elegir existente --</option>
        {categorias.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>

      <label>O escribe una categoría nueva</label>
      <input
        value={nuevaCategoria}
        onChange={(e) => {
          setNuevaCategoria(e.target.value);
          setCategoriaId("");
        }}
        placeholder="Ej. Bebidas"
      />

      <button type="submit" disabled={guardando}>
        {guardando
          ? "Guardando..."
          : esEdicion
            ? "Guardar cambios"
            : "Agregar plato"}
      </button>
    </form>
  );
}
