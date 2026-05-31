import os
from django.conf import settings
from django.contrib import admin
from django.http import Http404
from django.urls import include, path, re_path
from django.views.static import serve

FRONTEND_DIR = settings.BASE_DIR.parent

def serve_frontend(request, path=""):
    # Normalize the path to prevent directory traversal and block sensitive files
    normalized_path = os.path.normpath(path).lstrip(os.path.sep)
    
    blocked_prefixes = (
        "backend",
        ".git",
        ".github",
    )
    blocked_exact = (
        ".env",
        ".env.example",
        "db.sqlite3",
        "manage.py",
        "requirements.txt",
    )
    
    parts = normalized_path.split(os.path.sep)
    if parts and (parts[0] in blocked_prefixes or parts[0] in blocked_exact):
        raise Http404("Forbidden")
        
    if not path:
        path = "index.html"
        
    try:
        return serve(request, path, document_root=FRONTEND_DIR)
    except Http404:
        alt_path = os.path.join(path, "index.html")
        try:
            return serve(request, alt_path, document_root=FRONTEND_DIR)
        except Http404:
            raise Http404("Frontend file not found")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/payment/", include("payment.urls")),
    re_path(r"^(?P<path>.*)$", serve_frontend, name="frontend"),
]

