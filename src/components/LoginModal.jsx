import { useState, useEffect, useMemo } from "react";
import { listSedes } from "../lib/sedes.js";

export function LoginModal({ onLogin, settings }) {
  const ADMIN_PASS = settings?.admin_password || import.meta.env.VITE_ADMIN_PASSWORD || "dipalma2026";
  const [sedes, setSedes] = useState(null); // null = cargando
  const [pendingAdmin, setPendingAdmin] = useState(null); // null | { sede, label }
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { listSedes().then(setSedes).catch(() => setSedes([])); }, []);

  // Un perfil = rol (sales/admin) + sede. Todas las sedes comparten la misma
  // clave de administrador.
  const PROFILES = useMemo(() => {
    const list = sedes || [];
    return list.flatMap((sd) => ([
      { role: "sales", sede: sd.key, label: `Ventas ${sd.label}` },
      { role: "admin", sede: sd.key, label: `Admin ${sd.label}` },
    ]));
  }, [sedes]);

  const pickProfile = (profile) => {
    if (profile.role === "admin") {
      setPendingAdmin(profile);
    } else {
      onLogin(`${profile.role}:${profile.sede}`);
    }
  };

  const handleAdmin = () => {
    if (pass === ADMIN_PASS) {
      onLogin(`admin:${pendingAdmin.sede}`);
    } else {
      setError("Clave incorrecta");
    }
  };

  return (
    <div className="login-back">
      <div className="login-box">
        <div className="login-logo-wrap">
          <div className="login-logo-mark">{(settings?.company_name || "Dipalma").slice(0, 2).toLowerCase()}</div>
          <div>
            <div className="login-brand">{settings?.company_name || "Dipalma"}</div>
            <div className="login-sub">{settings?.login_subtitle || "Portafolio Comercial"}</div>
          </div>
        </div>

        {sedes === null ? (
          <p className="login-prompt">Cargando…</p>
        ) : !pendingAdmin ? (
          <>
            <p className="login-prompt">Selecciona tu perfil de acceso</p>
            <div className="login-roles">
              {PROFILES.map((profile) => (
                <button
                  key={profile.label}
                  className={"login-role-btn " + (profile.role === "admin" ? "login-role-admin" : "login-role-sales")}
                  onClick={() => pickProfile(profile)}
                >
                  {profile.role === "admin" ? (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  ) : (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  )}
                  <span className="login-role-name">{profile.label}</span>
                  <span className="login-role-desc">{profile.role === "admin" ? "Edición completa" : "Solo consulta"}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="login-pass-form">
            <button className="login-back-btn" onClick={() => { setPendingAdmin(null); setPass(""); setError(""); }}>
              ← Volver
            </button>
            <p className="login-prompt">Clave de administrador — {pendingAdmin.label}</p>
            <input
              type="password"
              className="login-pass-input"
              placeholder="Contraseña"
              value={pass}
              onChange={(e) => { setPass(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleAdmin()}
              autoFocus
            />
            {error && <p className="login-error">{error}</p>}
            <button className="login-submit" onClick={handleAdmin}>Ingresar</button>
          </div>
        )}
      </div>
    </div>
  );
}
