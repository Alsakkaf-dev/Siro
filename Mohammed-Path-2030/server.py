"""Local-only static host. Keeps a stable origin for progress and YouTube embeds."""
import argparse
import functools
import http.server
from pathlib import Path
import threading
import webbrowser

ROOT = Path(__file__).resolve().parent
PAGE = '/Mohammed-Path-2030.html'

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.path = PAGE
        # Serve only public UI files; never expose workbook, progress or test profiles.
        from urllib.parse import urlsplit, unquote
        name = unquote(urlsplit(self.path).path).lstrip('/')
        if name not in {'Mohammed-Path-2030.html', 'app.css', 'app.js', 'progress-core.js'}:
            self.send_error(404)
            return
        super().do_GET()

    def do_HEAD(self):
        self.send_error(405)

    def end_headers(self):
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=54321)
    parser.add_argument('--open', action='store_true')
    args = parser.parse_args()
    url = f'http://localhost:{args.port}{PAGE}'
    try:
        server = http.server.ThreadingHTTPServer(('127.0.0.1', args.port), functools.partial(Handler, directory=str(ROOT)))
    except OSError as exc:
        if args.open:
            # A second launcher should reuse this exact app instead of failing.
            # Compare the served document so a different service is never opened.
            import urllib.request
            try:
                with urllib.request.urlopen(url, timeout=3) as response:
                    existing = response.read(2_000_000)
                if existing == (ROOT / PAGE.lstrip('/')).read_bytes():
                    webbrowser.open(url)
                    raise SystemExit(0)
            except (OSError, ValueError):
                pass
        print(f'Cannot start on port {args.port}: {exc}. Close the existing server or use --port with another port.')
        raise SystemExit(1)
    print(f'Learning workspace: {url}', flush=True)
    if args.open:
        threading.Timer(.4, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
