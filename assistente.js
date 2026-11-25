(() => {
  const root = document.getElementById("assistRoot");
  if (!root) return;

  const OVERVIEW =
    "O Jarvis é um assistente pessoal 100% local (Windows e Mac): HUD Studio com átomo, voz em português, IA pelo Ollama, análise de sites, celular remoto, jogos, modo companheiro com dicas pela tela, timers, e-mail, WhatsApp, agenda, visão da tela, slides, vídeos e opcionalmente Blender/3D. Cada PC roda sozinho — não usa o computador do dono como servidor.";

  const KB = [
    {
      keys: ["ola", "oi", "bom dia", "boa tarde", "boa noite", "ajuda", "help", "comecar", "começar", "o que voce sabe", "o que você sabe"],
      reply:
        OVERVIEW +
        " Posso falar de instalação, chaves, HUD, Sites, celular, jogos, modos, Ollama, voz, Mac/Windows e comandos. O que quer saber?",
    },
    {
      keys: ["o que e o jarvis", "o que é o jarvis", "sobre o jarvis", "o que faz", "para que serve", "descricao", "descrição", "projeto"],
      reply: OVERVIEW,
    },
    {
      keys: ["funcionalidades", "recursos", "capacidades", "lista de funcoes", "lista de funções", "o que ele faz"],
      reply:
        "Principais recursos: (1) HUD Studio + voz/texto; (2) conversa local com Ollama; (3) Sites com análise por IA; (4) celular pelo navegador; (5) briefing, agenda, e-mail, WhatsApp, clima, notícias; (6) timers/lembretes/notas/rotinas; (7) visão da tela / lição / reunião pela tela; (8) jogos locais + modo jogo com dicas; (9) impressão 3D/gestos e Blender (opcional); (10) atualização pelo app com chave. Peça um tema (ex.: «celular», «jogos», «sites»).",
    },
    {
      keys: ["como instalar", "instalar", "instalacao", "instalação", "passo a passo", "comeco", "começo", "download", "baixar"],
      reply:
        "Instalar pelo site: 1) chave do site (`jarvis-acesso`) → Desbloquear; 2) chave de instalação (token GitHub do dono); 3) Baixar pacote agora ou Instalador automático; 4) Python + Node + Ollama + `ollama pull qwen3:4b`; 5) Windows: `instalar.bat` → `iniciar.bat` · Mac: `./iniciar.sh`.",
    },
    {
      keys: ["zip", "baixar zip", "download zip", "arquivo zip", "extrair zip", "pacote", "instalador automatico", "instalador automático"],
      reply:
        "Neste site o download é com a chave de instalação: Baixar pacote (ZIP do seu SO) ou Instalador automático (script que baixa e coloca em pasta Jarvis no usuário). Depois rode `instalar.bat`/`iniciar.bat` ou `./iniciar.sh`. O código-fonte não fica público.",
    },
    {
      keys: ["chave instalacao", "chave instalação", "token github", "ghp", "github_pat", "chave de atualizacao", "chave de atualização"],
      reply:
        "Há duas chaves: (1) Chave do site `jarvis-acesso` — só libera esta página. (2) Chave de instalação/atualização — token GitHub com leitura no repo privado; usa no download aqui e depois em Configurações → Sistema → Atualizar Jarvis.",
    },
    {
      keys: ["chave", "token", "acesso", "senha do site", "desbloquear", "jarvis-acesso"],
      reply:
        "Chave do site: `jarvis-acesso` (desbloqueia o instalador). Chave de instalação: token GitHub que o dono te envia (baixa o pacote privado e atualiza o app). Sem a segunda chave o site não consegue baixar o projeto.",
    },
    {
      keys: ["windows", "win10", "win11"],
      reply:
        "Windows: Python (PATH) + Node LTS + Ollama → `ollama pull qwen3:4b` → baixe pelo site → `instalar.bat` → `iniciar.bat` (ou Jarvis.exe). Preferência de voz: Edge. Sem mic, digite na HUD.",
    },
    {
      keys: ["mac", "macos", "apple", "macbook"],
      reply:
        "Mac: Python 3.11+ + Node LTS + Ollama → `ollama pull qwen3:4b` → baixe pelo site ou use `~/Jarvis` do instalador automático → `chmod +x iniciar.sh && ./iniciar.sh`. Mesma HUD Studio do Windows. Se PyAudio falhar: `brew install portaudio`.",
    },
    {
      keys: ["abrir terminal", "como abrir o terminal", "finder", "spotlight", "terminal"],
      reply:
        "Mac: Cmd+Espaço → Terminal. Ou no Finder arraste a pasta Jarvis para o Terminal. Confira com `ls` se vê `iniciar.sh`, depois `./iniciar.sh`.",
    },
    {
      keys: ["atualizar", "update", "nova versao", "nova versão"],
      reply:
        "No app: Configurações → Sistema → colar chave GitHub → Salvar → Atualizar Jarvis. Preserva data/ e sites. Reinicie com `iniciar.bat` ou `./iniciar.sh`. O PC do dono não precisa estar ligado.",
    },
    {
      keys: ["ollama", "modelo", "ia", "qwen", "inteligencia", "inteligência artificial", "llm"],
      reply:
        "IA local via Ollama. Recomendado: `qwen3:4b` (GPU ~6 GB). Alternativas: `qwen2.5:3b` (rápido), visão de tela `qwen2.5vl:3b`. Sem Ollama a HUD abre, mas conversa e análise de sites ficam fracas. Comandos livres vão para o Ollama; ações conhecidas rodam local.",
    },
    {
      keys: ["python", "node", "nodejs", "requisito", "precisa", "dependencia", "dependência"],
      reply:
        "Requisitos: Python 3.11+, Node.js LTS, Ollama, ~8 GB RAM (16 GB melhor). Windows: Add Python to PATH. Pacotes Python entram com `instalar.bat` / `iniciar.sh` (requirements.txt).",
    },
    {
      keys: ["hud", "interface", "studio", "atomo", "átomo", "desktop", "anel"],
      reply:
        "A interface nova é a HUD Studio (átomo/órbitas, cantos, Falar, Configurações). Abre com `iniciar.bat` / `./iniciar.sh`. Também existem: clássica (`iniciar.bat classico`), parede (`iniciar.bat wall`), só anel (`iniciar.bat anel`). Visual: aba Visual (cor, efeitos, tamanho do átomo).",
    },
    {
      keys: ["sites", "analisar site", "analisar com ia", "negocio", "negócio", "url"],
      reply:
        "HUD → Configurações → Sites: nome + URL → Adicionar → Analisar com IA. O próprio PC baixa a página e o Ollama resume (público, contato, destaques). Dados ficam em data/studio/sites.json naquele computador. Tem arremessar ao tablet/parede no mesmo aparelho.",
    },
    {
      keys: ["celular", "telefone", "mobile", "qr", "tunel", "túnel", "cloudflare"],
      reply:
        "Diga «conectar celular» ou botão CELULAR: sobe servidor local + link (Wi‑Fi ou túnel remoto). No celular abre o link com token, microfone MIC e respostas no aparelho. «status do celular», «parar servidor celular», «religar túnel» se o link cair. O Jarvis no PC precisa estar ligado.",
    },
    {
      keys: ["jogos", "joguinhos", "xadrez", "dama", "forca", "velha", "memoria", "memória"],
      reply:
        "«modo jogos» / «abrir jogos» abre a central local: xadrez, dama, velha, forca e memória (você vs Jarvis). Também «jogar xadrez», «jogo da forca», etc. Treino por voz: «aprenda a jogar», pedra/papel/tesoura, velha.",
    },
    {
      keys: ["modo jogo", "companheiro", "roblox", "steam", "valorant", "dicas do jogo", "dica agora", "estou jogando"],
      reply:
        "Modo jogo = companheiro: HUD quieta, pode abrir o app («vou jogar roblox»). Não joga por você nem burla anti-cheat. Com dicas ligadas, analisa a tela ~a cada 90s («dica agora», «dicas a cada 60 segundos», «pare as dicas»). «parei de jogar» volta ao normal.",
    },
    {
      keys: ["briefing", "agenda", "email", "e-mail", "whatsapp", "noticias", "notícias", "clima", "tempo"],
      reply:
        "Comandos do dia a dia: «briefing» (agenda+e-mails+clima+notícias+lembrete), «agenda de hoje», «ler e-mails», «abrir whatsapp» / mandar mensagem, «manchetes», «como está o tempo». Tudo local/configurado naquele PC.",
    },
    {
      keys: ["timer", "alarme", "lembrete", "pomodoro", "me lembre"],
      reply:
        "«timer de 10 minutos», «alarme às 7:30», «me lembre de beber água em 30 minutos», «pomodoro 25». Liste com «listar timers»; cancele pelo número. Timers avisam mesmo em modos quietos.",
    },
    {
      keys: ["modo foco", "modo cinema", "modo apresentacao", "modo apresentação", "privacidade", "persona"],
      reply:
        "Modos: foco (toasts quietos), apresentação, cinema, jogo, normal. «não me interrompa até às 14». Personas: casa / reunião / lab. «modo privacidade» evita ler e-mail/WhatsApp/webcam em voz alta.",
    },
    {
      keys: ["visao", "visão", "tela", "explique esta tela", "licao", "lição", "reuniao", "reunião", "ocr"],
      reply:
        "Visão local: «explique esta tela», «o que tem na minha tela», «responda a questão na tela» (lição). Reunião: «anote a reunião» (mic) ou «resuma a reunião» (pela tela) — sem entrar no Meet. Precisa do modelo de visão no Ollama (ex.: qwen2.5vl:3b).",
    },
    {
      keys: ["voz", "microfone", "nao ouve", "não ouve", "falar", "tts", "edge"],
      reply:
        "Voz padrão: Edge neural (pt-BR). Segure Falar ou diga Jarvis + comando. Prefira Edge na HUD. Sem mic, digite. «pare de falar» / CALAR interrompe. Voz clonada XTTS é opcional (VOZ_JARVIS.md). Face lock: voz só com seu rosto cadastrado.",
    },
    {
      keys: ["rosto", "facial", "reconhecimento facial", "webcam"],
      reply:
        "«cadastrar meu rosto», «só com meu rosto» trava a voz à webcam (local). Digitar na HUD ou celular com token não exige rosto. Se falhar, há senha de emergência documentada no projeto.",
    },
    {
      keys: ["blender", "3d", "modelo 3d", "gestos", "impressao", "impressão"],
      reply:
        "Opcional: Blender + requirements-3d. «crie um …» gera objetos; gestos na câmera movem/escalam. Painel de impressão 3D e gestos na HUD (Mídia). Não é obrigatório para o uso diário.",
    },
    {
      keys: ["slides", "video", "vídeo", "imagem", "tablet", "parede"],
      reply:
        "«cria slides sobre …», «gera uma imagem de …», vídeos locais (tools). Parede Studio e tablet no mesmo PC (localhost). Sites/mídia podem ir para o tablet pela HUD.",
    },
    {
      keys: ["rotina", "layout", "notas", "lista", "gastos", "backup", "snippet"],
      reply:
        "Produtividade: rotinas («crie a rotina expediente: …»), layouts de janelas, notas, lista de tarefas, gastos («gastei 45 no almoço»), backup diário, snippets, favoritos, ditado, exportar preferências.",
    },
    {
      keys: ["comandos", "o que eu falo", "exemplos", "diga jarvis"],
      reply:
        "Diga «Jarvis» + comando, ou digite na HUD. Exemplos: «que horas são», «briefing», «abrir chrome», «timer de 5 minutos», «modo jogos», «conectar celular», «explique esta tela», «ajuda». Frases sem comando vão para o Ollama. Lista completa no app (COMANDOS) e no repositório privado.",
    },
    {
      keys: ["local", "privacidade", "servidor", "rede", "offline", "dono"],
      reply:
        "Tudo roda no seu PC/Mac. O Studio escuta 127.0.0.1 por padrão. Celular remoto usa túnel opcional do seu PC. O site só entrega o pacote com chave; o dono não precisa ficar online depois.",
    },
    {
      keys: ["erro", "nao abre", "não abre", "falhou", "travou", "venv", "pip", "antivirus", "antivírus"],
      reply:
        "Checklist: Python no PATH? Node instalado? Ollama aberto e `ollama list` mostra o modelo? Pasta certa com iniciar.bat/sh? Rode instalar.bat de novo. Mac: leia o Terminal. Antivírus pode bloquear pip — libere a pasta Jarvis. «status das integrações» no app ajuda a diagnosticar.",
    },
    {
      keys: ["codigo", "código", "fonte", "github", "privado", "404"],
      reply:
        "Código no GitHub privado. Site instalador: https://pietrocaldassilva.github.io/jarvis-site/ — `…/jarvis/` dá 404 de propósito. Download só com chave autorizada.",
    },
    {
      keys: ["especificacao", "especificação", "ram", "gpu", "rtx", "requisitos minimos", "requisitos mínimos"],
      reply:
        "Mínimo: Win10/11 ou macOS 12+, Python 3.11, Node 18+, 8 GB RAM, Ollama. Recomendado: 16 GB RAM, GPU (ex. RTX 2060 6 GB) com qwen3:4b. Visão e 3D pedem mais VRAM/CPU.",
    },
  ];

  const chips = [
    ["O que é?", "o que é o jarvis"],
    ["Instalar", "como instalar"],
    ["Recursos", "funcionalidades"],
    ["HUD", "hud"],
    ["Sites", "sites"],
    ["Celular", "celular"],
    ["Jogos", "jogos"],
    ["Modo jogo", "modo jogo"],
    ["Comandos", "comandos"],
    ["Ollama", "ollama"],
    ["Windows", "windows"],
    ["Mac", "mac"],
    ["Erro", "erro"],
  ];

  function norm(t) {
    return String(t || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9%\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function scoreItem(n, item) {
    let s = 0;
    const words = n.split(" ").filter((w) => w.length > 2);
    for (const k of item.keys) {
      const nk = norm(k);
      if (!nk) continue;
      if (n === nk) s += 80 + nk.length;
      else if (n.includes(nk)) s += 40 + nk.length;
      else {
        const kw = nk.split(" ").filter(Boolean);
        let hit = 0;
        for (const w of kw) if (words.includes(w) || n.includes(w)) hit += 1;
        if (hit && hit === kw.length) s += 25 + hit * 4;
        else if (hit) s += hit * 6;
      }
    }
    return s;
  }

  function answer(q) {
    const n = norm(q);
    if (!n) return "Pergunte sobre instalação, HUD, Sites, celular, jogos, Ollama, Mac/Windows…";
    let best = null;
    let bestScore = 0;
    const seconds = [];
    for (const item of KB) {
      const s = scoreItem(n, item);
      if (s > bestScore) {
        if (bestScore > 12) seconds.push(best);
        bestScore = s;
        best = item;
      } else if (s > 18) {
        seconds.push(item);
      }
    }
    if (best && bestScore >= 12) {
      let out = best.reply;
      const extra = seconds.find((x) => x && x !== best && scoreItem(n, x) > 20);
      if (extra && extra.reply !== best.reply) {
        out += " Também: " + extra.reply.split(". ").slice(0, 2).join(". ") + ".";
      }
      return out;
    }
    return (
      "Ainda não acertei esse ponto. Experimente: «o que é o jarvis», «funcionalidades», «como instalar», «hud», «sites», «celular», «jogos», «modo jogo», «comandos», «ollama», «windows», «mac» ou «erro». " +
      OVERVIEW
    );
  }

  root.innerHTML = `
    <div class="assist-panel" id="assistPanel" hidden>
      <div class="assist-head">
        <div>
          <strong>Assistente Jarvis</strong>
          <span>Instalação + conhecimento do projeto</span>
        </div>
        <button type="button" class="assist-x" id="assistClose" aria-label="Fechar">×</button>
      </div>
      <div class="assist-log" id="assistLog" role="log" aria-live="polite"></div>
      <div class="assist-chips" id="assistChips"></div>
      <form class="assist-form" id="assistForm">
        <input id="assistInput" autocomplete="off" placeholder="Ex.: o que o Jarvis faz? modo jogo?" />
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
        "Olá! Sei instalar pelo site e explicar o Jarvis (HUD, Sites, celular, jogos, modos, Ollama, comandos…). Pergunte ou toque num atalho.",
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
