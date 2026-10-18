# InstaUnfollow 3.0 · Google Chrome

Versão adaptada para Google Chrome Manifest V3. Importa o ZIP original da exportação do Instagram, compara localmente as listas de seguidores e contas seguidas e colore os botões **Seguindo** na página.

## Instalação no Google Chrome

1. Baixe e extraia `curadoria_instagram_chrome.zip` para uma pasta permanente.
2. No Chrome, abra `chrome://extensions`.
3. Ative **Modo do desenvolvedor** no canto superior direito.
4. Clique em **Carregar sem compactação** (*Load unpacked*).
5. Selecione a pasta extraída `curadoria_instagram_chrome`, aquela que contém diretamente o arquivo `manifest.json`.
6. Abra ou atualize `https://www.instagram.com/`. O painel InstaUnfollow deve aparecer no canto inferior direito.
7. Selecione o ZIP completo baixado da Central de Contas do Instagram e clique em **Processar e salvar**.

Ao usar **Carregar sem compactação**, a extensão permanece instalada entre reinicializações do Chrome enquanto a pasta não for removida ou movida. Mantenha a pasta no mesmo local.

## O que faz

- Localiza automaticamente arquivos `followers_1.json`, `followers_2.json` etc. e `following.json` no ZIP, inclusive dentro de subpastas.
- Calcula quem você segue e não segue você de volta.
- Salva o resultado em `chrome.storage.local`, para que fechar o painel ou o popup não apague a lista.
- Exibe o painel flutuante dentro do Instagram, com botão para esconder/mostrar.
- Mantém a identidade visual escura com bordas em degradê inspirado no Instagram e a legenda de cores.
- Inclui um painel alternativo para importar e administrar os dados.

## Significado das cores

- **Verde:** não está na lista calculada de quem não segue você de volta, então provavelmente segue você.
- **Vermelho:** aparece na lista calculada e não segue você de volta.
- **Amarelo:** perfil sem correspondência ou lista ainda não carregada.

As informações refletem a data em que a exportação foi criada. A extensão não deixa de seguir perfis automaticamente. Todo o processamento acontece localmente; o ZIP não é enviado para servidores externos.

## Privacidade e permissões

A extensão usa `storage` para persistir a lista, `tabs` para abrir o painel alternativo e atualizar abas do Instagram, e acesso ao domínio do Instagram para mostrar o painel e colorir os botões. O conteúdo do ZIP é processado no navegador.
