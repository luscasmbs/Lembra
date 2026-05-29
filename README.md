# Lembra+

Aplicação web para apoio a pacientes com Alzheimer e cuidadores. O app combina lembretes, jogos cognitivos, musicoterapia guiada, rastreio de humor e painel do cuidador.

## Design v2

Interface alinhada ao protótipo `lembra-plus-v2.html`: paleta violeta, tipografia Nunito + Lora, cards com evidência científica nos jogos, navegação inferior com ícones SVG e layout responsivo (mobile, tablet e desktop).

## Rotas principais (PT-BR)

| Tela | Arquivo |
|------|---------|
| Splash | `index.html` |
| Boas-vindas | `boas-vindas.html` |
| Login paciente | `login-paciente.html` |
| Cadastro paciente | `cadastro-paciente.html` |
| Início paciente | `inicio-paciente.html` |
| Lembretes | `lembretes.html` |
| Jogos | `jogos.html` |
| Música | `musica.html` |
| Vídeos | `videos.html` |
| Perfil | `perfil-paciente.html` |
| Configurações | `configuracoes.html` |
| Painel cuidador | `painel-cuidador.html` |
| Histórico / Localização / Contatos | `historico-cuidador.html`, `localizacao-cuidador.html`, `contatos-emergencia.html` |

Arquivos `p2.html` … `p11.html` redirecionam automaticamente para os novos nomes.

## CSS

- `assets/css/global.css` — variáveis, reset, fontes
- `assets/css/components.css` — componentes compartilhados
- `assets/css/pages/*.css` — estilos por módulo/tela
- `assets/css/lembra-v2.css` — importa global + components (compatibilidade)

## Jogos cognitivos

Cada jogo inclui início, gameplay, pontuação e tela de conclusão com reforço positivo:

- Memória de pares
- Sequência luminosa
- Palavra e imagem
- Orientação no tempo
- Quebra-cabeça
- Fluência verbal
- Números simples

## Banco MySQL

Schema em `connect/schema.sql`. Inicialize com `connect/init_db.php`.

Credenciais em `connect/conexao.php` (variáveis `LEMBRA_DB_*`).

## Testes

```bash
node tests/run-static-tests.js
node --check assets/script/lembra-v2.js
```

## Entrada

Abra `index.html` ou `boas-vindas.html`.
