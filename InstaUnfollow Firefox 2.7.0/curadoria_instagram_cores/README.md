# InstaUnfollow 2.6

Extensão experimental para Firefox e navegadores baseados no Firefox, como Zen Browser. Ela compara localmente o ZIP oficial de exportação do Instagram e colore os botões **Seguindo** na página.

## Novidades desta versão

- O seletor de arquivo ZIP agora fica visível dentro do painel do Instagram, sem input escondido em Shadow DOM, aproximando a importação do comportamento de `manager.html`, onde ela já funcionava.
- A biblioteca JSZip é procurada tanto no binding global quanto em `globalThis`/`window`, e as mensagens de erro ajudam a identificar falhas no content script.
- Há um botão **Importador alternativo** no painel que abre `manager.html` caso a importação integrada ainda falhe.

- O painel de importação aparece diretamente na página do Instagram, sem precisar clicar no ícone da extensão para importar o arquivo.
- O painel pode ser escondido pelo botão de olho riscado. Quando escondido, fica um botão flutuante com ícone de olho riscado e borda em degradê inspirado nas cores do Instagram. Clique nesse botão para reabrir o painel.
- O estado aberto/escondido é salvo no armazenamento local da extensão.
- O ZIP é lido no navegador usando a biblioteca JSZip incluída no pacote. Nenhum arquivo é enviado a servidores externos.
- A extensão procura todos os arquivos `followers_1.json`, `followers_2.json` etc. e `following.json` dentro do ZIP, inclusive em subpastas.
- A comparação é salva no armazenamento persistente da extensão. Fechar o painel ou navegar pela página não elimina a lista.

## Instalação no Zen Browser

1. Extraia o ZIP para uma pasta permanente.
2. Abra `about:debugging#/runtime/this-firefox` no Zen Browser.
3. Clique em **Carregar extensão temporária** e selecione o arquivo `manifest.json` da pasta extraída.
4. Abra ou atualize uma página do Instagram. O painel InstaUnfollow deve aparecer no canto inferior direito.
5. Clique em **Selecionar ZIP**, escolha o arquivo original baixado da Central de Contas do Instagram e depois clique em **Processar e salvar**.
6. Aguarde a mensagem de sucesso. Abra a lista **Seguindo** e role para carregar os perfis; os botões serão coloridos conforme os nomes encontrados.

A instalação temporária do `about:debugging` pode ser removida quando o navegador fecha. Nesse caso, carregue novamente o mesmo `manifest.json`. Os dados salvos podem depender de o Zen manter a instalação e os dados do perfil da extensão.

## Cores

- **Verde:** o perfil não aparece na lista calculada de quem não segue você de volta, então provavelmente segue você.
- **Vermelho:** o perfil está na lista de quem você segue, mas não segue você de volta.
- **Amarelo:** não foi possível identificar o perfil ou ainda não há lista importada.

As cores são baseadas na data da exportação do Instagram, então podem ficar desatualizadas se as relações de seguimento mudarem depois da exportação. A extensão não executa unfollow automaticamente.


## Correção 2.7.0

- Corrigida a leitura do ZIP no painel injetado no Instagram: os bytes são copiados para um `Uint8Array` do contexto da extensão, com fallback para array simples, evitando incompatibilidades entre compartimentos JavaScript do Firefox/Zen.
- O botão de importador alternativo agora envia uma mensagem ao script de background, que abre `manager.html` por meio da API `browser.tabs.create`, em vez de tentar abrir um endereço `moz-extension://` com `window.open` na página do Instagram.
