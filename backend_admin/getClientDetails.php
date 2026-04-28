<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
include "db.php";

$id = $_GET['id'] ?? null;

if (!$id) {
    echo json_encode(["success" => false, "error" => "ID manquant"]);
    exit;
}

try {
    // 1. Récupérer les infos du client
    $stmt = $conn->prepare("SELECT * FROM clients WHERE id = ?");
    $stmt->execute([$id]);
    $client = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$client) {
        echo json_encode(["success" => false, "error" => "Client introuvable"]);
        exit;
    }

    // 2. Récupérer les boutons + label du type via JOIN
    $stmtBtn = $conn->prepare("
        SELECT 
            cb.id,
            cb.label,
            cb.bg_color,
            cb.text_color,
            cb.icon,
            cb.dolibarr_type_code,
            det.label AS dolibarr_type_label
        FROM client_buttons cb
        LEFT JOIN dolibarr_event_types det ON det.code = cb.dolibarr_type_code
        WHERE cb.client_id = ?
    ");
    $stmtBtn->execute([$id]);
    $buttons = $stmtBtn->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "client"  => $client,
        "buttons" => $buttons,
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>