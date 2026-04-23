import React, { useState } from "react";
import "./Add_clients.css";
import { API_BACK_URL } from "../config/config";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
export default function AddClient() {
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
   const ICON_OPTIONS = [
  { label: "Étiquette", value: "fas fa-tag" },
  { label: "Lien", value: "fas fa-link" },
  { label: "Étoile", value: "fas fa-star" },
  { label: "Cœur", value: "fas fa-heart" },
  { label: "Check", value: "fas fa-check" },
  { label: "Info", value: "fas fa-info-circle" },
  { label: "Utilisateur", value: "fas fa-user" },
  { label: "Panier", value: "fas fa-shopping-cart" },
];

  // Alignement avec la BD : label, event_name, bg_color, text_color, icon
  const [buttons, setButtons] = useState([
    { label: "", bg_color: "#2563eb", text_color: "#ffffff", icon: "fas fa-tag" }
  ]);

  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // --- Logique des Boutons ---
  const handleButtonChange = (index, field, value) => {
    const updatedButtons = [...buttons];
    updatedButtons[index][field] = value;
    setButtons(updatedButtons);
  };

  const addButton = () => {
    setButtons([...buttons, { label: "", bg_color: "#2563eb", text_color: "#ffffff", icon: "fas fa-tag" }]);
  };

  const removeButton = (index) => {
    if (buttons.length > 1) {
      setButtons(buttons.filter((_, i) => i !== index));
    }
  };
  const updateButton = (index, field, value) => {
  // 1. On crée une copie du tableau des boutons
  const updatedButtons = [...buttons];
  
  // 2. On met à jour le champ spécifique (label, icon, bg_color, etc.)
  updatedButtons[index] = { 
    ...updatedButtons[index], 
    [field]: value 
  };
  
  // 3. On met à jour le state
  setButtons(updatedButtons);
};
// Auto-complétion du domaine basée sur l'email
useEffect(() => {
  if (form.email && form.email.includes("@")) {
    const extractedDomain =form.email.split("@")[1];
    
    // On ne met à jour que si le domaine extrait est différent de l'actuel
    // pour éviter de boucler ou d'écraser une modif manuelle immédiatement
    setForm(prev => ({
      ...prev,
      domain: extractedDomain
    }));
  }
}, [form.email]); // Se déclenche dès que 'email' change
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Le payload contient maintenant les objets boutons avec les clés exactes de la BD
    const payload = { 
      ...form, 
      buttons: buttons 
    };

    try {
      const res = await fetch(`${API_BACK_URL}/createClient.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setMessage("✅ Client et boutons configurés avec succès !");
        setForm({
          site_number: "", email: "", dolibarr_url: "", token_url: "",
          username: "", password: "", dolibarr_api_key: "", domain: "", logo: "",
        });
        setButtons([{ label: "", bg_color: "#2563eb", text_color: "#ffffff", icon: "fas fa-tag" }]);
        
        setTimeout(() => navigate("/clients"), 2000);
      } else {
        setMessage("❌ Erreur : " + (data.error || "Inconnue"));
      }
    } catch {
      setMessage("❌ Impossible de contacter le serveur.");
    }
  };

  return (
    <div className="client-wrapper">
      <div className="client-card">
        <div className="header">
          <h2>Ajouter un client</h2>
          <p>Configurez les accès et les boutons personnalisés</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section 1 : Informations Client */}
          <div className="input-grid">
            {[
              { name: "site_number", label: "N° de site", type: "text" },
              { name: "email", label: "Email Contact", type: "email" },
              { name: "dolibarr_url", label: "URL Dolibarr", type: "url" },
              { name: "token_url", label: "URL Token", type: "url" },
              { name: "username", label: "Nom d'utilisateur", type: "text" },
              { name: "password", label: "Mot de passe", type: "password" },
              { name: "dolibarr_api_key", label: "Clé API Dolibarr", type: "text" },
              { name: "domain", label: "Domaine (ex: @entreprise.com)", type: "text" },
              { name: "logo", label: "URL Logo Client", type: "url" },
            ].map(({ name, label, type }) => (
              <div className="input-group" key={name}>
                <label>{label}</label>
                <input
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}
          </div>

          <hr className="divider" />

          {/* Section 2 : Configuration des Boutons Personnalisés */}
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
                  <div className="btn-input">
                    <label>Libellé</label>
                    <input
                      type="text"
                      value={btn.label}
                      onChange={(e) => handleButtonChange(index, "label", e.target.value)}
                    />
                  </div>
                 
                  <div className="btn-input">
  <label>Icône</label>
  <select
    value={btn.icon}
    onChange={(e) => updateButton(index, "icon", e.target.value)}
    className="icon-select"
  >
    {ICON_OPTIONS.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
</div>
                  <div className="btn-input tiny">
                    <label>Fond</label>
                    <input
                      type="color"
                      value={btn.bg_color}
                      onChange={(e) => handleButtonChange(index, "bg_color", e.target.value)}
                    />
                  </div>
                  <div className="btn-input tiny">
                    <label>Texte</label>
                    <input
                      type="color"
                      value={btn.text_color}
                      onChange={(e) => handleButtonChange(index, "text_color", e.target.value)}
                    />
                  </div>

                  {/* Aperçu rapide à côté de la ligne */}
                  {/* Aperçu rapide à côté de la ligne */}
<div className="btn-preview-mini">
  <label>Rendu</label> {/* Optionnel : ajoute un petit label au dessus */}
  <div 
    className="preview-box" 
    style={{ 
      backgroundColor: btn.bg_color, 
      color: btn.text_color,
      padding: "0 10px", // Ajoute un peu d'espace sur les côtés pour le texte
      width: "auto",      // Permet à la boîte de s'élargir selon le texte
      minWidth: "40px"    // Garde une taille minimum si le label est vide
    }}
  >
    <i className={btn.icon} style={{ marginRight: btn.label ? "8px" : "0" }}></i>
    <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>{btn.label}</span>
  </div>
</div>

                  {buttons.length > 1 && (
                    <button type="button" className="delete-btn" onClick={() => removeButton(index)}>
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

          <button type="submit" className="submit-button">
            Enregistrer le client et ses boutons
          </button>
        </form>
      </div>
    </div>
  );
}