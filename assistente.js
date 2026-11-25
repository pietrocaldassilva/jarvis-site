(() => {
  const root = document.getElementById("assistRoot");
  if (!root) return;

  const KB = [
    {
      keys: ["ola", "oi", "bom dia", "boa tarde", "boa noite", "ajuda", "help", "comecar", "começar"],
      reply:
        "Olá! Sou o assistente do guia Jarvis. Posso te levar na instalação (Windows ou Mac), explicar o que é a chave, Sites e atualização. O que você precisa?",
    },
    {
      keys: ["zip", "baixar zip", "download zip", "arquivo zip", "extrair zip", "pacote"],
      reply:
        "Sim — pelo site: desbloqueie → cole a chave de instalação → **Baixar pacote agora** (ou **Instalador automático**). Depois: Windows `instalar.bat` → `iniciar.bat` · Mac `./iniciar.sh`. Também precisa de Python, Node e Ollama no PC.",
    },
    {
      keys: ["como instalar", "instalar", "instalacao", "instalação", "passo a passo", "comeco", "começo", "download"],
      reply:
        "1) Chave do site para liberar o instalador. 2) Chave de instalação (token GitHub). 3) Baixar pacote ou instalador automático. 4) Python + Node + Ollama + `ollama pull qwen3:4b`. 5) `instalar.bat`/`iniciar.bat` ou `./iniciar.sh`. Quer Windows ou Mac?",
    },
    {
      keys: ["chave instalacao", "chave instalação", "token github", "ghp", "github_pat"],
      reply:
        "A chave de instalação é o token GitHub (leitura no repo privado) que o dono te envia. Cole em Download no site para baixar o pacote. Depois você pode salvar a mesma chave em Configurações → Sistema no app para atualizar.",
    },
    {
      keys: ["windows", "win", "pc"],
      reply:
        "Windows: instale Python (com PATH), Node LTS e Ollama → `ollama pull qwen3:4b` → abra a pasta do projeto → `instalar.bat` → `iniciar.bat`. A HUD sobe localmente. Sem microfone? Use o campo de texto na interface.",
    },
    {
      keys: ["mac", "macos", "apple", "terminal"],
      reply:
        "Mac: Python 3.11+, Node LTS e Ollama → no Terminal `ollama pull qwen3:4b` → entre na pasta do projeto → `chmod +x iniciar.sh && ./iniciar.sh`. Na 1ª vez ele cria o `.venv` e instala os pacotes sozinho. Dúvida de Terminal: diga «abrir terminal».",
    },
    {
      keys: ["abrir terminal", "como abrir o terminal", "finder", "spotlight"],
      reply:
        "No Mac: Spotlight (Cmd+Espaço) → digite Terminal. Ou no Finder, na pasta do Jarvis, arraste a pasta para o ícone do Terminal. Depois: `cd` até a pasta e `./iniciar.sh`.",
    },
    {
      keys: ["chave", "token", "acesso", "senha do site", "desbloquear"],
      reply:
        "Há duas chaves diferentes. **Chave do site** (`jarvis-acesso`) só destrava este guia. **Chave de atualização** (token GitHub) o dono te passa depois — cola em Configurações → Sistema no app para atualizar. Nenhuma das duas substitui receber a pasta do projeto.",
    },
    {
      keys: ["atualizar", "update", "nova versao", "nova versão"],
      reply:
        "Com o Jarvis já instalado: Configurações → Sistema → colar a chave de atualização → Salvar → **Atualizar Jarvis**. Isso atualiza o projeto no próprio PC; o dono não precisa estar online. A primeira instalação continua sendo pela pasta do projeto, não por zip deste site.",
    },
    {
      keys: ["ollama", "modelo", "ia", "qwen", "inteligencia"],
      reply:
        "O Ollama é a IA local. Instale em ollama.com, abra o app e rode `ollama pull qwen3:4b` (PC fraco: `qwen2.5:3b`). Sem Ollama o Jarvis abre, mas conversa/análise de sites ficam limitadas.",
    },
    {
      keys: ["python", "node", "nodejs", "requisito", "precisa"],
      reply:
        "Precisa: Python 3.11+, Node.js LTS e Ollama. No Windows marque Add to PATH no Python. Node: nodejs.org. Isso é na máquina onde o Jarvis vai rodar — cada PC é independente.",
    },
    {
      keys: ["sites", "pai", "analisar", "negocio", "negócio"],
      reply:
        "Na HUD → Sites: coloque nome + URL → Adicionar → **Analisar com IA**. A análise roda naquele PC/Mac (Ollama local). Não usa o computador do dono como servidor.",
    },
    {
      keys: ["microfone", "voz", "nao ouve", "não ouve", "falar"],
      reply:
        "Permita o microfone quando o navegador/HUD pedir. Preferência: Microsoft Edge. Se falhar, digite o comando na caixa de texto. No Mac, se PyAudio reclamar: `brew install portaudio` e rode `./iniciar.sh` de novo.",
    },
    {
      keys: ["erro", "nao abre", "não abre", "falhou", "travou", "venv"],
      reply:
        "Checklist: Python no PATH? Ollama aberto? Está na pasta certa do projeto? Windows: rode `instalar.bat` de novo. Mac: `./iniciar.sh` e leia a mensagem vermelha no Terminal. Antivírus às vezes bloqueia pip — libere a pasta do Jarvis.",
    },
    {
      keys: ["codigo", "código", "fonte", "github", "privado", "404"],
      reply:
        "O código é privado. O site público é só o guia: https://pietrocaldassilva.github.io/jarvis-site/ — a URL `…/jarvis/` dá 404 de propósito. Ninguém baixa o fonte anonimamente daqui.",
    },
    {
      keys: ["projeto", "pasta", "clone", "git", "receber"],
      reply:
        "«Projeto» = a pasta Jarvis com `iniciar.bat` / `iniciar.sh`, `requirements.txt`, etc. O dono te dá acesso (clone privado) ou copia essa pasta. Depois a instalação é pelos scripts — não um instalador .zip genérico deste site.",
    },
  ];

  const chips = [
    ["Como instalar?", "como instalar"],
    ["Baixar pacote", "download"],
    ["Windows", "windows"],
    ["Mac", "mac"],
    ["Chaves", "chave instalação"],
    ["Atualizar", "atualizar"],
    ["Sites", "sites"],
    ["Erro", "erro"],
  ];

  function norm(t) {
    return String(t || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function answer(q) {
    const n = norm(q);
    if (!n) return "Pergunte algo sobre instalação, Windows, Mac, chave ou Sites.";
    let best = null;
    let score = 0;
    for (const item of KB) {
      let s = 0;
      for (const k of item.keys) {
        if (n.includes(norm(k))) s += k.length;
      }
      if (s > score) {
        score = s;
        best = item;
      }
    }
    if (best && score > 0) return best.reply;
    return (
      "Não peguei esse ponto. Tente: «como instalar», «não é zip», «windows», «mac», «chave», «atualizar», «sites» ou «erro». " +
      "Lembrete: este site não instala o Jarvis — você usa a pasta do projeto e os scripts."
    );
  }

  root.innerHTML = `
    <div class="assist-panel" id="assistPanel" hidden>
      <div class="assist-head">
        <div>
          <strong>Assistente Jarvis</strong>
          <span>Guia de instalação · local neste site</span>
        </div>
        <button type="button" class="assist-x" id="assistClose" aria-label="Fechar">×</button>
      </div>
      <div class="assist-log" id="assistLog" role="log" aria-live="polite"></div>
      <div class="assist-chips" id="assistChips"></div>
      <form class="assist-form" id="assistForm">
        <input id="assistInput" autocomplete="off" placeholder="Ex.: como instalar no Mac?" />
        <button type="submit" class="btn primary">Enviar</button>
      </form>
    </div>
    <button type="button" class="assist-fab" id="assistOpen" aria-expanded="false">
      Assistente
    </button>
  `;

  const panel = root.querySelector("#assistPanel");
  const log = root.querySelector("#assistLog");
  const form = root.querySelector("#assistForm");
  const input = root.querySelector("#assistInput");
  const chipsEl = root.querySelector("#assistChips");
  const btnOpen = root.querySelector("#assistOpen");
  const btnClose = root.querySelector("#assistClose");

  function bubble(text, who) {
    const d = document.createElement("div");
    d.className = "assist-bubble " + (who === "eu" ? "eu" : "bot");
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }

  function ask(text) {
    const q = String(text || "").trim();
    if (!q) return;
    bubble(q, "eu");
    bubble(answer(q), "bot");
  }

  chips.forEach(([label, send]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.onclick = () => ask(send);
    chipsEl.appendChild(b);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = input.value;
    input.value = "";
    ask(v);
  });

  function open() {
    panel.hidden = false;
    btnOpen.setAttribute("aria-expanded", "true");
    if (!log.childElementCount) {
      bubble(
        "Olá! Este site instala o Jarvis: desbloqueie, cole a chave de instalação e baixe o pacote (ou o instalador automático). Em que posso ajudar?",
        "bot"
      );
    }
    input.focus();
  }
  function close() {
    panel.hidden = true;
    btnOpen.setAttribute("aria-expanded", "false");
  }

  btnOpen.addEventListener("click", () => (panel.hidden ? open() : close()));
  btnClose.addEventListener("click", close);
})();
