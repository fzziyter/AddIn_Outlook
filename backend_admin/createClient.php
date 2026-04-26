<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["success" => false, "error" => "Aucune donnée reçue"]);
    exit;
}

try {
    // 1. Préparation des données
    $hashedPassword = password_hash($data["password"], PASSWORD_DEFAULT);
    
    // Calcul du domaine si vide
    $domain = !empty($data["domain"]) ? $data["domain"] : substr(strrchr($data["email"], "@"), 1);

    // 2. Insertion du Client uniquement
    $stmtClient = $conn->prepare("
        INSERT INTO clients 
        (site_number, email, dolibarr_url, token_url, username, password, dolibarr_api_key, domain, logo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmtClient->execute([
        $data["site_number"],
        $data["email"],
        $data["dolibarr_url"],
        $data["token_url"],
        $data["username"],
        $hashedPassword,
        $data["dolibarr_api_key"],
        $domain,
        $data["logo"]
    ]);

    $clientId = $conn->lastInsertId();

    echo json_encode([
        "success" => true, 
        "message" => "Client créé avec succès",
        "client_id" => $clientId
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "error" => "Erreur de base de données",
        "details" => $e->getMessage()
    ]);
}