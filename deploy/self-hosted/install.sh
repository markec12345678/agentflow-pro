#!/bin/bash

# AgentFlow Pro - Self-Hosted Installer
# One-click installation for customers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AGENTFLOW_VERSION="1.0.0"
INSTALL_DIR="${INSTALL_DIR:-/opt/agentflow-pro}"
DATA_DIR="${DATA_DIR:-/var/lib/agentflow-pro}"
DOCKER_COMPOSE_VERSION="2.20.0"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   AgentFlow Pro - Self-Hosted Installation            ║${NC}"
echo -e "${BLUE}║   Version: ${AGENTFLOW_VERSION}                                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Error: Please run as root (sudo ./install.sh)${NC}"
  exit 1
fi

# Check for Docker
check_docker() {
  if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not found. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
  else
    echo -e "${GREEN}✓ Docker is installed${NC}"
  fi

  if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose not found. Installing...${NC}"
    curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
  else
    echo -e "${GREEN}✓ Docker Compose is installed${NC}"
  fi
}

# Create directories
create_directories() {
  echo -e "${YELLOW}Creating installation directories...${NC}"
  mkdir -p "$INSTALL_DIR"
  mkdir -p "$DATA_DIR/postgres"
  mkdir -p "$DATA_DIR/redis"
  mkdir -p "$DATA_DIR/logs"
  echo -e "${GREEN}✓ Directories created${NC}"
}

# Download AgentFlow Pro
download_agentflow() {
  echo -e "${YELLOW}Downloading AgentFlow Pro ${AGENTFLOW_VERSION}...${NC}"
  
  # Create docker-compose.yml
  cat > "$INSTALL_DIR/docker-compose.yml" << 'EOF'
version: '3.8'

services:
  agentflow:
    image: agentflow-pro:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://agentflow:CHANGE_ME_PASSWORD@postgres:5432/agentflow_pro
      - REDIS_URL=redis://:CHANGE_ME_PASSWORD@redis:6379/0
      - JWT_SECRET=CHANGE_ME_SECRET
    volumes:
      - ./logs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - agentflow-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=agentflow_pro
      - POSTGRES_USER=agentflow
      - POSTGRES_PASSWORD=CHANGE_ME_PASSWORD
    volumes:
      - ../data/postgres:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - agentflow-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U agentflow"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass CHANGE_ME_PASSWORD
    volumes:
      - ../data/redis:/data
    restart: unless-stopped
    networks:
      - agentflow-network
    healthcheck:
      test: ["CMD", "redis-cli", "auth", "CHANGE_ME_PASSWORD", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
  redis_data:

networks:
  agentflow-network:
    driver: bridge
EOF

  echo -e "${GREEN}✓ Configuration created${NC}"
}

# Generate secrets
generate_secrets() {
  echo -e "${YELLOW}Generating secure secrets...${NC}"
  
  # Generate random passwords
  POSTGRES_PASSWORD=$(openssl rand -base64 32)
  REDIS_PASSWORD=$(openssl rand -base64 32)
  JWT_SECRET=$(openssl rand -base64 48)
  
  # Update docker-compose.yml with secrets
  sed -i "s/CHANGE_ME_PASSWORD/$POSTGRES_PASSWORD/g" "$INSTALL_DIR/docker-compose.yml"
  sed -i "s/CHANGE_ME_SECRET/$JWT_SECRET/g" "$INSTALL_DIR/docker-compose.yml"
  
  # Save secrets to file
  cat > "$INSTALL_DIR/.env.secrets" << EOF
# AgentFlow Pro - Secrets
# IMPORTANT: Keep this file secure!

POSTGRES_PASSWORD=$POSTGRES_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD
JWT_SECRET=$JWT_SECRET

# Generated: $(date)
EOF
  
  chmod 600 "$INSTALL_DIR/.env.secrets"
  echo -e "${GREEN}✓ Secrets generated and saved to .env.secrets${NC}"
}

# Start services
start_services() {
  echo -e "${YELLOW}Starting AgentFlow Pro services...${NC}"
  cd "$INSTALL_DIR"
  docker-compose up -d
  
  echo -e "${GREEN}✓ Services started${NC}"
}

# Show status
show_status() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║   Installation Complete!                              ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${GREEN}✓ AgentFlow Pro is installed at: ${INSTALL_DIR}${NC}"
  echo -e "${GREEN}✓ Data directory: ${DATA_DIR}${NC}"
  echo ""
  echo "Access AgentFlow Pro:"
  echo -e "  ${BLUE}http://localhost:3000${NC}"
  echo ""
  echo "Manage services:"
  echo -e "  ${YELLOW}cd $INSTALL_DIR${NC}"
  echo -e "  ${YELLOW}docker-compose ps          # Check status${NC}"
  echo -e "  ${YELLOW}docker-compose logs -f     # View logs${NC}"
  echo -e "  ${YELLOW}docker-compose stop        # Stop services${NC}"
  echo -e "  ${YELLOW}docker-compose start       # Start services${NC}"
  echo -e "  ${YELLOW}docker-compose restart     # Restart services${NC}"
  echo ""
  echo -e "${YELLOW}⚠ IMPORTANT: Save your secrets from .env.secrets${NC}"
  echo ""
}

# Main installation
main() {
  check_docker
  create_directories
  download_agentflow
  generate_secrets
  start_services
  show_status
}

# Run installation
main
