import { createContext, useContext, useState } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

function obtenerSesionActiva() {
  const token = localStorage.getItem("token");
  const usuarioStr = localStorage.getItem("usuario");
  if (token && usuarioStr) return { token, usuario: JSON.parse(usuarioStr) };
  return null;
}

function obtenerCajaPredeterminada() {
  const token = localStorage.getItem("caja_token");
  const usuarioStr = localStorage.getItem("caja_usuario");
  if (token && usuarioStr) return { token, usuario: JSON.parse(usuarioStr) };
  return null;
}

function establecerSesionActiva(token, usuario) {
  localStorage.setItem("token", token);
  localStorage.setItem("usuario", JSON.stringify(usuario));
}

function limpiarSesionActiva() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
}

export function AuthProvider({ children }) {
  const sesionInicial = (() => {
    const activa = obtenerSesionActiva();
    if (activa)
      return {
        ...activa,
        elevada: localStorage.getItem("esElevada") === "true",
      };

    const caja = obtenerCajaPredeterminada();
    if (caja) {
      establecerSesionActiva(caja.token, caja.usuario);
      return { ...caja, elevada: false };
    }
    return null;
  })();

  const [usuario, setUsuario] = useState(sesionInicial?.usuario || null);
  const [esSesionElevada, setEsSesionElevada] = useState(
    sesionInicial?.elevada || false,
  );

  async function login(usuarioInput, password) {
    const { data } = await client.post("/auth/login", {
      usuario: usuarioInput,
      password,
    });
    establecerSesionActiva(data.token, data.usuario);
    localStorage.setItem("esElevada", "true");
    setUsuario(data.usuario);
    setEsSesionElevada(true);
    return data.usuario;
  }

  function configurarCajaPredeterminada(token, usuarioCaja) {
    localStorage.setItem("caja_token", token);
    localStorage.setItem("caja_usuario", JSON.stringify(usuarioCaja));
  }

  function logout() {
    limpiarSesionActiva();
    localStorage.removeItem("esElevada");

    const caja = obtenerCajaPredeterminada();
    if (caja) {
      establecerSesionActiva(caja.token, caja.usuario);
      setUsuario(caja.usuario);
      setEsSesionElevada(false);
    } else {
      setUsuario(null);
      setEsSesionElevada(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        esSesionElevada,
        login,
        logout,
        configurarCajaPredeterminada,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
