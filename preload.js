/* ========================================================= */
/* DOMINUS ERP - PRELOAD.JS                                  */
/* ========================================================= */
/*
    PONTE SEGURA ENTRE O FRONTEND E O PROCESSO PRINCIPAL

    Este arquivo é carregado pelo BrowserWindow no main.js.

    Ele utiliza:
        contextBridge
        ipcRenderer

    para disponibilizar funções seguras dentro de:

        window.api

    O frontend NÃO acessa diretamente recursos internos
    do Electron. Em vez disso, chama as funções expostas aqui.

    PRINCIPAIS RESPONSABILIDADES:
    1. Salvar o banco de dados
    2. Carregar o banco de dados
    3. Consultar a versão do sistema
    4. Enviar HTML para impressão
    5. Verificar atualizações
    6. Instalar atualizações
    7. Obter a versão pelo processo principal
    8. Obter a logo em Base64
*/


/* ========================================================= */
/* 01. IMPORTAÇÕES DO ELECTRON                               */
/* ========================================================= */
/*
    contextBridge:
        permite expor funções ao frontend de forma segura
        quando contextIsolation está ativado.

    ipcRenderer:
        envia solicitações do frontend para o main.js
        através dos canais IPC.
*/

const {

    contextBridge,
    ipcRenderer

} = require('electron');


/* ========================================================= */
/* 02. API EXPOSTA PARA O FRONTEND                           */
/* ========================================================= */
/*
    Tudo que estiver dentro deste objeto ficará disponível em:

        window.api

    Exemplo:

        window.api.carregarDB()
        window.api.checkUpdate()
*/

contextBridge.exposeInMainWorld(

    'api',

    {


        /* ================================================= */
        /* 02.1 BANCO DE DADOS - SALVAR                     */
        /* ================================================= */
        /*
            Envia os dados para o canal:

                salvar-db

            Esse canal é tratado no main.js.
        */

        salvarDB:(dados)=>

            ipcRenderer.invoke(

                'salvar-db',

                dados

            ),


        /* ================================================= */
        /* 02.2 BANCO DE DADOS - CARREGAR                   */
        /* ================================================= */
        /*
            Solicita ao main.js os dados armazenados
            no SQLite através do canal:

                carregar-db
        */

        carregarDB:()=>

            ipcRenderer.invoke(

                'carregar-db'

            ),


        /* ================================================= */
        /* 02.3 VERSÃO DIRETA DO PACKAGE.JSON                */
        /* ================================================= */
        /*
            Lê diretamente a propriedade "version"
            do package.json.

            Esta função já existia no preload atual
            e foi mantida sem alteração.
        */

        versaoSistema:()=>{

            return require('./package.json').version;

        },


        /* ================================================= */
        /* 02.4 IMPRESSÃO                                    */
        /* ================================================= */
        /*
            Envia o HTML pronto para o main.js.

            Canal utilizado:

                imprimir-html

            O main.js cria um arquivo temporário
            e abre a impressão pelo Chrome.
        */

        imprimirHTML:(html)=>

            ipcRenderer.invoke(

                'imprimir-html',

                html

            ),


        /* ================================================= */
        /* 02.5 VERIFICAR ATUALIZAÇÃO                        */
        /* ================================================= */
        /*
            Solicita ao processo principal que verifique
            se existe nova versão disponível.

            Canal:

                check-update
        */

        checkUpdate:()=>

            ipcRenderer.invoke(

                'check-update'

            ),


        /* ================================================= */
        /* 02.6 INSTALAR ATUALIZAÇÃO                         */
        /* ================================================= */
        /*
            Solicita o download e a instalação
            da atualização disponível.

            Canal:

                install-update
        */

        installUpdate:()=>

            ipcRenderer.invoke(

                'install-update'

            ),


        /* ================================================= */
        /* 02.7 OBTER VERSÃO PELO MAIN.JS                    */
        /* ================================================= */
        /*
            Diferente de versaoSistema(), esta função
            consulta o processo principal do Electron.

            Canal:

                get-version
        */

        getVersion:()=>

            ipcRenderer.invoke(

                'get-version'

            ),


        /* ================================================= */
        /* 02.8 OBTER LOGO DO SISTEMA                        */
        /* ================================================= */
        /*
            Solicita ao main.js a logo convertida para Base64.

            Canal:

                get-logo-path

            Essa função pode ser usada em relatórios,
            impressões ou outros conteúdos HTML.
        */

        getLogoPath:()=>

            ipcRenderer.invoke(

                'get-logo-path'

            )

    }

);
