<?php
/**
 * ATOYAC - Webhook receptor para WhatsApp Cloud API (Meta)
 * Teléfono: +52 56 5896 5015
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Token de verificación configurado en Meta Developer Console
$verify_token = "ATOYAC_WHATSAPP_SECRET_2026";

// 1. Verificación inicial del Webhook o API de lectura de chats
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Si el CRM solicita la lista de chats
    if (isset($_GET['action']) && $_GET['action'] === 'get_chats') {
        $chatsFile = 'whatsapp_chats_store.json';
        if (file_exists($chatsFile)) {
            echo file_get_contents($chatsFile);
        } else {
            echo json_encode([]);
        }
        exit;
    }

    $hub_mode = $_GET['hub_mode'] ?? $_GET['hub.mode'] ?? '';
    $hub_verify_token = $_GET['hub_verify_token'] ?? $_GET['hub.verify_token'] ?? '';
    $hub_challenge = $_GET['hub_challenge'] ?? $_GET['hub.challenge'] ?? '';

    if ($hub_mode === 'subscribe' && $hub_verify_token === $verify_token) {
        http_response_code(200);
        header('Content-Type: text/plain');
        echo $hub_challenge;
        exit;
    } else {
        http_response_code(403);
        echo "Token inválido";
        exit;
    }
}

// 2. Procesamiento de Mensajes Entrantes (POST request de Meta)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    // Registro de auditoría
    file_put_contents('whatsapp_incoming.log', date('Y-m-d H:i:s') . " - " . $input . PHP_EOL, FILE_APPEND);

    // Parsear mensajes de WhatsApp Cloud API
    if (isset($data['entry'][0]['changes'][0]['value']['messages'][0])) {
        $change = $data['entry'][0]['changes'][0]['value'];
        $msgObj = $change['messages'][0];
        $contactObj = isset($change['contacts'][0]) ? $change['contacts'][0] : null;

        $fromPhone = isset($msgObj['from']) ? $msgObj['from'] : 'Desconocido';
        $contactName = isset($contactObj['profile']['name']) ? $contactObj['profile']['name'] : $fromPhone;
        $msgText = isset($msgObj['text']['body']) ? $msgObj['text']['body'] : '[Mensaje multimedia o adjunto]';
        $timestamp = isset($msgObj['timestamp']) ? intval($msgObj['timestamp']) * 1000 : time() * 1000;
        $timeStr = date('H:i', intval($timestamp / 1000));

        // Guardar en archivo JSON local de conversaciones para lectura inmediata por el CRM
        $chatsFile = 'whatsapp_chats_store.json';
        $existing = file_exists($chatsFile) ? json_decode(file_get_contents($chatsFile), true) : [];
        if (!is_array($existing)) $existing = [];

        $found = false;
        foreach ($existing as &$chat) {
            if ($chat['phone'] === $fromPhone) {
                $chat['name'] = $contactName;
                $chat['unread'] = ($chat['unread'] ?? 0) + 1;
                $chat['messages'][] = [
                    'from' => 'in',
                    'text' => $msgText,
                    'time' => $timeStr,
                    'timestamp' => $timestamp
                ];
                $found = true;
                break;
            }
        }
        if (!$found) {
            array_unshift($existing, [
                'id' => 'chat-' . $fromPhone,
                'name' => $contactName,
                'phone' => $fromPhone,
                'unread' => 1,
                'messages' => [
                    [
                        'from' => 'in',
                        'text' => $msgText,
                        'time' => $timeStr,
                        'timestamp' => $timestamp
                    ]
                ]
            ]);
        }
        file_put_contents($chatsFile, json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        // Enviar a Firebase Firestore REST (Proyecto: atoyac-kitchen)
        $firestoreUrl = "https://firestore.googleapis.com/v1/projects/atoyac-kitchen/databases/(default)/documents/atoyac_whatsapp_chats/" . urlencode($fromPhone) . "?key=AIzaSyB-og7jsZleSXKpbFUYCiHTQnQ6tXjMwy4&updateMask.fieldPaths=name&updateMask.fieldPaths=phone&updateMask.fieldPaths=lastMessage&updateMask.fieldPaths=lastTime&updateMask.fieldPaths=unread&updateMask.fieldPaths=updatedAt";
        $firestorePayload = [
            "fields" => [
                "name" => ["stringValue" => $contactName],
                "phone" => ["stringValue" => $fromPhone],
                "lastMessage" => ["stringValue" => $msgText],
                "lastTime" => ["stringValue" => $timeStr],
                "unread" => ["integerValue" => 1],
                "updatedAt" => ["integerValue" => $timestamp]
            ]
        ];

        $ch = curl_init($firestoreUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PATCH");
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($firestorePayload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 3);
        curl_exec($ch);
        curl_close($ch);
    }

    // Responder 200 OK a Meta inmediatamente
    http_response_code(200);
    echo json_encode(["status" => "received"]);
    exit;
}
?>
