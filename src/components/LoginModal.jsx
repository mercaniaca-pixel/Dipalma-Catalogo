import { useState } from "react";

const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD || "dipalma2026";

// Un perfil = rol (sales/admin) + sede (Dipalma/Dipal). Ambas sedes comparten
// la misma clave de administrador.
const PROFILES = [
  { role: "sales", sede: "Dipalma", label: "Ventas Dipalma" },
  { role: "admin", sede: "Dipalma", label: "Admin Dipalma" },
  { role: "sales", sede: "Dipal", label: "Ventas Dipal" },
  { role: "admin", sede: "Dipal", label: "Admin Dipal" },
];

export function LoginModal({ onLogin }) {
  const [pendingAdmin, setPendingAdmin] = useState(null); // null | { sede, label }
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

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
          <div className="login-logo-mark">dp</div>
          <div>
            <div className="login-brand">Dipalma</div>
            <div className="login-sub">Portafolio Comercial</div>
          </div>
        </div>

        {!pendingAdmin ? (
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
