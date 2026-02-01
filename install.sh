#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════════
#  DontDrunkText - Installer Script
#  Installa automaticamente tutti i prerequisiti e configura l'applicazione
#═══════════════════════════════════════════════════════════════════════════════

set -e

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configurazione
OLLAMA_MODEL="llama3.2:3b"
MIN_NODE_VERSION=20
INSTALL_DIR="$HOME/.dontdrunktext"

#───────────────────────────────────────────────────────────────────────────────
# Funzioni di utilità
#───────────────────────────────────────────────────────────────────────────────

print_banner() {
    echo ""
    echo -e "${PURPLE}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                                                           ║${NC}"
    echo -e "${PURPLE}║${CYAN}     ____              _   ____                  _         ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${CYAN}    |  _ \\  ___  _ __ | |_|  _ \\ _ __ _   _ _ __ | | __    ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${CYAN}    | | | |/ _ \\| '_ \\| __| | | | '__| | | | '_ \\| |/ /    ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${CYAN}    | |_| | (_) | | | | |_| |_| | |  | |_| | | | |   <     ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${CYAN}    |____/ \\___/|_| |_|\\__|____/|_|   \\__,_|_| |_|_|\\_\\    ${PURPLE}║${NC}"
    echo -e "${PURPLE}║                                                           ║${NC}"
    echo -e "${PURPLE}║${YELLOW}              I N S T A L L E R   v1.0                     ${PURPLE}║${NC}"
    echo -e "${PURPLE}║                                                           ║${NC}"
    echo -e "${PURPLE}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${CYAN}▶ $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✔ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✖ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

get_os() {
    case "$(uname -s)" in
        Darwin*) echo "macos" ;;
        Linux*)  echo "linux" ;;
        MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
        *) echo "unknown" ;;
    esac
}

version_gte() {
    # Returns 0 if $1 >= $2
    [ "$(printf '%s\n' "$2" "$1" | sort -V | head -n1)" = "$2" ]
}

#───────────────────────────────────────────────────────────────────────────────
# Verifica Sistema
#───────────────────────────────────────────────────────────────────────────────

check_system() {
    print_step "Verifica Sistema"

    OS=$(get_os)
    print_info "Sistema operativo: $OS"

    if [ "$OS" = "unknown" ]; then
        print_error "Sistema operativo non supportato"
        exit 1
    fi

    if [ "$OS" = "windows" ]; then
        print_warning "Windows rilevato. Usa WSL2 per migliori risultati."
        print_info "Continuo comunque..."
    fi

    print_success "Sistema compatibile"
}

#───────────────────────────────────────────────────────────────────────────────
# Installazione Node.js
#───────────────────────────────────────────────────────────────────────────────

install_node() {
    print_step "Verifica Node.js"

    if command_exists node; then
        NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
        print_info "Node.js trovato: v$NODE_VERSION"

        if [ "$NODE_VERSION" -ge "$MIN_NODE_VERSION" ]; then
            print_success "Node.js versione OK (>= $MIN_NODE_VERSION)"
            return 0
        else
            print_warning "Node.js troppo vecchio. Versione minima: $MIN_NODE_VERSION"
        fi
    else
        print_warning "Node.js non trovato"
    fi

    print_info "Installazione Node.js..."

    OS=$(get_os)

    if [ "$OS" = "macos" ]; then
        if command_exists brew; then
            brew install node@22 || brew upgrade node
        else
            print_info "Installazione Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            brew install node@22
        fi
    elif [ "$OS" = "linux" ]; then
        # Usa NodeSource per versione recente
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi

    if command_exists node; then
        print_success "Node.js installato: $(node -v)"
    else
        print_error "Installazione Node.js fallita"
        print_info "Installa manualmente da: https://nodejs.org"
        exit 1
    fi
}

#───────────────────────────────────────────────────────────────────────────────
# Installazione Ollama
#───────────────────────────────────────────────────────────────────────────────

