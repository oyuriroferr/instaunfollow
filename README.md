# InstaUnfollow

InstaUnfollow é uma extensão de navegador que compara as contas que você segue no Instagram com a lista de contas que seguem você. Ela usa o arquivo ZIP exportado pelo próprio Instagram para identificar contas que você segue e que não seguem você de volta.

A extensão não deixa de seguir contas automaticamente. Ela destaca os botões **Seguindo** na página do Instagram para ajudar você a revisar as contas manualmente.

> O projeto não é afiliado, patrocinado ou endossado pelo Instagram ou pela Meta. Algumas partes da interface podem aparecer com o nome **Curadoria de Seguindo**.

## Funcionalidades

- Importa o ZIP completo exportado pelo Instagram.
- Procura automaticamente os arquivos JSON de seguidores e de contas seguidas, incluindo arquivos de seguidores divididos em várias partes.
- Compara as listas e salva o resultado no armazenamento local da extensão.
- Exibe um painel dentro do site do Instagram, com opção de ocultar e reabrir.
- Colore os botões **Seguindo** para facilitar a revisão dos perfis.
- Inclui um importador alternativo em uma aba separada.

## Significado das cores

- **Verde:** o perfil não está na lista calculada de quem não segue você de volta; provavelmente segue você.
- **Vermelho:** o perfil está na lista calculada; não segue você de volta.
- **Amarelo:** perfil sem correspondência ou lista ainda não carregada.

As cores dependem da exportação importada. Se a relação entre as contas mudou desde que o arquivo foi gerado, os resultados podem estar desatualizados.

## Requisitos

- Computador com navegador compatível.
- Conta do Instagram acessada pelo site <https://www.instagram.com/>.
- Arquivo ZIP oficial do Instagram contendo os dados de **Seguidores e seguindo**, em formato **JSON**.
- Permissão para carregar extensões locais no navegador.

A extensão não foi desenvolvida para o aplicativo móvel do Instagram nem para navegadores móveis.

## Obter o arquivo ZIP do Instagram

1. Abra o Instagram e entre na **Central de Contas**.
2. Acesse **Suas informações e permissões**.
3. Abra a opção para exportar ou baixar suas informações.
4. Selecione o perfil do Instagram e escolha os dados de **Seguidores e seguindo**.
5. Selecione o período completo, quando essa opção estiver disponível, e escolha o formato **JSON**.
6. Solicite a exportação e baixe o ZIP quando o Instagram disponibilizá-lo.

Os nomes dos menus podem variar conforme a versão do Instagram. Mantenha o ZIP completo; não é necessário descompactá-lo antes de importá-lo na extensão.

## Baixar e extrair a extensão

Baixe o arquivo ZIP da versão desejada na seção **Releases** do GitHub e extraia seu conteúdo antes de instalar. O ZIP da extensão e o ZIP exportado pelo Instagram são arquivos diferentes:

- **ZIP da extensão:** contém os arquivos do InstaUnfollow, incluindo `manifest.json`.
- **ZIP do Instagram:** contém os dados de seguidores e contas seguidas. Esse arquivo é importado dentro do painel do InstaUnfollow e não deve ser extraído manualmente.

### Exemplo: pacote InstaUnfollow Firefox 2.7.0

Se você baixar `InstaUnfollow Firefox 2.7.0.zip`, a estrutura extraída será semelhante a esta:

```text
InstaUnfollow Firefox 2.7.0/
└── curadoria_instagram_cores/
    ├── manifest.json
    ├── popup.html
    ├── popup.js
    ├── manager.html
    ├── manager.js
    └── ... outros arquivos da extensão
```

Nesse exemplo, a pasta que deve ser usada na instalação é **`curadoria_instagram_cores`**, pois é nela que está o `manifest.json`. Não selecione a pasta superior `InstaUnfollow Firefox 2.7.0`.

## Instalação no Google Chrome

Use o pacote específico para Chrome ou para navegadores baseados em Chromium. **Não use o pacote Firefox 2.7.0**, pois ele contém a versão Gecko.

