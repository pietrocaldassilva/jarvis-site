# Atualizar o Jarvis (código privado)

O repositório é **privado**. O site público só mostra o guia; **não** publica o código-fonte.

## Chave do site (guia)

No site: digite `jarvis-acesso` para ver instalação/atualização.

## Chave de atualização (GitHub)

1. No GitHub → Settings → Developer settings → Fine-grained tokens.
2. Token com leitura no repo `pietrocaldassilva/jarvis` (Contents / Releases).
3. No Mac/PC do usuário: Jarvis → **Sistema** → colar token → **Salvar chave**.
4. **Atualizar Jarvis** baixa a última release ZIP (preserva `data/` e `.venv`).

## Publicar versão nova (você)

```bat
.venv\Scripts\python.exe scripts\build_release_zips.py
gh release create vX.Y.Z dist\release\Jarvis-Windows.zip dist\release\Jarvis-Mac.zip --title "Jarvis X.Y.Z" --notes "Atualização"
```

Quem tem a chave atualiza sozinho; seu PC pode estar desligado.

## Análise de sites

HUD → **Sites** → nome + URL → Adicionar → **Analisar com IA**. Continua local naquele aparelho.
