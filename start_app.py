#!/usr/bin/env python3
"""
Launcher script for Filigrane Privé.
Starts a lightweight local HTTP server and opens your web browser.
Zero data transmitted to the outside world.
"""

import http.server
import socket
import socketserver
import sys
import threading
import time
import webbrowser
from pathlib import Path

DEFAULT_PORT = 8080


def find_free_port(start_port=DEFAULT_PORT):
    """Finds an available port starting from start_port."""
    for port in range(start_port, start_port + 50):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    return start_port


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    """Simple HTTP request handler with clean logging."""

    def log_message(self, format, *args):
        # Keep terminal clean; uncomment if debugging
        pass


def main():
    workspace = Path(__file__).parent.resolve()
    port = find_free_port(DEFAULT_PORT)
    url = f"http://localhost:{port}/index.html"

    # Ensure working directory is the app folder
    import os
    os.chdir(workspace)

    server = socketserver.TCPServer(("127.0.0.1", port), QuietHandler)

    print("=" * 66)
    print("  Filigrane Privé — Réplique 100% Locale de Filigrane Facile")
    print("=" * 66)
    print(f" [OK] Serveur local démarré : {url}")
    print(" [OK] Ouverture automatique dans votre navigateur par défaut...")
    print()
    print(" GARANTIE DE CONFIDENTIALITÉ ABSOLUE :")
    print(" - Aucun document n'est téléversé sur un serveur distant.")
    print(" - L'ensemble des calculs a lieu dans votre navigateur.")
    print(" - Vous pouvez couper votre Wi-Fi ou passer en mode avion.")
    print("=" * 66)
    print(" Appuyez sur Ctrl+C pour quitter.")
    print("=" * 66)

    # Open browser in a separate thread after 0.5s
    def open_browser():
        time.sleep(0.5)
        webbrowser.open(url)

    threading.Thread(target=open_browser, daemon=True).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nArrêt du serveur local. Vos documents restent en sécurité sur votre machine.")
        server.server_close()


if __name__ == "__main__":
    main()