1. Baixe e extraia o ZIP da versão Chromium.
2. Dentro da pasta extraída, localize a pasta `curadoria_instagram_chrome` ou `InstaUnfollow Chrome x.x.x`.
3. Abra `chrome://extensions`.
4. Ative **Modo do desenvolvedor**.
5. Clique em **Carregar sem compactação**.
6. Selecione a pasta `curadoria_instagram_chrome` ou `InstaUnfollow Chrome x.x.x`, e não a pasta superior que a contém.
7. Abra ou atualize <https://www.instagram.com/>.
8. No painel do InstaUnfollow, selecione o ZIP original do Instagram e clique em **Processar e salvar**.

Mantenha a pasta da extensão no mesmo local. Se mover ou apagar a pasta, o navegador poderá deixar de carregar a extensão.

## Instalação no Microsoft Edge

Use o pacote específico para Chromium.

1. Baixe e extraia o ZIP da versão Chromium.
2. Abra `edge://extensions`.
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação**.
5. Selecione a pasta `curadoria_instagram_chrome` ou `InstaUnfollow Chrome x.x.x`.
6. Abra ou atualize o Instagram e importe o ZIP original pelo painel.

## Instalação no Brave

Use o pacote específico para Chromium.

1. Baixe e extraia o ZIP da versão Chromium.
2. Abra `brave://extensions`.
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação**.
5. Selecione a pasta `curadoria_instagram_chrome` ou `InstaUnfollow Chrome x.x.x`.
6. Abra ou atualize o Instagram e importe o ZIP original pelo painel.

## Instalação no Opera

Use o pacote específico para Chromium. A compatibilidade pode variar conforme a versão do Opera.

1. Baixe e extraia o ZIP da versão Chromium.
2. Abra `opera://extensions`.
3. Ative o modo de desenvolvedor, se essa opção estiver disponível.
4. Clique em **Carregar sem compactação** (*Load unpacked*).
5. Selecione a pasta `curadoria_instagram_chrome` ou `InstaUnfollow Chrome x.x.x`.
6. Abra ou atualize o Instagram e teste a importação do ZIP.

## Instalação no Vivaldi

Use o pacote específico para Chromium. A compatibilidade pode variar conforme a versão do Vivaldi.

1. Baixe e extraia o ZIP da versão Chromium.
2. Abra `vivaldi://extensions`.
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação** (*Load unpacked*).
5. Selecione a pasta `curadoria_instagram_chrome` ou `InstaUnfollow Chrome x.x.x`.
6. Abra ou atualize o Instagram e teste a importação do ZIP.

## Instalação no Mozilla Firefox

Use o pacote **`InstaUnfollow Firefox 2.7.0.zip`** disponível na seção de lançamentos do GitHub.

1. Baixe `InstaUnfollow Firefox 2.7.0.zip` e extraia o conteúdo.
2. Abra `about:debugging#/runtime/this-firefox` no Firefox.
3. Na seção **Este Firefox**, clique em **Carregar extensão temporária**.
4. Abra a pasta extraída `InstaUnfollow Firefox 2.7.0` e entre na subpasta `curadoria_instagram_cores`.
5. Selecione o arquivo **`manifest.json` dentro de `curadoria_instagram_cores`**. O caminho será semelhante a `InstaUnfollow Firefox 2.7.0/curadoria_instagram_cores/manifest.json`.
6. Abra ou atualize o Instagram com a tecla F5.
7. No painel do InstaUnfollow, selecione o ZIP original exportado pelo Instagram e clique em **Processar e salvar**.

A instalação por **Carregar extensão temporária** é provisória. Em uma instalação comum do Firefox, a extensão temporária precisa ser carregada novamente depois que o navegador reiniciar. Para distribuir uma versão permanente, a extensão precisa ser assinada pela Mozilla.

## Instalação no Zen Browser

Use o mesmo pacote Gecko destinado ao Firefox: **`InstaUnfollow Firefox 2.7.0.zip`**.

1. Baixe o ZIP e extraia o conteúdo.
2. Abra `about:debugging#/runtime/this-firefox` no Zen Browser.
3. Na seção **Este Firefox**, clique em **Carregar extensão temporária**.
4. Entre na pasta extraída `InstaUnfollow Firefox 2.7.0` e abra `curadoria_instagram_cores`.
5. Selecione o **`manifest.json` localizado dentro de `curadoria_instagram_cores`**, e não a pasta superior.
6. Abra ou atualize o Instagram e importe o ZIP original pelo painel.

