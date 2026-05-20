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

            )

    }

);