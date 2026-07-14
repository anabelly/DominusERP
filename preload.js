const {

    contextBridge,
    ipcRenderer

} = require('electron');

contextBridge.exposeInMainWorld(

    'api',

    {

        /* ========================= */
        /* SQLITE */
        /* ========================= */

        salvarDB:(dados)=>

            ipcRenderer.invoke(

                'salvar-db',

                dados

            ),

        carregarDB:()=>

            ipcRenderer.invoke(

                'carregar-db'

            ),
             /* ========================= */
        /* VERSÃO DO SISTEMA */
        /* ========================= */

        versaoSistema:()=>{

            return require('./package.json').version;
},

        /* ========================= */
        /* IMPRESSÃO */
        /* ========================= */

        imprimirHTML:(html)=>

            ipcRenderer.invoke(

                'imprimir-html',

                html

            ),

        /* ========================= */
        /* UPDATE */
        /* ========================= */

        checkUpdate:()=>

            ipcRenderer.invoke(

                'check-update'

            ),

        installUpdate:()=>

    ipcRenderer.invoke(

        'install-update'

    ),

getVersion:()=>
    ipcRenderer.invoke(
        'get-version'
    ),

getLogoPath:()=>
    ipcRenderer.invoke(
        'get-logo-path'
    )
    }

);