install_ollama() {
    print_step "Verifica Ollama"

    if command_exists ollama; then
        print_success "Ollama gia' installato: $(ollama --version 2>/dev/null || echo 'versione sconosciuta')"
    else
        print_info "Installazione Ollama..."

        OS=$(get_os)

        if [ "$OS" = "macos" ]; then
            if command_exists brew; then
                brew install ollama
            else
                curl -fsSL https://ollama.com/install.sh | sh
            fi
        else
            curl -fsSL https://ollama.com/install.sh | sh
        fi

        if command_exists ollama; then
            print_success "Ollama installato"
        else
            print_error "Installazione Ollama fallita"
            print_info "Installa manualmente da: https://ollama.com"
            exit 1
        fi
    fi
}

#───────────────────────────────────────────────────────────────────────────────
# Avvio Ollama e Download Modello
#───────────────────────────────────────────────────────────────────────────────

setup_ollama_model() {
    print_step "Setup Modello LLM"

    # Verifica se Ollama e' in esecuzione
    if ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        print_info "Avvio Ollama in background..."

        OS=$(get_os)
        if [ "$OS" = "macos" ]; then
            # Su macOS, ollama serve potrebbe essere gestito come servizio
            ollama serve >/dev/null 2>&1 &
        else
            ollama serve >/dev/null 2>&1 &
        fi

        # Attendi che Ollama sia pronto
        print_info "Attendo che Ollama sia pronto..."
        for i in {1..30}; do
            if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
                break
            fi
            sleep 1
        done
    fi

    if ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        print_error "Impossibile avviare Ollama"
        print_info "Prova ad avviarlo manualmente: ollama serve"
        exit 1
    fi

    print_success "Ollama in esecuzione"

    # Verifica se il modello e' gia' scaricato
    if ollama list 2>/dev/null | grep -q "$OLLAMA_MODEL"; then
        print_success "Modello $OLLAMA_MODEL gia' presente"
    else
        print_info "Download modello $OLLAMA_MODEL (potrebbe richiedere alcuni minuti)..."
        echo ""
        ollama pull "$OLLAMA_MODEL"
        echo ""
        print_success "Modello $OLLAMA_MODEL scaricato"
    fi
}

#───────────────────────────────────────────────────────────────────────────────
# Setup Progetto
#───────────────────────────────────────────────────────────────────────────────

setup_project() {
    print_step "Setup Progetto DontDrunkText"

    # Determina la directory del progetto
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_DIR="$SCRIPT_DIR"

    # Se lo script e' eseguito da remoto, usa la home directory
    if [ ! -f "$PROJECT_DIR/package.json" ]; then
        PROJECT_DIR="$INSTALL_DIR"

        if [ -d "$PROJECT_DIR" ]; then
            print_info "Directory esistente trovata: $PROJECT_DIR"
        else
            print_error "Directory progetto non trovata"
            print_info "Assicurati di eseguire questo script dalla directory del progetto"
            exit 1
        fi
    fi

    cd "$PROJECT_DIR"
    print_info "Directory progetto: $PROJECT_DIR"

    # Installa dipendenze
    print_info "Installazione dipendenze npm..."
    npm install --silent
    print_success "Dipendenze installate"

    # Compila TypeScript
    print_info "Compilazione progetto..."
    npm run build --silent
    print_success "Progetto compilato"

    # Crea directory data
    mkdir -p data/auth
    print_success "Directory dati create"

    # Crea config se non esiste
    if [ ! -f "config.json" ]; then
        cp config.example.json config.json
        print_success "File configurazione creato"
    else
        print_info "File configurazione esistente mantenuto"
    fi

    # Crea link simbolico per comando globale
    print_info "Creazione comando globale 'dontdrunktext'..."

    # Crea script wrapper
    WRAPPER_SCRIPT="$PROJECT_DIR/bin/dontdrunktext"
    mkdir -p "$PROJECT_DIR/bin"

    cat > "$WRAPPER_SCRIPT" << 'WRAPPER'
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

case "$1" in
    start)
        node dist/index.js
        ;;
    setup)
        node dist/cli/setup-wizard.js
        ;;
    status)
        node dist/cli/status.js
        ;;
    help|--help|-h)
        echo ""
        echo "DontDrunkText - Proteggiti dai messaggi inviati in stato alterato"
        echo ""
        echo "Comandi disponibili:"
        echo "  dontdrunktext start   - Avvia il monitoraggio"
        echo "  dontdrunktext setup   - Wizard di configurazione"
        echo "  dontdrunktext status  - Mostra stato del sistema"
        echo "  dontdrunktext help    - Mostra questo messaggio"
        echo ""
        ;;
    *)
        echo "Comando non riconosciuto: $1"
        echo "Usa 'dontdrunktext help' per la lista dei comandi"
        exit 1
        ;;
