#!/usr/bin/env python3
import http.server
import socketserver
import urllib.request
import urllib.error
import urllib.parse
import ssl
import json
import uuid
import sys
import os

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8090
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

ACCESS_TOKEN = "APP_USR-4750157753324402-111515-b59373b1de4ab4850b4d49138de86054-154911477"
TERMINAL_ID = "NEWLAND_N950__N950NCC403258243"

ssl_context = ssl._create_unverified_context()

class AtoyacHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        # Route: /cobrar.php or /cobrar
        parsed_path = urllib.parse.urlparse(self.path).path
        if parsed_path in ("/cobrar.php", "/cobrar"):
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length).decode("utf-8")
            try:
                payload = json.loads(post_body) if post_body else {}
            except Exception:
                payload = {}

            raw_monto = payload.get("monto", "0.00")
            try:
                monto_float = float(raw_monto)
                monto_str = f"{monto_float:.2f}"
            except Exception:
                monto_str = "0.00"

            referencia = payload.get("referencia", f"ATOYAC-{uuid.uuid4().hex[:8]}")

            # Body para la API de Mercado Pago Point
            mp_data = {
                "type": "point",
                "external_reference": referencia,
                "transactions": {
                    "payments": [
                        {
                            "amount": monto_str
                        }
                    ]
                },
                "config": {
                    "point": {
                        "terminal_id": TERMINAL_ID
                    }
                }
            }

            req = urllib.request.Request(
                "https://api.mercadopago.com/v1/orders",
                data=json.dumps(mp_data).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {ACCESS_TOKEN}",
                    "Content-Type": "application/json",
                    "X-Idempotency-Key": f"atoyac_{uuid.uuid4().hex}"
                },
                method="POST"
            )

            try:
                with urllib.request.urlopen(req, timeout=15, context=ssl_context) as resp:
                    resp_data = resp.read()
                    self.send_response(resp.status)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(resp_data)
            except urllib.error.HTTPError as e:
                err_data = e.read()
                self.send_response(e.code)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(err_data)
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        else:
            super().do_POST()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/inauguracion":
            self.path = "/inauguracion.html"
        elif parsed.path in ("/administracion/whatsapp", "/administracion/whatsapp/"):
            self.path = "/administracion/whatsapp.html"

        if parsed.path in ("/consultar_orden.php", "/consultar_orden"):
            qs = urllib.parse.parse_qs(parsed.query)
            order_id = qs.get("id", [""])[0]

            if not order_id:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "ID requerido"}).encode("utf-8"))
                return

            req = urllib.request.Request(
                f"https://api.mercadopago.com/v1/orders/{urllib.parse.quote(order_id)}",
                headers={
                    "Authorization": f"Bearer {ACCESS_TOKEN}",
                    "Content-Type": "application/json"
                },
                method="GET"
            )

            try:
                with urllib.request.urlopen(req, timeout=10, context=ssl_context) as resp:
                    resp_data = resp.read()
                    self.send_response(resp.status)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(resp_data)
            except urllib.error.HTTPError as e:
                err_data = e.read()
                self.send_response(e.code)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(err_data)
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        else:
            super().do_GET()

if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), AtoyacHandler) as httpd:
        print(f"Servidor ATOYAC activo con soporte Point Smart 2 en http://localhost:{PORT}")
        httpd.serve_forever()
