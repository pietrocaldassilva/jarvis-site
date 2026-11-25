(() => {
  const REPO = "pietrocaldassilva/jarvis";
  const TOKEN_KEY = "jarvis_install_token_v1";

  const osEl = document.getElementById("installOs");
  const tokenEl = document.getElementById("installToken");
  const msgEl = document.getElementById("installMsg");
  const btnDl = document.getElementById("btnDownloadPacote");
  const btnScript = document.getElementById("btnDownloadScript");
  const btnSaveTok = document.getElementById("btnSaveInstallToken");
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

  btnSaveTok?.addEventListener("click", () => {
    const t = tokenEl.value.trim();
    if (!t) {
      setMsg("Cole a chave de instalação (token GitHub).", false);
      return;
    }
    sessionStorage.setItem(TOKEN_KEY, t);
    setMsg("Chave salva só neste navegador (sessão).", true);
  });

  async function apiJson(path, token) {
    const r = await fetch(`https://api.github.com${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!r.ok) {
      const err = new Error(`GitHub HTTP ${r.status}`);
      err.status = r.status;
      throw err;
    }
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

  async function baixarPacote() {
    const token = tokenEl.value.trim();
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
      const fileRes = await fetch(asset.url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/octet-stream",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        redirect: "follow",
      });
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

      saveBlob(blob, asset.name || (plat() === "mac" ? "Jarvis-Mac.zip" : "Jarvis-Windows.zip"));
      setProgress(100, "Concluído");
      setMsg(
        plat() === "mac"
          ? "Pacote baixado. Extraia → Terminal na pasta → chmod +x iniciar.sh && ./iniciar.sh"
          : "Pacote baixado. Extraia a pasta → instalar.bat → iniciar.bat",
        true
      );
    } catch (e) {
      const st = e && e.status;
      if (st === 401 || st === 403) {
        setMsg("Chave inválida ou sem permissão no repositório privado.", false);
      } else if (st === 404) {
        setMsg("Release não encontrada. Peça ao dono para publicar o pacote.", false);
      } else {
        setMsg(
          "O navegador bloqueou o download direto. Use «Baixar instalador automático» — ele baixa e coloca o projeto na pasta Jarvis.",
          false
        );
      }
      setProgress(null);
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
$rel = Invoke-RestMethod -Headers $headers -Uri "https://api.github.com/repos/$Repo/releases/latest"
$asset = $rel.assets | Where-Object { $_.name -match 'Windows' -and $_.name -like '*.zip' } | Select-Object -First 1
if (-not $asset) { $asset = $rel.assets | Where-Object { $_.name -like '*.zip' } | Select-Object -First 1 }
if (-not $asset) { throw 'Nenhum pacote na release.' }
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
Write-Host 'Se ainda nao tiver: Python (PATH) + Node LTS + Ollama + ollama pull qwen3:4b'
Write-Host 'Depois: instalar.bat  e  iniciar.bat'
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
curl -sL -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" \\
  "https://api.github.com/repos/$REPO/releases/latest" -o "$TMP/rel.json"
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
echo "Se ainda não tiver: Python + Node + Ollama + ollama pull qwen3:4b"
echo "Depois: cd \\"$DEST\\" && ./iniciar.sh"
open "$DEST"
`;
  }

  function baixarScript() {
    const token = tokenEl.value.trim();
    if (!token) {
      setMsg("Cole a chave de instalação antes.", false);
      return;
    }
    sessionStorage.setItem(TOKEN_KEY, token);
    if (plat() === "mac") {
      saveBlob(new Blob([scriptMac(token)], { type: "text/plain" }), "instalar-jarvis.command");
      setMsg("Baixou instalar-jarvis.command — no Finder: clique com o botão direito → Abrir.", true);
    } else {
      const ps1 = scriptWindows(token);
      const bat = `@echo off\r\npowershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0instalar-jarvis.ps1"\r\nif errorlevel 1 pause\r\n`;
      // um único .ps1 é suficiente; bat wrapper opcional
      saveBlob(new Blob([ps1], { type: "text/plain" }), "instalar-jarvis.ps1");
      setTimeout(() => {
        saveBlob(new Blob([bat], { type: "application/octet-stream" }), "instalar-jarvis.bat");
      }, 400);
      setMsg("Baixou instalar-jarvis.ps1 e .bat — rode o .bat (ou clique direito no .ps1 → Executar com PowerShell). Destino: pasta Jarvis no seu usuário.", true);
    }
  }

  btnDl.addEventListener("click", baixarPacote);
  btnScript?.addEventListener("click", baixarScript);
})();
