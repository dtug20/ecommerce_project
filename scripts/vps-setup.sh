#!/bin/bash
# ================================================
# Shofy VPS Initial Setup Script
# Run this ONCE on a fresh VPS with aaPanel
# Usage: ssh root@YOUR_VPS_IP 'bash -s' < scripts/vps-setup.sh
# ================================================

set -e

echo "========================================="
echo "  Shofy VPS Setup"
echo "========================================="

# ── 1. Install Docker (if not present) ──
if ! command -v docker &> /dev/null; then
    echo "[1/5] Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "  Docker installed."
else
    echo "[1/5] Docker already installed."
fi

# ── 2. Install Docker Compose plugin (if not present) ──
if ! docker compose version &> /dev/null; then
    echo "[2/5] Installing Docker Compose plugin..."
    apt-get update -qq && apt-get install -y -qq docker-compose-plugin
    echo "  Docker Compose installed."
else
    echo "[2/5] Docker Compose already installed."
fi

# ── 3. Create deploy directory ──
DEPLOY_PATH="/opt/shofy"
echo "[3/5] Setting up $DEPLOY_PATH..."

if [ ! -d "$DEPLOY_PATH/.git" ]; then
    echo "  Enter your GitHub repo URL (e.g. https://github.com/user/repo.git):"
    read -r REPO_URL
    git clone "$REPO_URL" "$DEPLOY_PATH"
else
    echo "  Repo already cloned."
fi

cd "$DEPLOY_PATH"

# ── 4. Create production .env files ──
echo "[4/5] Setting up environment files..."

if [ ! -f ".env" ]; then
    echo "  Creating root .env from example..."
    cp .env.production.example .env
    echo "  IMPORTANT: Edit /opt/shofy/.env with your production values!"
fi

if [ ! -f "backend/.env" ]; then
    echo "  Creating backend/.env from example..."
    cp backend/.env.example backend/.env
    echo "  IMPORTANT: Edit /opt/shofy/backend/.env with production values!"
fi

if [ ! -f "crm/.env" ]; then
    echo "  Creating crm/.env from example..."
    cp crm/.env.example crm/.env
    echo "  IMPORTANT: Edit /opt/shofy/crm/.env with production values!"
fi

# ── 5. Create deploy SSH key for GitHub Actions ──
echo "[5/5] Setting up SSH key for CI/CD..."

KEYFILE="/root/.ssh/shofy_deploy"
if [ ! -f "$KEYFILE" ]; then
    ssh-keygen -t ed25519 -f "$KEYFILE" -N "" -C "shofy-deploy"
    cat "$KEYFILE.pub" >> /root/.ssh/authorized_keys
    chmod 600 /root/.ssh/authorized_keys
    echo ""
    echo "========================================="
    echo "  DEPLOY KEY (add to GitHub Secrets as VPS_SSH_KEY):"
    echo "========================================="
    cat "$KEYFILE"
    echo ""
    echo "========================================="
else
    echo "  SSH key already exists."
fi

# ── Open firewall ports ──
echo ""
echo "Opening firewall ports (80, 443)..."
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo "  Ports opened via ufw."
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --permanent --add-port=443/tcp
    firewall-cmd --reload
    echo "  Ports opened via firewalld."
fi

echo ""
echo "========================================="
echo "  Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Edit /opt/shofy/.env with production passwords"
echo "  2. Edit /opt/shofy/backend/.env with production values"
echo "  3. Edit /opt/shofy/crm/.env with production values"
echo "  4. Add these GitHub Secrets in your repo settings:"
echo "     - VPS_HOST: $(curl -s ifconfig.me)"
echo "     - VPS_USER: root"
echo "     - VPS_SSH_KEY: (the private key printed above)"
echo "     - VPS_PORT: 22"
echo "  5. First deploy: cd /opt/shofy && docker compose -f docker-compose.prod.yml up -d --build"
echo "  6. After that, pushes to main will auto-deploy!"
echo ""
