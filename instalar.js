(() => {
  const REPO = "pietrocaldassilva/jarvis";
  const TOKEN_KEY = "jarvis_install_token_v1";

  const osEl = document.getElementById("installOs");
  const tokenEl = document.getElementById("installToken");
  const msgEl = document.getElementById("installMsg");
  const btnDl = document.getElementById("btnDownloadPacote");
  const btnScript = document.getElementById("btnDownloadScript");
  const btnSaveTok = document.getElementById("btnSaveInstallToken");
  const btnTest = document.getElementById("btnTestToken");
  const progressEl = document.getElementById("installProgress");

  if (!btnDl || !tokenEl) return;

  function isMac() {
    return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || "") ||
      /Mac OS/i.test(navigator.userAgent || "");
  }

  function plat() {
    return isMac() ? "mac" : "windows";
  }

  function setMsg(t, ok) {
    if (!msgEl) return;
    msgEl.textContent = t || "";
    msgEl.className = "hint" + (ok === true ? " ok" : ok === false ? " bad" : "");
  }

  function setProgress(pct, label) {
    if (!progressEl) return;
    progressEl.hidden = pct == null;
    const fill = progressEl.querySelector(".fill");
    const lab = progressEl.querySelector(".lab");
    if (fill) fill.style.width = `${Math.max(0, Math.min(100, pct || 0))}%`;
    if (lab) lab.textContent = label || "";
  }

  if (osEl) {
    osEl.textContent = isMac()
      ? "Detectamos Mac — pacote Jarvis-Mac."
      : "Detectamos Windows — pacote Jarvis-Windows.";
  }

  const saved = sessionStorage.getItem(TOKEN_KEY);
  if (saved) tokenEl.value = saved;

  function tokenAtual() {
    return (tokenEl.value || "").trim();
  }

  btnSaveTok?.addEventListener("click", () => {
    const t = tokenAtual();
    if (!t) {
      setMsg("Cole a chave de instalação (token GitHub).", false);
      return;
    }
    sessionStorage.setItem(TOKEN_KEY, t);
    setMsg("Chave salva só neste navegador (sessão).", true);
  });

  async function apiFetch(path, token, accept) {
    let r;
    try {
      r = await fetch(`https://api.github.com${path}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: accept || "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
    } catch (e) {
      const err = new Error("rede/CORS");
      err.status = 0;
      throw err;
    }
    if (!r.ok) {
      const err = new Error(`GitHub HTTP ${r.status}`);
      err.status = r.status;
      try {
        err.body = await r.json();
      } catch (_) {}
      throw err;
    }
    return r;
  }

  async function apiJson(path, token) {
    const r = await apiFetch(path, token);
    return r.json();
  }

  function escolherAsset(assets) {
    const want = plat() === "mac" ? ["mac", "darwin", "osx"] : ["windows", "win"];
    const zips = (assets || []).filter((a) => String(a.name || "").toLowerCase().endsWith(".zip"));
    return zips.find((a) => want.some((k) => String(a.name).toLowerCase().includes(k))) || zips[0] || null;
  }

  function saveBlob(blob, nome) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function msgErroGithub(e) {
    const st = e && e.status;
    if (st === 401) {
      return "Token inválido ou expirado. Gere outro no GitHub → Settings → Developer settings → Tokens.";
    }
    if (st === 403) {
      return "Token sem permissão. No fine-grained: repo jarvis + Contents: Read (e acesso a Releases).";
    }
    if (st === 404) {
      return (
        "GitHub respondeu «não encontrado». Quase sempre é token sem acesso ao repo privado. " +
        "Fine-grained: Resource owner = você, Repository = pietrocaldassilva/jarvis, " +
        "Permissions → Contents: Read. Depois use «Instalador automático»."
      );
    }
    if (st === 0) {
      return "O navegador bloqueou a API do GitHub. Use «Instalador automático» (recomendado).";
    }
    return "Falha no GitHub. Use «Instalador automático» — ele baixa pelo PowerShell/Terminal sem CORS.";
  }

  async function testarChave() {
    const token = tokenAtual();
    if (!token) {
      setMsg("Cole o token primeiro.", false);
      return;
    }
    sessionStorage.setItem(TOKEN_KEY, token);
    setMsg("Testando token no GitHub…");
    try {
      const repo = await apiJson(`/repos/${REPO}`, token);
      const rel = await apiJson(`/repos/${REPO}/releases/latest`, token);
      const n = (rel.assets || []).length;
      setMsg(
        `OK: acesso a ${repo.full_name}. Release ${rel.tag_name} com ${n} arquivo(s). Pode baixar o instalador automático.`,
        true
      );
    } catch (e) {
      setMsg(msgErroGithub(e), false);
    }
  }

  async function baixarPacote() {
    const token = tokenAtual();
    if (!token) {
      setMsg("Cole a chave de instalação que o dono te passou.", false);
      return;
    }
    sessionStorage.setItem(TOKEN_KEY, token);
    btnDl.disabled = true;
    setProgress(5, "Consultando release…");
    setMsg("Baixando o pacote…");
    try {
      const meta = await apiJson(`/repos/${REPO}/releases/latest`, token);
      const asset = escolherAsset(meta.assets || []);
      if (!asset) {
        const err = new Error("Sem pacote");
        err.status = 404;
        throw err;
      }

      setProgress(15, `Baixando ${asset.name}…`);
      // API asset (não browser_download_url) — privado exige header.
      let fileRes;
      try {
        fileRes = await fetch(asset.url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/octet-stream",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          redirect: "follow",
        });
      } catch (_) {
        const err = new Error("cors-asset");
        err.status = 0;
        throw err;
      }
      if (!fileRes.ok) {
        const err = new Error(`Download HTTP ${fileRes.status}`);
        err.status = fileRes.status;
        throw err;
      }

      const total = Number(fileRes.headers.get("Content-Length") || 0);
      const reader = fileRes.body && fileRes.body.getReader ? fileRes.body.getReader() : null;
      let blob;
      if (reader) {
        const chunks = [];
        let received = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.byteLength;
          if (total > 0) {
            setProgress(15 + Math.round((received / total) * 80), `${asset.name} · ${Math.round((received / total) * 100)}%`);
          } else {
            setProgress(55, `${asset.name} · ${(received / 1048576).toFixed(1)} MB`);
          }
        }
        blob = new Blob(chunks, { type: "application/zip" });
      } else {
        blob = await fileRes.blob();
        setProgress(90, "Finalizando…");
      }

      // ZIP vazio/HTML de erro
      if (blob.size < 1000) {
        const err = new Error("arquivo pequeno");
        err.status = 0;
        throw err;
      }

      saveBlob(blob, asset.name || (plat() === "mac" ? "Jarvis-Mac.zip" : "Jarvis-Windows.zip"));
      setProgress(100, "Concluído");
      setMsg(
        plat() === "mac"
          ? "Pacote baixado. Extraia → Terminal na pasta → chmod +x iniciar.sh && ./iniciar.sh"
          : "Pacote baixado. Extraia a pasta → instalar.bat → iniciar.bat",
        true
      );
    } catch (e) {
      setMsg(msgErroGithub(e) + " Baixando o instalador automático…", false);
      setProgress(null);
      try {
        baixarScript(true);
      } catch (_) {}
    } finally {
      btnDl.disabled = false;
    }
  }

  function scriptWindows(token) {
    const t = token.replace(/'/g, "''");
    return `# Instalador Jarvis (Windows) — gerado pelo site
$ErrorActionPreference = 'Stop'
$Token = '${t}'
$Repo = '${REPO}'
$Dest = Join-Path $env:USERPROFILE 'Jarvis'
$Tmp = Join-Path $env:TEMP ('jarvis-setup-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $Tmp | Out-Null
Write-Host '=== Jarvis instalador ===' -ForegroundColor Cyan
$headers = @{
  Authorization = "Bearer $Token"
  Accept = 'application/vnd.github+json'
  'X-GitHub-Api-Version' = '2022-11-28'
}
try {
  $rel = Invoke-RestMethod -Headers $headers -Uri "https://api.github.com/repos/$Repo/releases/latest"
} catch {
  throw "Nao achei a release. Confira o token (Contents Read no repo privado jarvis). Detalhe: $_"
}
$asset = $rel.assets | Where-Object { $_.name -match 'Windows' -and $_.name -like '*.zip' } | Select-Object -First 1
if (-not $asset) { $asset = $rel.assets | Where-Object { $_.name -like '*.zip' } | Select-Object -First 1 }
if (-not $asset) { throw 'Nenhum pacote ZIP na release.' }
$zip = Join-Path $Tmp 'Jarvis.zip'
Write-Host ("Baixando " + $asset.name + "...")
Invoke-WebRequest -Headers @{ Authorization = "Bearer $Token"; Accept = 'application/octet-stream' } -Uri $asset.url -OutFile $zip
$out = Join-Path $Tmp 'out'
Expand-Archive -Force -Path $zip -DestinationPath $out
$src = Get-ChildItem $out -Directory | Select-Object -First 1
if (-not $src) { $src = Get-Item $out }
New-Item -ItemType Directory -Force -Path $Dest | Out-Null
Copy-Item -Path (Join-Path $src.FullName '*') -Destination $Dest -Recurse -Force
Write-Host ''
Write-Host ("Projeto em " + $Dest) -ForegroundColor Green
Write-Host 'Depois: Python+Node+Ollama, depois instalar.bat e iniciar.bat'
Start-Process explorer.exe $Dest
`;
  }

  function scriptMac(token) {
    const t = token.replace(/'/g, `'\\''`);
    return `#!/bin/bash
set -euo pipefail
TOKEN='${t}'
REPO='${REPO}'
DEST="$HOME/Jarvis"
TMP="$(mktemp -d)"
echo "=== Jarvis instalador (Mac) ==="
CODE=$(curl -sL -o "$TMP/rel.json" -w "%{http_code}" -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" \\
  "https://api.github.com/repos/$REPO/releases/latest")
if [ "$CODE" != "200" ]; then
  echo "GitHub HTTP $CODE — token sem acesso ao repo privado ou release inexistente."
  echo "Fine-grained: repo jarvis + Contents Read."
  exit 1
fi
python3 - <<PY
import json
j=json.load(open("$TMP/rel.json"))
assets=j.get("assets") or []
pick=next((a for a in assets if str(a.get("name","")).lower().endswith(".zip") and "mac" in str(a.get("name","")).lower()), None)
if not pick:
    pick=next((a for a in assets if str(a.get("name","")).lower().endswith(".zip")), None)
if not pick:
    raise SystemExit("Sem pacote na release")
open("$TMP/url.txt","w").write(pick["url"])
open("$TMP/name.txt","w").write(pick.get("name") or "Jarvis.zip")
PY
URL=$(cat "$TMP/url.txt")
NAME=$(cat "$TMP/name.txt")
echo "Baixando $NAME..."
curl -sL -H "Authorization: Bearer $TOKEN" -H "Accept: application/octet-stream" "$URL" -o "$TMP/Jarvis.zip"
mkdir -p "$TMP/out"
unzip -q "$TMP/Jarvis.zip" -d "$TMP/out"
SRC=$(find "$TMP/out" -mindepth 1 -maxdepth 1 -type d | head -1)
[ -n "\${SRC:-}" ] || SRC="$TMP/out"
mkdir -p "$DEST"
rsync -a "$SRC"/ "$DEST"/
chmod +x "$DEST/iniciar.sh" "$DEST/iniciar.command" 2>/dev/null || true
echo
echo "Projeto em $DEST"
echo "Depois: Python + Node + Ollama + ./iniciar.sh"
open "$DEST"
`;
  }

  function baixarScript(silencioso) {
    const token = tokenAtual();
    if (!token) {
      setMsg("Cole a chave de instalação antes.", false);
      return;
    }
    sessionStorage.setItem(TOKEN_KEY, token);
    if (plat() === "mac") {
      saveBlob(new Blob([scriptMac(token)], { type: "text/plain" }), "instalar-jarvis.command");
      if (!silencioso) {
        setMsg("Baixou instalar-jarvis.command — Finder: botão direito → Abrir.", true);
      } else {
        setMsg(
          "Download direto falhou no navegador (normal). Baixei instalar-jarvis.command — abra pelo Finder.",
          true
        );
      }
    } else {
      const ps1 = scriptWindows(token);
      const bat =
        "@echo off\r\n" +
        "powershell -NoProfile -ExecutionPolicy Bypass -File \"%~dp0instalar-jarvis.ps1\"\r\n" +
        "if errorlevel 1 pause\r\n";
      saveBlob(new Blob([ps1], { type: "text/plain" }), "instalar-jarvis.ps1");
      setTimeout(() => {
        saveBlob(new Blob([bat], { type: "application/octet-stream" }), "instalar-jarvis.bat");
      }, 400);
      if (!silencioso) {
        setMsg(
          "Baixou instalar-jarvis.ps1 e .bat — rode o .bat. Destino: pasta Jarvis no seu usuário.",
          true
        );
      } else {
        setMsg(
          "Download direto falhou no navegador (normal com repo privado). Baixei o instalador automático (.bat) — rode ele.",
          true
        );
      }
    }
  }

  btnTest?.addEventListener("click", testarChave);
  btnDl.addEventListener("click", baixarPacote);
  btnScript?.addEventListener("click", () => baixarScript(false));
})();
