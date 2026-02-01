#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════════
#  DontDrunkText - Uninstaller
#  Rimuove l'applicazione e le sue configurazioni
#═══════════════════════════════════════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           DontDrunkText - Uninstaller                     ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${YELLOW}Attenzione: Questa operazione rimuovera':${NC}"
echo "  • Build compilata (dist/)"
echo "  • Dipendenze (node_modules/)"
echo "  • Sessione WhatsApp (data/auth/)"
echo ""
echo -e "${GREEN}NON verranno rimossi:${NC}"
echo "  • config.json (le tue impostazioni)"
echo "  • I file sorgente"
echo "  • Ollama e i suoi modelli"
echo ""

read -p "Continuare con la disinstallazione? [s/N]: " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Disinstallazione annullata."
    exit 0
fi

echo ""

# Ferma eventuali processi
echo -e "${CYAN}Arresto processi...${NC}"
pkill -f "node dist/index.js" 2>/dev/null
echo -e "${GREEN}✔${NC} Processi arrestati"

# Rimuovi build
if [ -d "$SCRIPT_DIR/dist" ]; then
    rm -rf "$SCRIPT_DIR/dist"
    echo -e "${GREEN}✔${NC} Build rimossa"
fi

# Rimuovi node_modules
if [ -d "$SCRIPT_DIR/node_modules" ]; then
    rm -rf "$SCRIPT_DIR/node_modules"
    echo -e "${GREEN}✔${NC} Dipendenze rimosse"
fi

# Rimuovi sessione WhatsApp
if [ -d "$SCRIPT_DIR/data/auth" ]; then
    read -p "Rimuovere anche la sessione WhatsApp? [s/N]: " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        rm -rf "$SCRIPT_DIR/data/auth"
        echo -e "${GREEN}✔${NC} Sessione WhatsApp rimossa"
    else
        echo -e "${YELLOW}⚠${NC} Sessione WhatsApp mantenuta"
    fi
fi

# Rimuovi dal PATH
SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_RC="$HOME/.bashrc"
fi

if [ -n "$SHELL_RC" ]; then
    if grep -q "dontdrunktext" "$SHELL_RC" 2>/dev/null; then
        # Rimuovi le righe relative a dontdrunktext
        sed -i.bak '/DontDrunkText/d' "$SHELL_RC"
        sed -i.bak '/dontdrunktext/d' "$SHELL_RC"
        rm -f "${SHELL_RC}.bak"
        echo -e "${GREEN}✔${NC} Rimosso dal PATH"
    fi
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}              DISINSTALLAZIONE COMPLETATA                       ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Per reinstallare, esegui:"
echo -e "  ${CYAN}./install.sh${NC}"
echo ""
echo "Per rimuovere completamente (inclusi sorgenti):"
echo -e "  ${YELLOW}rm -rf $SCRIPT_DIR${NC}"
echo ""
echo "Per rimuovere Ollama:"
echo -e "  ${YELLOW}brew uninstall ollama${NC}  (macOS)"
echo -e "  ${YELLOW}sudo rm -rf /usr/local/bin/ollama${NC}  (Linux)"
echo ""
