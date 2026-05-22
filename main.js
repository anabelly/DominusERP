const { autoUpdater } =
    require('electron-updater');
const {

    app,
    BrowserWindow,
    ipcMain

} = require('electron');

const sqlite3 =
    require('sqlite3').verbose();

const path =
    require('path');

const fs =
    require('fs');

const os =
    require('os');

const { exec } =
    require('child_process');

const express =
    require('express');

const cors =
    require('cors');

/* ========================= */
/* CONFIG UPDATE */
/* ========================= */

autoUpdater.autoDownload =
    false;

/* ========================= */
/* SQLITE */
/* ========================= */

const dataDir = path.join(

    app.getPath('userData'),

    'database'

);

/* CRIA PASTA SE NÃO EXISTIR */

if(

    !fs.existsSync(dataDir)

){

    fs.mkdirSync(

        dataDir,

        { recursive:true }

    );

}

const dbPath = path.join(

    dataDir,

    'database.db'

);

console.log(
    'Banco:',
    dbPath
);

const db = new sqlite3.Database(
    dbPath
);
const server =
    express();

server.use(
    cors()
);

server.use(
    express.json()
);

db.serialize(()=>{

    db.run(`

        CREATE TABLE IF NOT EXISTS sistema(

            id INTEGER PRIMARY KEY,

            dados TEXT

        )

    `);

});

/* ========================= */
/* API - CARREGAR DB */
/* ========================= */

server.get('/db',(req,res)=>{

    db.get(

        `SELECT dados
         FROM sistema
         WHERE id = 1`,

        [],

        (err,row)=>{

            if(err){

                console.error(err);

                return res
                    .status(500)
                    .json(err);

            }

            res.json(

                row
                    ? JSON.parse(
                        row.dados
                    )
                    : {}

            );

        }

    );

});

/* ========================= */
/* API - SALVAR DB */
/* ========================= */

server.post('/db',(req,res)=>{

    const dados =
        JSON.stringify(
            req.body
        );

    db.run(

        `

        INSERT OR REPLACE
        INTO sistema(

            id,
            dados

        )

        VALUES(

            1,
            ?

        )

        `,

        [dados],

        err=>{

            if(err){

                console.error(err);

                return res
                    .status(500)
                    .json(err);

            }

            res.json({

                ok:true

            });

        }

    );

});

/* ========================= */
/* JANELA PRINCIPAL */
/* ========================= */

function criarJanela(){

    const janela = new BrowserWindow({

        autoHideMenuBar:true,

        webPreferences:{

            preload:
                path.join(
                    __dirname,
                    'preload.js'
                ),

            contextIsolation:true,

            sandbox:false

        }

    });

    janela.maximize();

    janela.loadFile(
        'Dominus ERP.html'
    );

}

/* ========================= */
/* SALVAR DB */
/* ========================= */

ipcMain.handle(

    'salvar-db',

    async(_,dados)=>{

        return new Promise(

            (resolve,reject)=>{

                db.run(

                    `
                    INSERT OR REPLACE
                    INTO sistema(

                        id,
                        dados

                    )

                    VALUES(

                        1,
                        ?

                    )
                    `,

                    [

                        JSON.stringify(
                            dados
                        )

                    ],

                    err=>{

                        if(err){

                            reject(err);

                        }

                        else{

                            resolve(true);

                        }

                    }

                );

            }

        );

    }

);

/* ========================= */
/* CARREGAR DB */
/* ========================= */

ipcMain.handle(

    'carregar-db',

    async()=>{

        return new Promise(

            (resolve,reject)=>{

                db.get(

                    `
                    SELECT dados
                    FROM sistema
                    WHERE id=1
                    `,

                    (err,row)=>{

                        if(err){

                            reject(err);
                            return;

                        }

                        resolve(

                            row

                            ?

                            JSON.parse(
                                row.dados
                            )

                            :

                            null

                        );

                    }

                );

            }

        );

    }

);

/* ========================= */
/* IMPRESSÃO VIA CHROME */
/* ========================= */

ipcMain.handle(

    'imprimir-html',

    async(_,html)=>{

        try{

            const arquivo =

                path.join(

                    os.tmpdir(),

                    `dominus_print_${Date.now()}.html`

                );

            fs.writeFileSync(

                arquivo,

                html,

                'utf8'

            );

            exec(

                `start chrome --new-window "${arquivo}"`

            );

            return true;

        }

        catch(e){

            console.error(

                'Erro impressão:',

                e

            );

            return false;

        }

    }

);
/* ========================= */
/* AUTO UPDATE */
/* ========================= */

ipcMain.handle(

    'check-update',

    async()=>{

        try{

            console.log(
                'Verificando update...'
            );

            const resultado =

                await autoUpdater
                .checkForUpdates();

            console.log(

                'Resultado:',

                resultado
                ?.updateInfo
                ?.version

            );

            return {

                ok:true,

                update:

                    !!resultado
                    ?.updateInfo
                    ?.version,

                versao:

                    resultado
                    ?.updateInfo
                    ?.version ||

                    null

            };

        }

        catch(e){

            console.error(

                'Erro update:',

                e

            );

            return {

                ok:false,

                erro:e.message

            };

        }

    }

);

ipcMain.handle(

    'install-update',

    async()=>{

        try{

            console.log(
                'INSTALL UPDATE INICIADO'
            );

            autoUpdater.on(

                'download-progress',

                progress=>{

                    console.log(

                        'DOWNLOAD:',

                        Math.round(
                            progress.percent
                        ) + '%'

                    );

                }

            );

            autoUpdater.on(

                'update-downloaded',

                ()=>{

                    console.log(
                        'UPDATE BAIXADO'
                    );

                    autoUpdater
                        .quitAndInstall(
                            false,
                            true
                        );

                }

            );

            await autoUpdater
                .downloadUpdate();

            return {

                ok:true

            };

        }

        catch(err){

            console.error(

                'ERRO UPDATE:',

                err

            );

            return {

                ok:false,

                erro:
                    err.message

            };

        }

    }

);
/* ========================= */
/* START APP */
/* ========================= */

app.whenReady().then(()=>{
    autoUpdater.autoDownload =
    false;

    server.listen(

        3000,

        '0.0.0.0',

        ()=>{

            console.log(
                'API rodando:'
            );

            console.log(
                'http://127.0.0.1:3000'
            );

            console.log(
                'http://10.1.1.16:3000'
            );

        }

    );

    criarJanela();

});

app.on(

    'window-all-closed',

    ()=>{

        if(
            process.platform !== 'darwin'
        ){

            app.quit();

        }

    }

);

app.on(

    'activate',

    ()=>{

        if(
            BrowserWindow
            .getAllWindows()
            .length === 0
        ){

            criarJanela();

        }

    }

);