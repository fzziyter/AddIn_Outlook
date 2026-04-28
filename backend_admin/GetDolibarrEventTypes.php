<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function fail(string $msg, array $extra = []): void {
    echo json_encode(array_merge(["success" => false, "error" => $msg], $extra));
    exit;
}

include "db.php";

$client_id = $_GET['client_id'] ?? null;
if (!$client_id) {
    fail("client_id manquant");
}

// ── Fetch client default uniquement (plus besoin de url/api_key) ──────────────
$stmt = $conn->prepare("SELECT default_dolibarr_type_code FROM clients WHERE id = ?");
$stmt->execute([$client_id]);
$client = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$client) {
    fail("Client introuvable");
}

// ── Lire les types depuis la DB (table globale, pas de client_id) ─────────────
$stmt  = $conn->query("SELECT code, label FROM dolibarr_event_types ORDER BY label");
$types = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    "success"        => true,
    "types"          => $types,
    "client_default" => $client['default_dolibarr_type_code'],
]);
?>