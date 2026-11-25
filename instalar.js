(() => {
  const REPO = "pietrocaldassilva/jarvis";
  const FALLBACK_TAG = "v1.0.0-studio";
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

  async function buscarRelease(token) {
    try {
      return await apiJson(`/repos/${REPO}/releases/latest`, token);
    } catch (e) {
      if (e && (e.status === 404 || e.status === 0)) {
        return await apiJson(`/repos/${REPO}/releases/tags/${FALLBACK_TAG}`, token);
      }
      throw e;
    }
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
      return "Token sem permissão. Fine-grained: repo jarvis + Contents: Read.";
    }
    if (st === 404) {
      return (
        "GitHub respondeu «não encontrado». Quase sempre é token sem acesso ao repo privado. " +
        "Fine-grained: Repository = pietrocaldassilva/jarvis, Permissions → Contents: Read. " +
        "Depois use «Instalador automático»."
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
      const rel = await buscarRelease(token);
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
      const meta = await buscarRelease(token);
      const asset = escolherAsset(meta.assets || []);
      if (!asset) {
        const err = new Error("Sem pacote");
        err.status = 404;
        throw err;
      }

      setProgress(15, `Baixando ${asset.name}…`);
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

  function escPsSingle(token) {
    return String(token).replace(/'/g, "''");
  }

  function escBashSingle(token) {
    return String(token).replace(/'/g, `'\\''`);
  }

  function scriptWindows(token) {
    const t = escPsSingle(token);
    // Híbrido .bat + PowerShell (um arquivo só). curl.exe evita bug de Authorization no redirect.
    return `@echo off
chcp 65001 >nul
setlocal
echo === Jarvis instalador ===
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-Expression ((Get-Content -LiteralPath '%~f0' -Raw -Encoding UTF8) -split '___PS___',2)[1]"
if errorlevel 1 (
  echo.
  echo [ERRO] Instalacao falhou. Token precisa de Contents: Read no repo privado jarvis.
  pause
  exit /b 1
)
echo.
echo Pronto. Abra a pasta Jarvis do seu usuario e rode instalar.bat
pause
exit /b 0
___PS___
$ErrorActionPreference = 'Stop'
$Token = '${t}'
$Repo = '${REPO}'
$Tag = '${FALLBACK_TAG}'
$Dest = Join-Path $env:USERPROFILE 'Jarvis'
$Tmp = Join-Path $env:TEMP ('jarvis-setup-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $Tmp | Out-Null
$hdr = @{
  Authorization = "Bearer $Token"
  Accept = 'application/vnd.github+json'
  'X-GitHub-Api-Version' = '2022-11-28'
}
try {
  $rel = Invoke-RestMethod -Headers $hdr -Uri "https://api.github.com/repos/$Repo/releases/latest"
} catch {
  try {
    $rel = Invoke-RestMethod -Headers $hdr -Uri "https://api.github.com/repos/$Repo/releases/tags/$Tag"
  } catch {
    throw "Nao achei a release. Confira o token (Contents: Read no repo privado jarvis). Detalhe: $_"
  }
}
$asset = $rel.assets | Where-Object { $_.name -match 'Windows' -and $_.name -like '*.zip' } | Select-Object -First 1
if (-not $asset) { $asset = $rel.assets | Where-Object { $_.name -like '*.zip' } | Select-Object -First 1 }
if (-not $asset) { throw 'Nenhum pacote ZIP na release.' }
$zip = Join-Path $Tmp 'Jarvis.zip'
Write-Host ("Baixando " + $asset.name + "...")
$curl = Get-Command curl.exe -ErrorAction SilentlyContinue
if ($curl) {
  & curl.exe -fsSL -H "Authorization: Bearer $Token" -H "Accept: application/octet-stream" -o $zip $asset.url
  if ($LASTEXITCODE -ne 0) { throw "curl falhou com codigo $LASTEXITCODE" }
} else {
  Invoke-WebRequest -Headers @{ Authorization = "Bearer $Token"; Accept = 'application/octet-stream' } -Uri $asset.url -OutFile $zip
}
if (-not (Test-Path $zip) -or ((Get-Item $zip).Length -lt 1000)) {
  throw 'Download falhou (arquivo vazio). Confira o token Contents: Read.'
}
$out = Join-Path $Tmp 'out'
Expand-Archive -Force -Path $zip -DestinationPath $out
$src = Get-ChildItem $out -Directory | Select-Object -First 1
if (-not $src) { $src = Get-Item $out }
New-Item -ItemType Directory -Force -Path $Dest | Out-Null
Copy-Item -Path (Join-Path $src.FullName '*') -Destination $Dest -Recurse -Force
Write-Host ''
Write-Host ("Projeto em " + $Dest) -ForegroundColor Green
Write-Host 'Depois: rode instalar.bat e iniciar.bat nesta pasta.'
Start-Process explorer.exe $Dest
`;
  }

  function scriptMac(token) {
    const t = escBashSingle(token);
    return `#!/bin/bash
set -euo pipefail
TOKEN='${t}'
REPO='${REPO}'
TAG='${FALLBACK_TAG}'
DEST="$HOME/Jarvis"
TMP="$(mktemp -d)"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT
echo "=== Jarvis instalador (Mac) ==="
CODE=$(curl -sS -o "$TMP/rel.json" -w "%{http_code}" -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" \\
  "https://api.github.com/repos/$REPO/releases/latest" || true)
if [ "$CODE" != "200" ]; then
  CODE=$(curl -sS -o "$TMP/rel.json" -w "%{http_code}" -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" \\
    "https://api.github.com/repos/$REPO/releases/tags/$TAG" || true)
fi
if [ "$CODE" != "200" ]; then
  echo "GitHub HTTP $CODE — token sem acesso ao repo privado ou release inexistente."
  echo "Fine-grained: repo jarvis + Contents: Read."
  exit 1
fi
export JARVIS_TMP="$TMP"
python3 - <<'PY'
import json, os, pathlib
tmp = pathlib.Path(os.environ["JARVIS_TMP"])
j = json.loads((tmp / "rel.json").read_text(encoding="utf-8"))
assets = j.get("assets") or []
pick = next((a for a in assets if str(a.get("name","")).lower().endswith(".zip") and "mac" in str(a.get("name","")).lower()), None)
if not pick:
    pick = next((a for a in assets if str(a.get("name","")).lower().endswith(".zip")), None)
if not pick:
    raise SystemExit("Sem pacote na release")
(tmp / "url.txt").write_text(pick["url"], encoding="utf-8")
(tmp / "name.txt").write_text(pick.get("name") or "Jarvis.zip", encoding="utf-8")
PY
URL=$(cat "$TMP/url.txt")
NAME=$(cat "$TMP/name.txt")
echo "Baixando $NAME..."
curl -fsSL -H "Authorization: Bearer $TOKEN" -H "Accept: application/octet-stream" "$URL" -o "$TMP/Jarvis.zip"
SIZE=$(wc -c < "$TMP/Jarvis.zip" | tr -d ' ')
if [ "\${SIZE:-0}" -lt 1000 ]; then
  echo "Download falhou (arquivo vazio). Confira o token."
  exit 1
fi
mkdir -p "$TMP/out"
unzip -q "$TMP/Jarvis.zip" -d "$TMP/out"
SRC=$(find "$TMP/out" -mindepth 1 -maxdepth 1 -type d | head -1)
[ -n "\${SRC:-}" ] || SRC="$TMP/out"
mkdir -p "$DEST"
if command -v rsync >/dev/null 2>&1; then
  rsync -a "$SRC"/ "$DEST"/
else
  cp -R "$SRC"/. "$DEST"/
fi
chmod +x "$DEST/iniciar.sh" "$DEST/iniciar.command" 2>/dev/null || true
echo
echo "Projeto em $DEST"
echo "Depois: Python + Node + Ollama, então: cd ~/Jarvis && ./iniciar.sh"
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
      setMsg(
        silencioso
          ? "Download direto falhou no navegador (normal). Baixei instalar-jarvis.command — no Finder: botão direito → Abrir."
          : "Baixou instalar-jarvis.command — Finder: botão direito → Abrir (não dê dois cliques na primeira vez).",
        true
      );
    } else {
      saveBlob(new Blob([scriptWindows(token)], { type: "application/octet-stream" }), "instalar-jarvis.bat");
      setMsg(
        silencioso
          ? "Download direto falhou no navegador (normal com repo privado). Baixei instalar-jarvis.bat — rode ele."
          : "Baixou instalar-jarvis.bat — rode o arquivo. Destino: pasta Jarvis no seu usuário.",
        true
      );
    }
  }

  btnTest?.addEventListener("click", testarChave);
  btnDl.addEventListener("click", baixarPacote);
  btnScript?.addEventListener("click", () => baixarScript(false));
})();
