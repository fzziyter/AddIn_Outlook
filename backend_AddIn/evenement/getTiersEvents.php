<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

ini_set('display_errors', 0);
error_reporting(0);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include(__DIR__ . "/../../backend_admin/db.php");

$data = json_decode(file_get_contents("php://input"), true);
$socid = $data['socid'] ?? null;
$session_token = $data['session_token'] ?? null;
$show_all = $data['show_all'] ?? false; 

if (!$socid || !$session_token) {
    echo json_encode(["success" => false, "error" => "socid ou session_token manquant"]);
    exit;
}

// 1. Récupération des accès Dolibarr du client
$stmt = $conn->prepare("SELECT dolibarr_url, dolibarr_api_key FROM clients WHERE session_token = ?");
$stmt->execute([$session_token]);
$client = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$client) {
    echo json_encode(["success" => false, "error" => "Session invalide"]);
    exit;
}

$baseUrl = rtrim($client['dolibarr_url'], '/');
$apiKey = $client['dolibarr_api_key'];

// 2. Filtre de base : lié uniquement au tiers (socid) pour éviter toute erreur SQL de Dolibarr
$filters = rawurlencode("(t.fk_soc:=:" . $socid . ")");
$apiUrl = $baseUrl . "/api/index.php/agendaevents?sortfield=t.datep&sortorder=DESC&limit=100&sqlfilters=" . $filters;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "DOLAPIKEY: " . $apiKey
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $events = json_decode($response, true);
    
    if (isset($events['error'])) {
        echo json_encode(["success" => true, "events" => []]);
        exit;
    }

    $formattedEvents = [];

    // 3. Filtrage intelligent et formatage en PHP
    foreach ($events as $ev) {
        $percentage = isset($ev['percentage']) ? (int)$ev['percentage'] : 0;

        // SI la case n'est PAS cochée, on ignore les événements terminés (100%)
        if (!$show_all && $percentage >= 100) {
            continue; // On passe à l'événement suivant sans l'ajouter
        }

        // Sinon, on l'ajoute à la liste des résultats
        $formattedEvents[] = [
            "id"         => $ev['id'],
            "label"      => $ev['label'] ?? $ev['title'] ?? 'Sans titre',
            "date_event" => isset($ev['datep']) ? date('Y-m-d', $ev['datep']) : null 
        ];
    }

    echo json_encode(["success" => true, "events" => $formattedEvents]);
} else {
    echo json_encode(["success" => false, "error" => "Erreur API Dolibarr (Code: $httpCode)"]);
}