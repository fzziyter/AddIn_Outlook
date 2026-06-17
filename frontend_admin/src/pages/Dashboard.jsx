import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BACK_URL } from "../config/config";
import "./Dashboard.css";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  BarChart
} from "recharts";
export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    recent: [],
    recentAdded: "Aucun",
    apiStatus: false
  });

  const [monthlyClients, setMonthlyClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientEvents, setClientEvents] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Appel des 4 endpoints en parallèle (ordre corrigé)
      const [clientsRes, statsRes, monthlyRes, eventsRes] = await Promise.all([
        axios.get(`${API_BACK_URL}/getClients.php`),
        axios.get(`${API_BACK_URL}/getDashboardStats.php`), // statsRes contient les totaux
        axios.get(`${API_BACK_URL}/getClientsPerMonth.php`),
        axios.get(`${API_BACK_URL}/getEventsPerClient.php`) 
      ]);

      const clientsData = Array.isArray(clientsRes.data) ? clientsRes.data : [];
      const monthlyData = monthlyRes.data.success ? monthlyRes.data.data : [];
      const eventsData = eventsRes.data.success ? eventsRes.data.data : [];

      // 2. Mise à jour de l'état
      setStats({
  total: clientsData.length,
  // Ajoutez des logs ici pour voir ce qui arrive dans la console F12
  totalEventTypes: statsRes.data?.totalEventTypes ?? 0, 
  totalButtons: statsRes.data?.totalButtons ?? 0,
  recent: clientsData.slice(0, 5),
  recentAdded: clientsData.length > 0 ? clientsData[0].domain : "Aucun",
  apiStatus: true
});

      setMonthlyClients(monthlyData);
      setClientEvents(eventsData);

    } catch (error) {
      console.error("Erreur chargement Dashboard:", error);
      setStats(prev => ({ ...prev, apiStatus: false }));
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

  if (loading) {
    return (
      <div className="loader">
        Initialisation du panel...
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Tableau de Bord</h1>
        <p>Bienvenue, voici l'état de vos intégrations Dolibarr.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-label">Total Clients</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">✨</div>
          <div className="stat-info">
            <span className="stat-label">Dernier Client</span>
            <span className="stat-value">{stats.recentAdded}</span>
          </div>
        </div>

        <div className={`stat-card ${stats.apiStatus ? "green" : "red"}`}>
          <div className="stat-icon">
    {stats.apiStatus ? "🟢" : "🔴"}
  </div>

  <div className="stat-info">
    <span className="stat-label">Status API</span>

    <span className="stat-value">
      {stats.apiStatus ? "Opérationnelle" : "Indisponible"}
    </span>
  </div>
  
</div>
<div className="stat-card purple">
  <div className="stat-icon">📅</div>
  <div className="stat-info">
    <span className="stat-label">Types d'événements</span>
    <span className="stat-value">{stats.totalEventTypes}</span>
  </div>
</div>
<div className="stat-card orange">
  <div className="stat-icon">🔘</div>
  <div className="stat-info">
    <span className="stat-label">Boutons Outlook</span>
    <span className="stat-value">{stats.totalButtons}</span>
  </div>
</div>
      </div>        

      <div className="dashboard-content">
        <div className="recent-section">
          <div className="section-header">
            <h3>Ajouts récents</h3>

            <button
              onClick={() => navigate("/clients")}
              className="view-all-btn"
            >
              Voir tout
            </button>
          </div>

          <div className="mini-table-wrapper">
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>N° Site</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {stats.recent.map(client => (
                  <tr key={client.id}>
                    <td className="client-cell">
                      <img
                        src={client.logo}
                        alt=""
                        className="tiny-logo"
                      />
                      {client.domain}
                    </td>

                    <td>{client.site_number}</td>

                    <td>
                      {new Date(
                        client.created_at
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="actions-section">
          <h3>Actions rapides</h3>

          <div className="action-buttons">
            <button
              className="action-btn primary"
              onClick={() => navigate("/add-client")}
            >
              <span>+</span>
              Nouveau Client
            </button>
            
            <button
              className="action-btn primary"
              onClick={() => navigate("/add-type-evenement")}
            >
              <span>+</span>
              Nouveau Type d'evenement 
            </button>
          </div>
        </div>
      </div>

      {/* Graphique */}
      <div className="chart-card">
        <div className="section-header">
          <h3>Évolution des clients</h3>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyClients}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month_name" />
            <YAxis 
  allowDecimals={false} // Cette ligne force l'axe à n'afficher que des entiers
  domain={[0, 'auto']}   // Optionnel : commence à 0 et ajuste le max automatiquement
/>
            <Tooltip />

            <Line
              type="monotone"
              dataKey="total"
              stroke="#2563eb"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-card">
  <h3>Nombre d'événements par client</h3>
  
  {/* Le ResponsiveContainer est indispensable pour les graphiques Recharts */}
  <ResponsiveContainer width="100%" height={300}>
    <BarChart 
      data={clientEvents} 
      margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis 
        dataKey="username" 
        angle={-45} 
        textAnchor="end" 
        interval={0} 
        fontSize={10} 
      />
      <YAxis allowDecimals={false} />
      <Tooltip />
      <Bar 
        dataKey="total_events" 
        fill="#7c3aed" 
        radius={[4, 4, 0, 0]} 
      />
    </BarChart>
  </ResponsiveContainer>
</div>
    </div>
  );
}