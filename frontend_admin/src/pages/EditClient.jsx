import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BACK_URL } from "../config/config";
import "./EditClient.css";

const ICON_OPTIONS = [
  { label: "Étiquette", value: "fas fa-tag" },
  { label: "Lien",      value: "fas fa-link" },
  { label: "Étoile",    value: "fas fa-star" },
  { label: "Cœur",      value: "fas fa-heart" },
  { label: "Check",     value: "fas fa-check" },
  { label: "Info",      value: "fas fa-info-circle" },
  { label: "Utilisateur", value: "fas fa-user" },
  { label: "Panier",    value: "fas fa-shopping-cart" },
];

const FALLBACK_TYPE = "AC_OTH";

export default function EditClient() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    site_number: "",
    email: "",
    dolibarr_url: "",
    token_url: "",
    username: "",
    password: "",
    dolibarr_api_key: "",
    domain: "",
    logo: "",
  });

  const [buttons,     setButtons]     = useState([]);
  const [eventTypes,  setEventTypes]  = useState([]);
  const [clientDefault, setClientDefault] = useState("");
  const [typesLoading, setTypesLoading]   = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [message,     setMessage]     = useState("");

  // ── 1. Load client data + buttons ────────────────────────────────────────
  useEffect(() => {
    const fetchClientDetails = async () => {
      try {
        const res = await axios.get(`${API_BACK_URL}/getClientDetails.php?id=${id}`);
        if (res.data.success) {
          const c = res.data.client;
          setForm({
            site_number:      c.site_number       || "",
            email:            c.email             || "",
            dolibarr_url:     c.dolibarr_url      || "",
            token_url:        c.token_url         || "",
            username:         c.username          || "",
            password:         c.password          || "",
            dolibarr_api_key: c.dolibarr_api_key  || "",
            domain:           c.domain            || "",
            logo:             c.logo              || "",
          });
          setClientDefault(c.default_dolibarr_type_code || "");
          // Normalize dolibarr_type_code so the <select> always has a string
          setButtons(
            (res.data.buttons || []).map(b => ({
              ...b,
              dolibarr_type_code: b.dolibarr_type_code ?? "",
            }))
          );
        } else {
          alert("Erreur: " + res.data.error);
        }
      } catch (err) {
        console.error("Erreur chargement client", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClientDetails();
  }, [id]);

  // ── 2. Load Dolibarr event types for this client ─────────────────────────
  useEffect(() => {
    if (!id) return;
    setTypesLoading(true);
    fetch(`${API_BACK_URL}/getDolibarrEventTypes.php?client_id=${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setEventTypes(json.types ?? []);
          // Only set default if not already loaded from client record
          setClientDefault(prev => prev || json.client_default || "");
        }
      })
      .catch(() => {})
      .finally(() => setTypesLoading(false));
  }, [id]);

  // ── 3. Auto-fill domain from email ───────────────────────────────────────
  useEffect(() => {
    if (form.email?.includes("@")) {
      setForm(prev => ({ ...prev, domain: form.email.split("@")[1] }));
    }
  }, [form.email]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleButtonChange = (index, field, value) =>
    setButtons(prev =>
      prev.map((btn, i) => (i === index ? { ...btn, [field]: value } : btn))
    );

  const addButton = () =>
    setButtons(prev => [
      ...prev,
      { label: "", bg_color: "#2563eb", text_color: "#ffffff",
        icon: "fas fa-tag", dolibarr_type_code: "" },
    ]);

  const removeButton = (index) => {
    if (buttons.length > 1)
      setButtons(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BACK_URL}/updateClient.php`, {
        id,
        ...form,
        default_dolibarr_type_code: clientDefault || null,
        buttons,
      });
      if (res.data.success) {
        setMessage("✅ Configuration mise à jour avec succès !");
        setTimeout(() => navigate("/clients"), 2000);
      } else {
        setMessage("❌ Erreur : " + res.data.error);
      }
    } catch {
      setMessage("❌ Erreur réseau lors de la mise à jour");
    }
  };

  if (loading) return <div className="loader">Chargement...</div>;

  return (
    <div className="client-wrapper">
      <div className="client-card">
        <div className="header">
          <h2>Modifier le Client <span style={{ color: "#2563eb" }}>#{id}</span></h2>
          <p>Mettez à jour les accès et les boutons</p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* ── Client fields ── */}
          <div className="input-grid">
            {[
              { name: "site_number",      label: "N° de site",                type: "text"  },
              { name: "email",            label: "Email Contact",              type: "email" },
              { name: "dolibarr_url",     label: "URL Dolibarr",               type: "url"   },
              { name: "token_url",        label: "URL Token",                  type: "url"   },
              { name: "username",         label: "Nom d'utilisateur",          type: "text"  },
              { name: "password",         label: "Mot de passe",               type: "text"  },
              { name: "dolibarr_api_key", label: "Clé API Dolibarr",           type: "text"  },
              { name: "domain",           label: "Domaine (ex: entreprise.com)", type: "text"},
              { name: "logo",             label: "URL Logo Client",            type: "url"   },
            ].map(({ name, label, type }) => (
              <div className="input-group" key={name}>
                <label>{label}</label>
                <input
                  type={type} name={name} value={form[name]}
                  onChange={handleChange} required
                />
              </div>
            ))}
          </div>

          {/* ── Client-level default type ── */}
          <div className="form-section" style={{ margin: "18px 0 0" }}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
              Type d'événement par défaut (Fallback client)
            </label>
            <select
              value={clientDefault}
              onChange={e => setClientDefault(e.target.value)}
              className="icon-select"
              disabled={typesLoading}
              style={{ minWidth: 260 }}
            >
              <option value="">
                {typesLoading ? "Chargement…" : `Aucun défaut (fallback : ${FALLBACK_TYPE})`}
              </option>
              {eventTypes.map(t => (
                <option key={t.code} value={t.code}>{t.label} ({t.code})</option>
              ))}
            </select>
          </div>

          <hr className="divider" />

          {/* ── Buttons ── */}
          <div className="buttons-config-section">
            <div className="section-header">
              <h3>Boutons de l'Add-in</h3>
              <button type="button" className="add-btn-row" onClick={addButton}>
                + Ajouter un bouton
              </button>
            </div>

            {buttons.map((btn, index) => (
              <div key={index} className="button-row-container">
                <div className="button-row">

                  {/* Label */}
                  <div className="btn-input">
                    <label>Libellé</label>
                    <input
                      type="text" value={btn.label} required
                      onChange={e => handleButtonChange(index, "label", e.target.value)}
                    />
                  </div>

                  {/* Icon */}
                  <div className="btn-input">
                    <label>Icône</label>
                    <select
                      value={btn.icon} className="icon-select"
                      onChange={e => handleButtonChange(index, "icon", e.target.value)}
                    >
                      {ICON_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dolibarr type ── NEW ── */}
                  <div className="btn-input">
                    <label>Type Dolibarr</label>
                    <select
                      value={btn.dolibarr_type_code ?? ""}
                      className="icon-select"
                      disabled={typesLoading}
                      onChange={e => handleButtonChange(index, "dolibarr_type_code", e.target.value)}
                    >
                      <option value="">
                        {typesLoading ? "Chargement…" : "Hériter du défaut client"}
                      </option>
                      {eventTypes.map(t => (
                        <option key={t.code} value={t.code}>{t.label} ({t.code})</option>
                      ))}
                    </select>
                    {/* Cascade preview */}
                    
                  </div>

                  {/* Colors */}
                  <div className="btn-input tiny">
                    <label>Fond</label>
                    <input type="color" value={btn.bg_color}
                      onChange={e => handleButtonChange(index, "bg_color", e.target.value)} />
                  </div>
                  <div className="btn-input tiny">
                    <label>Texte</label>
                    <input type="color" value={btn.text_color}
                      onChange={e => handleButtonChange(index, "text_color", e.target.value)} />
                  </div>

                  {/* Live preview */}
                  <div className="btn-preview-mini">
                    <label>Rendu</label>
                    <div className="preview-box"
                      style={{ backgroundColor: btn.bg_color, color: btn.text_color }}>
                      <i className={btn.icon}
                        style={{ marginRight: btn.label ? "8px" : "0" }}></i>
                      <span>{btn.label || "Aperçu"}</span>
                    </div>
                  </div>

                  {buttons.length > 1 && (
                    <button type="button" className="delete-btn"
                      onClick={() => removeButton(index)}>
                      &times;
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {message && (
            <p className={`message ${message.includes("✅") ? "success" : "error"}`}>
              {message}
            </p>
          )}

          <div className="footer-actions">
            <button type="submit" className="submit-button">
              Enregistrer les modifications
            </button>
            <button type="button" className="btn-cancel" onClick={() => navigate("/clients")}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}