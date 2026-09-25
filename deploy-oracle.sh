#!/bin/bash
set -e

echo "=========================================================="
echo "  CSE Demo Trading Platform - Oracle Cloud Setup Script   "
echo "=========================================================="

echo "[1/4] Updating packages and installing prerequisites..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release ufw

echo "[2/4] Installing Docker and Docker Compose..."
if ! command -v docker &> /dev/null; then
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
fi

echo "[3/4] Configuring Linux Firewall for Web Traffic (Ports 80 & 443)..."
# In Oracle Cloud Ubuntu images, iptables often has a default REJECT rule for external web ports
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT || true
sudo netfilter-persistent save 2>/dev/null || true

echo "[4/4] Building and launching CSE Demo Trading Containers..."
sudo docker compose down 2>/dev/null || true
sudo docker compose up -d --build

PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "<your-server-ip>")

echo ""
echo "=========================================================="
echo "  Deployment Complete!                                   "
echo "  Your CSE Trading Platform is live at:                  "
echo "  http://$PUBLIC_IP                                      "
echo "=========================================================="
echo ""
echo "To check live server logs, run:"
echo "  sudo docker compose logs -f"