esac
WRAPPER

    chmod +x "$WRAPPER_SCRIPT"

    # Aggiungi al PATH
    SHELL_RC=""
    if [ -f "$HOME/.zshrc" ]; then
        SHELL_RC="$HOME/.zshrc"
    elif [ -f "$HOME/.bashrc" ]; then
        SHELL_RC="$HOME/.bashrc"
    elif [ -f "$HOME/.bash_profile" ]; then
        SHELL_RC="$HOME/.bash_profile"
    fi

    if [ -n "$SHELL_RC" ]; then
        PATH_LINE="export PATH=\"$PROJECT_DIR/bin:\$PATH\""
        if ! grep -q "dontdrunktext" "$SHELL_RC" 2>/dev/null; then
            echo "" >> "$SHELL_RC"
            echo "# DontDrunkText" >> "$SHELL_RC"
            echo "$PATH_LINE" >> "$SHELL_RC"
            print_success "Comando aggiunto al PATH"
        fi
    fi

    # Esporta PATH per sessione corrente
    export PATH="$PROJECT_DIR/bin:$PATH"
}

#───────────────────────────────────────────────────────────────────────────────
# Completamento
#───────────────────────────────────────────────────────────────────────────────

print_completion() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}              INSTALLAZIONE COMPLETATA CON SUCCESSO!           ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BOLD}Prossimi passi:${NC}"
    echo ""
    echo -e "  ${CYAN}1.${NC} Riavvia il terminale o esegui:"
    echo -e "     ${YELLOW}source ~/.zshrc${NC}  (o ~/.bashrc)"
    echo ""
    echo -e "  ${CYAN}2.${NC} Configura i tuoi contatti pericolosi:"
    echo -e "     ${YELLOW}dontdrunktext setup${NC}"
    echo ""
    echo -e "  ${CYAN}3.${NC} Avvia il monitoraggio:"
    echo -e "     ${YELLOW}dontdrunktext start${NC}"
    echo ""
    echo -e "${BOLD}Comandi disponibili:${NC}"
    echo -e "  ${GREEN}dontdrunktext start${NC}   - Avvia il monitoraggio"
    echo -e "  ${GREEN}dontdrunktext setup${NC}   - Wizard di configurazione"
    echo -e "  ${GREEN}dontdrunktext status${NC}  - Mostra stato del sistema"
    echo -e "  ${GREEN}dontdrunktext help${NC}    - Mostra aiuto"
    echo ""
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}Vuoi configurare ora i contatti pericolosi? (consigliato)${NC}"
    echo ""
    read -p "Avviare il wizard di configurazione? [S/n]: " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Ss]?$ ]]; then
        echo ""
        node dist/cli/setup-wizard.js
    else
        echo ""
        print_info "Puoi configurare in seguito con: dontdrunktext setup"
    fi
}

#───────────────────────────────────────────────────────────────────────────────
# Main
#───────────────────────────────────────────────────────────────────────────────

main() {
    print_banner

    echo -e "${BOLD}Questo script installera':${NC}"
    echo -e "  • Node.js (se necessario)"
    echo -e "  • Ollama (LLM locale)"
    echo -e "  • Modello $OLLAMA_MODEL"
    echo -e "  • Dipendenze del progetto"
    echo ""

    read -p "Continuare con l'installazione? [S/n]: " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Ss]?$ ]]; then
        echo "Installazione annullata."
        exit 0
    fi

    check_system
    install_node
    install_ollama
    setup_ollama_model
    setup_project
    print_completion
}

# Esegui
main "$@"