A instalação temporária pode ser removida quando o navegador reiniciar. Nesse caso, carregue novamente o mesmo `manifest.json`.

## Uso

1. Abra o site do Instagram em um navegador de computador.
2. No painel do InstaUnfollow, importe o ZIP oficial contendo os dados de seguidores e seguindo.
3. Aguarde a confirmação de que o arquivo foi processado e a lista foi salva.
4. Abra seu perfil e entre na lista **Seguindo**.
5. Role a lista para que o Instagram carregue os perfis. A extensão aplica as cores aos botões identificados.
6. Use a legenda do painel para interpretar as cores. Você decide manualmente quem deixar de seguir.

Se o painel não aparecer depois da instalação, atualize a página do Instagram. Se os botões não forem coloridos, confirme que a importação foi concluída e role a lista **Seguindo** para carregar mais perfis.

## Privacidade e armazenamento

- O ZIP do Instagram é processado localmente pelo navegador; a extensão não precisa enviar o arquivo para um servidor externo.
- O resultado da comparação e as preferências do painel são guardados no armazenamento local da extensão.
- A extensão interage com o site do Instagram para identificar perfis e colorir os botões correspondentes.
- O arquivo exportado pode conter informações pessoais. Não compartilhe o ZIP do Instagram publicamente.
- A extensão não solicita a senha do Instagram, não usa uma API paga e não executa ações automáticas de deixar de seguir.

## Limitações

- A comparação reflete os dados no momento em que o Instagram gerou a exportação.
- Os perfis precisam aparecer na página para que a extensão identifique e colore os botões.
- Alterações na estrutura do Instagram podem afetar a detecção dos perfis ou a aparência do painel.
- A versão Chromium destina-se ao Chrome e a navegadores derivados do Chromium. A versão Gecko destina-se ao Firefox e ao Zen Browser. Opera e Vivaldi são compatíveis em princípio, mas não foram validados em todas as versões.
- A versão para Firefox e Zen Browser carregada temporariamente precisa ser carregada novamente após o reinício do navegador.

## Solução de problemas

**O painel não aparece**

Atualize o Instagram. Depois, confira se o InstaUnfollow está carregado e se você instalou a versão correta para o navegador.

**Não consigo encontrar o `manifest.json`**

Depois de extrair o ZIP, abra a pasta de versão. No pacote `InstaUnfollow Firefox 2.7.0.zip`, o arquivo está dentro de `InstaUnfollow Firefox 2.7.0/curadoria_instagram_cores/manifest.json`. Para carregar a extensão, selecione esse `manifest.json` no Firefox ou no Zen Browser.

**A importação do ZIP do Instagram falha**

Use o ZIP original do Instagram, não o ZIP do pacote InstaUnfollow nem um CSV. Ao solicitar a exportação para o instagram, selecione JSON e inclua os dados de seguidores e seguindo.

**A extensão não colore os botões**

Confirme que o painel mostra uma importação concluída. Abra a lista **Seguindo** e role para carregar os perfis. Se o Instagram tiver atualizado sua interface, a detecção pode precisar de ajustes.

**A lista parece incorreta**

Gere uma nova exportação no Instagram e importe o ZIP atualizado. A relação de seguimento pode mudar depois da exportação.

## Estrutura das versões

O projeto utiliza builds diferentes para Chromium e Firefox. Instale a versão correspondente ao navegador e não misture arquivos entre as pastas.

- `curadoria_instagram_chrome/`: Google Chrome e navegadores Chromium compatíveis.
- `curadoria_instagram_cores/`: Firefox e Zen Browser. No pacote de lançamento do Firefox, essa pasta fica dentro de `InstaUnfollow Firefox 2.7.0/`.

## Referências para instalação

- [Carregar uma extensão local no Chrome](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)
- [Instalar extensões localmente no Microsoft Edge](https://learn.microsoft.com/microsoft-edge/extensions-chromium/getting-started/extension-sideloading)
- [Instalação temporária de extensões no Firefox](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/)
