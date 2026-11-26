<?php
/**
 * ATOYAC - Webhook receptor para WhatsApp Cloud API (Meta)
 * Teléfono: +52 56 5896 5015
 */

date_default_timezone_set('America/Mexico_City');

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

// 2. Procesamiento de Mensajes Entrantes o Envío (POST request)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Si guardamos el Token de Meta desde el modal de configuración
    if (isset($_GET['action']) && $_GET['action'] === 'save_meta_token') {
        $input = file_get_contents('php://input');
        $payload = json_decode($input, true);
        $token = trim($payload['token'] ?? '');
        if (!empty($token)) {
            file_put_contents('meta_access_token.txt', $token);
        }
        echo json_encode(["success" => true, "saved" => !empty($token)]);
        exit;
    }

    // Si el CRM envía un mensaje hacia el cliente vía Meta WhatsApp Cloud API
    if (isset($_GET['action']) && $_GET['action'] === 'send_message') {
        $input = file_get_contents('php://input');
        $payload = json_decode($input, true);
        $toPhone = preg_replace('/\D/', '', $payload['to'] ?? '');
        $msgText = trim($payload['text'] ?? '');
        $token = $payload['token'] ?? '';

        if (empty($toPhone) || empty($msgText)) {
            http_response_code(400);
            echo json_encode(["error" => "Parámetros incompletos (to, text)"]);
            exit;
        }

        $tokenFile = 'meta_access_token.txt';
        if (empty($token) && file_exists($tokenFile)) {
            $token = trim(file_get_contents($tokenFile));
        }
        if (empty($token)) {
            $token = "EAAYNVZCihPpYBTJf3ICt493LNgwElmAFlxRp4VdOhMh4L43lwlzu3M1ZCUJAZBQcIZAIUZA2iiDIbpjYtIDtJ5JXkmEteZBDHzb0KZCZAvfElhlLwNg0mJmtfK5ZCzNak4d374s0i6Xm3fGfLcVVUq4yTLl8Oy5RS03EvT6HxqK17Dg9A02FlpnSTIxpWYeRDRaDVZAQZDZD";
        }

        $phoneNumberId = "1460670667130250";
        $sendSuccess = false;
        $metaResponse = null;

        if (!empty($token)) {
            $graphUrl = "https://graph.facebook.com/v21.0/{$phoneNumberId}/messages";
            $postData = [
                "messaging_product" => "whatsapp",
                "recipient_type" => "individual",
                "to" => $toPhone,
                "type" => "text",
                "text" => [
                    "preview_url" => false,
                    "body" => $msgText
                ]
            ];

            $ch = curl_init($graphUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: Bearer {$token}",
                "Content-Type: application/json"
            ]);
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            $metaResponse = json_decode($response, true);
            if ($httpCode === 200 && isset($metaResponse['messages'][0]['id'])) {
                $sendSuccess = true;
            }
        }

        // Guardar mensaje saliente en el store local para mantener sincronizado el CRM
        $chatsFile = 'whatsapp_chats_store.json';
        $existing = file_exists($chatsFile) ? json_decode(file_get_contents($chatsFile), true) : [];
        if (!is_array($existing)) $existing = [];

        $timestamp = time() * 1000;
        $timeStr = date('H:i');
        $found = false;
        foreach ($existing as &$chat) {
            $cPhone = preg_replace('/\D/', '', $chat['phone'] ?? '');
            if (substr($cPhone, -10) === substr($toPhone, -10)) {
                $chat['messages'][] = [
                    'from' => 'out',
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
                'id' => 'chat-' . $toPhone,
                'name' => $toPhone,
                'phone' => $toPhone,
                'unread' => 0,
                'messages' => [
                    [
                        'from' => 'out',
                        'text' => $msgText,
                        'time' => $timeStr,
                        'timestamp' => $timestamp
                    ]
                ]
            ]);
        }
        file_put_contents($chatsFile, json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        echo json_encode([
            "success" => $sendSuccess,
            "dispatched_to_meta" => !empty($token),
            "meta_response" => $metaResponse
        ]);
        exit;
    }

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
    }

    // Parsear actualizaciones de estado de entrega y lectura de Meta (statuses)
    if (isset($data['entry'][0]['changes'][0]['value']['statuses'][0])) {
        $statusObj = $data['entry'][0]['changes'][0]['value']['statuses'][0];
        $recipientId = preg_replace('/\D/', '', $statusObj['recipient_id'] ?? '');
        $statusType = $statusObj['status'] ?? ''; // 'sent', 'delivered', 'read'
        $wamid = $statusObj['id'] ?? '';

        if (!empty($recipientId) && !empty($statusType)) {
            $chatsFile = 'whatsapp_chats_store.json';
            $existing = file_exists($chatsFile) ? json_decode(file_get_contents($chatsFile), true) : [];
            if (is_array($existing)) {
                $changed = false;
                foreach ($existing as &$chat) {
                    $cPhone = preg_replace('/\D/', '', $chat['phone'] ?? '');
                    if (substr($cPhone, -10) === substr($recipientId, -10)) {
                        for ($i = count($chat['messages']) - 1; $i >= 0; $i--) {
                            if ($chat['messages'][$i]['from'] === 'out') {
                                if (isset($chat['messages'][$i]['wamid']) && $chat['messages'][$i]['wamid'] === $wamid) {
                                    $chat['messages'][$i]['status'] = $statusType;
                                    $changed = true;
                                    break;
                                } else if (!isset($chat['messages'][$i]['wamid'])) {
                                    $chat['messages'][$i]['status'] = $statusType;
                                    $changed = true;
                                    break;
                                }
                            }
                        }
                    }
                }
                if ($changed) {
                    file_put_contents($chatsFile, json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                }
            }
        }
    }

    // Responder 200 OK a Meta inmediatamente
    http_response_code(200);
    echo json_encode(["status" => "received"]);
    exit;
}
?>
