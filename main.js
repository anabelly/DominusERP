/* ========================================================= */
/* DOMINUS ERP - MAIN.JS                                     */
/* ========================================================= */
/*
    ARQUIVO PRINCIPAL DO ELECTRON / SERVIDOR LOCAL

    Este arquivo concentra a parte "de bastidores" do Dominus ERP.

    PRINCIPAIS RESPONSABILIDADES:
    1. Importar dependências do Electron e Node.js
    2. Configurar atualização automática
    3. Criar e abrir o banco SQLite
    4. Iniciar o servidor Express
    5. Disponibilizar API para carregar e salvar o banco
    6. Calcular rotas com OpenStreetMap + Nominatim + OSRM
    7. Criar a janela principal do Electron
    8. Atender chamadas IPC vindas do preload.js
    9. Abrir impressão HTML no Chrome
    10. Verificar, baixar e instalar atualizações
    11. Retornar versão e logo do sistema
    12. Iniciar e encerrar corretamente o aplicativo

    IMPORTANTE:
    A organização abaixo adiciona apenas comentários.
    A lógica original foi preservada.
*/

/* ========================================================= */
/* 01. IMPORTAÇÕES / DEPENDÊNCIAS                            */
/* ========================================================= */
/*
    electron-updater:
        atualização automática do aplicativo.

    electron:
        app            -> ciclo de vida do aplicativo
        BrowserWindow  -> janela principal
        ipcMain        -> comunicação com o frontend/preload

    sqlite3:
        banco de dados local.

    path / fs / os:
        caminhos, arquivos e diretórios do sistema operacional.

    child_process.exec:
        usado para abrir o arquivo de impressão no Chrome.

    express / cors:
        servidor HTTP local utilizado pelo ERP.
*/

const { autoUpdater } = require('electron-updater');
const { app, BrowserWindow, ipcMain } = require('electron');

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


/* ========================================================= */
/* 02. CONFIGURAÇÃO DO AUTO UPDATE                           */
/* ========================================================= */
/*
    O download automático fica desativado.

    O sistema primeiro verifica se existe atualização.
    O download só acontece quando o usuário aciona a instalação.
*/

autoUpdater.autoDownload =
    false;


/* ========================================================= */
/* 03. BANCO DE DADOS SQLITE                                 */
/* ========================================================= */
/*
    Define a pasta onde o database.db será salvo.

    A pasta fica dentro do diretório userData do Electron,
    evitando que o banco dependa da pasta de instalação.
*/

const dataDir =
    path.join(
        app.getPath('userData'),
        'database'
    );


if (
    !fs.existsSync(
        dataDir
    )
) {

    fs.mkdirSync(
        dataDir,
        {
            recursive:true
        }
    );

}


const dbPath =
    path.join(
        dataDir,
        'database.db'
    );


console.log(
    'Banco:',
    dbPath
);


const db =
    new sqlite3.Database(
        dbPath
    );


/* ========================================================= */
/* 04. SERVIDOR EXPRESS                                      */
/* ========================================================= */
/*
    Cria o servidor HTTP interno do Dominus.

    CORS:
        permite acesso à API pelo frontend.

    JSON / URLENCODED:
        limite de 50 MB para suportar o banco completo.
*/

const server =
    express();


server.use(
    cors()
);


server.use(
    express.json({
        limit:'50mb'
    })
);


server.use(
    express.urlencoded({
        extended:true,
        limit:'50mb'
    })
);


/* ========================================================= */
/* 05. ESTRUTURA DA TABELA PRINCIPAL                         */
/* ========================================================= */
/*
    O Dominus utiliza a tabela "sistema".

    id = 1:
        representa o registro principal.

    dados:
        armazena o banco do ERP serializado em JSON.
*/

db.serialize(()=>{

    db.run(`
        CREATE TABLE IF NOT EXISTS sistema(
            id INTEGER PRIMARY KEY,
            dados TEXT
        )
    `);

});


/* ========================================================= */
/* 06. API - CARREGAR BANCO                                  */
/* ========================================================= */
/*
    GET /db

    Lê o registro de id 1 da tabela "sistema"
    e devolve os dados em formato JSON para o frontend.

    Também trata banco inexistente ou JSON inválido.
*/

server.get(
    '/db',
    (
        req,
        res
    )=>{

        db.get(

            `
            SELECT dados
            FROM sistema
            WHERE id = 1
            `,

            [],

            (
                err,
                row
            )=>{

                if(err){

                    console.error(
                        err
                    );

                    return res
                        .status(500)
                        .json(err);

                }


                try {

                    res.json(

                        row?.dados

                        ?

                        JSON.parse(
                            row.dados
                        )

                        :

                        {}

                    );

                }
                catch(e){

                    console.error(
                        'Erro ao interpretar banco:',
                        e
                    );

                    res
                        .status(500)
                        .json({

                            ok:false,

                            erro:
                                'Banco de dados inválido.'

                        });

                }

            }

        );

    }
);


/* ========================================================= */
/* 07. API - SALVAR BANCO                                    */
/* ========================================================= */
/*
    POST /db

    Recebe o objeto completo do banco pelo frontend,
    transforma em JSON e grava no SQLite.

    INSERT OR REPLACE garante que o registro principal
    de id 1 seja criado ou atualizado.
*/

server.post(
    '/db',
    (
        req,
        res
    )=>{

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

            [
                dados
            ],

            err=>{

                if(err){

                    console.error(
                        err
                    );

                    return res
                        .status(500)
                        .json(err);

                }


                res.json({
                    ok:true
                });

            }

        );

    }
);


/* ========================================================= */
/* 08. ROTAS - OPENSTREETMAP + NOMINATIM + OSRM               */
/* ========================================================= */
/*
    Sistema gratuito de cálculo de deslocamento.

    NOMINATIM:
        transforma endereços em latitude/longitude.

    OSRM:
        calcula distância e duração da rota.

    Também existem caches em memória para evitar
    consultas repetidas ao mesmo endereço ou rota.
*/

const cacheGeocode =
    new Map();


const cacheRota =
    new Map();


let ultimaConsultaNominatim =
    0;


/* ========================================================= */
/* 08.1 NORMALIZAR CHAVES DE CACHE                           */
/* ========================================================= */
/*
    Padroniza textos usados como chave nos caches:
    remove espaços das pontas e converte para minúsculas.
*/

function normalizarChave(
    valor
){

    return String(
        valor || ''
    )
    .trim()
    .toLowerCase();

}


/* ========================================================= */
/* 08.2 FUNÇÃO DE ESPERA                                     */
/* ========================================================= */
/*
    Utilizada para respeitar o intervalo mínimo entre
    consultas enviadas ao Nominatim.
*/

function dormir(
    ms
){

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


/* ========================================================= */
/* 08.3 LIMITE DE CONSULTAS DO NOMINATIM                     */
/* ========================================================= */
/*
    Impede consultas em sequência rápida demais.

    O código aguarda aproximadamente 1,1 segundo
    entre chamadas ao serviço de geocodificação.
*/

async function respeitarLimiteNominatim(){

    const agora =
        Date.now();


    const faltam =
        1100
        -
        (
            agora
            -
            ultimaConsultaNominatim
        );


    if(
        faltam > 0
    ){

        await dormir(
            faltam
        );

    }


    ultimaConsultaNominatim =
        Date.now();

}


/* ========================================================= */
/* 08.4 GEOCODIFICAR ENDEREÇO                                */
/* ========================================================= */
/*
    Recebe um endereço em texto e procura suas coordenadas
    no Nominatim / OpenStreetMap.

    Fluxo:
    - normaliza o endereço
    - consulta cache
    - respeita limite do serviço
    - faz a busca
    - valida a resposta
    - salva resultado em cache
*/

async function geocodificarEndereco(
    endereco
){

    const chave =
        normalizarChave(
            endereco
        );


    if(
        !chave
    ){

        throw new Error(
            'Endereço vazio.'
        );

    }


    if(
        cacheGeocode.has(
            chave
        )
    ){

        return cacheGeocode.get(
            chave
        );

    }


    await respeitarLimiteNominatim();


    const url =
        new URL(
            'https://nominatim.openstreetmap.org/search'
        );


    url.searchParams.set(
        'q',
        `${endereco}, Brasil`
    );


    url.searchParams.set(
        'format',
        'jsonv2'
    );


    url.searchParams.set(
        'limit',
        '1'
    );


    url.searchParams.set(
        'addressdetails',
        '1'
    );


    url.searchParams.set(
        'countrycodes',
        'br'
    );


    const response =
        await fetch(

            url,

            {

                headers:{

                    'User-Agent':
                        'DominusERP/1.0 (WN Comunicacao Visual; ERP de orcamentos)',

                    'Accept':
                        'application/json',

                    'Accept-Language':
                        'pt-BR,pt;q=0.9'

                }

            }

        );


    const texto =
        await response.text();


    let dados;


    try {

        dados =
            JSON.parse(
                texto
            );

    }
    catch(e){

        throw new Error(
            'O serviço de localização retornou uma resposta inválida.'
        );

    }


    if(
        !response.ok
    ){

        throw new Error(
            `Falha ao localizar endereço (HTTP ${response.status}).`
        );

    }


    if(
        !Array.isArray(
            dados
        )
        ||
        !dados.length
    ){

        throw new Error(
            `Endereço não localizado: ${endereco}`
        );

    }


    const encontrado = {

        latitude:
            Number(
                dados[0].lat
            ),

        longitude:
            Number(
                dados[0].lon
            ),

        label:
            dados[0].display_name
            ||
            endereco

    };


    cacheGeocode.set(
        chave,
        encontrado
    );


    return encontrado;

}


/* ========================================================= */
/* 08.5 CALCULAR ROTA                                        */
/* ========================================================= */
/*
    Recebe:
        origem
        destino
        idaVolta

    Primeiro geocodifica os dois endereços.
    Depois consulta o OSRM.

    Retorna:
        distância de ida
        distância total
        duração de ida
        duração total
        endereços encontrados
        provedor utilizado
*/

async function calcularRotaOSM(
    origem,
    destino,
    idaVolta
){

    const chave =
        `${normalizarChave(origem)}|${normalizarChave(destino)}|${idaVolta ? '2' : '1'}`;


    if(
        cacheRota.has(
            chave
        )
    ){

        return cacheRota.get(
            chave
        );

    }


    const geoOrigem =
        await geocodificarEndereco(
            origem
        );


    const geoDestino =
        await geocodificarEndereco(
            destino
        );


    const coords =
        `${geoOrigem.longitude},${geoOrigem.latitude};${geoDestino.longitude},${geoDestino.latitude}`;


    const url =
        `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false&steps=false&alternatives=false`;


    const response =
        await fetch(

            url,

            {

                headers:{

                    'User-Agent':
                        'DominusERP/1.0 (WN Comunicacao Visual; ERP de orcamentos)',

                    'Accept':
                        'application/json'

                }

            }

        );


    const texto =
        await response.text();


    let dados;


    try {

        dados =
            JSON.parse(
                texto
            );

    }
    catch(e){

        throw new Error(
            'O serviço de rotas retornou uma resposta inválida.'
        );

    }


    if(
        !response.ok
        ||
        dados?.code !== 'Ok'
        ||
        !dados?.routes?.length
    ){

        throw new Error(
            dados?.message
            ||
            'Não foi possível calcular a rota.'
        );

    }


    const distanciaIdaKm =
        dados.routes[0].distance
        /
        1000;


    const duracaoIdaMin =
        dados.routes[0].duration
        /
        60;


    const multiplicador =
        idaVolta
        ?
        2
        :
        1;


    const resultado = {

        ok:true,

        origemInformada:
            origem,

        origemEncontrada:
            geoOrigem.label,

        destinoInformado:
            destino,

        destinoEncontrado:
            geoDestino.label,

        idaVolta:
            !!idaVolta,

        distanciaIdaKm:
            Math.round(
                distanciaIdaKm
                *
                100
            )
            /
            100,

        distanciaTotalKm:
            Math.round(
                distanciaIdaKm
                *
                multiplicador
                *
                100
            )
            /
            100,

        duracaoIdaMin:
            Math.round(
                duracaoIdaMin
            ),

        duracaoTotalMin:
            Math.round(
                duracaoIdaMin
                *
                multiplicador
            ),

        provedor:
            'OpenStreetMap + OSRM'

    };


    cacheRota.set(
        chave,
        resultado
    );


    return resultado;

}


/* ========================================================= */
/* 08.6 API - CALCULAR ROTA                                  */
/* ========================================================= */
/*
    POST /rota/calcular

    Endpoint utilizado pelo ERP para solicitar
    cálculo automático de deslocamento.

    Campos esperados:
        origem
        destino
        idaVolta
*/

server.post(
    '/rota/calcular',
    async(
        req,
        res
    )=>{

        try {

            const origem =
                String(
                    req.body?.origem
                    ||
                    ''
                )
                .trim();


            const destino =
                String(
                    req.body?.destino
                    ||
                    ''
                )
                .trim();


            const idaVolta =
                req.body?.idaVolta
                !==
                false;


            if(
                !origem
                ||
                !destino
            ){

                return res
                    .status(400)
                    .json({

                        ok:false,

                        erro:
                            'Origem e destino são obrigatórios.'

                    });

            }


            const resultado =
                await calcularRotaOSM(

                    origem,

                    destino,

                    idaVolta

                );


            res.json(
                resultado
            );

        }
        catch(e){

            console.error(
                'Erro rota:',
                e
            );


            res
                .status(500)
                .json({

                    ok:false,

                    erro:
                        e.message
                        ||
                        'Erro ao calcular rota.'

                });

        }

    }
);


/* ========================================================= */
/* 09. JANELA PRINCIPAL DO ELECTRON                          */
/* ========================================================= */
/*
    Cria a BrowserWindow do Dominus.

    preload.js:
        faz a ponte segura entre frontend e Electron.

    contextIsolation:
        mantém o contexto da página isolado.

    A janela é maximizada e carrega "Dominus ERP.html".
*/

function criarJanela(){

    const janela =
        new BrowserWindow({

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


/* ========================================================= */
/* 10. IPC - SALVAR BANCO                                    */
/* ========================================================= */
/*
    Canal:
        salvar-db

    Permite que o preload.js solicite uma gravação
    diretamente ao processo principal do Electron.
*/

ipcMain.handle(

    'salvar-db',

    async(
        _,
        dados
    )=>{

        return new Promise(

            (
                resolve,
                reject
            )=>{

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

                            reject(
                                err
                            );

                        }
                        else{

                            resolve(
                                true
                            );

                        }

                    }

                );

            }

        );

    }

);


/* ========================================================= */
/* 11. IPC - CARREGAR BANCO                                  */
/* ========================================================= */
/*
    Canal:
        carregar-db

    Lê o banco SQLite e devolve o objeto salvo
    para o processo de renderização.
*/

ipcMain.handle(

    'carregar-db',

    async()=>{

        return new Promise(

            (
                resolve,
                reject
            )=>{

                db.get(

                    `
                    SELECT dados
                    FROM sistema
                    WHERE id=1
                    `,

                    (
                        err,
                        row
                    )=>{

                        if(err){

                            reject(
                                err
                            );

                            return;

                        }


                        try {

                            resolve(

                                row?.dados

                                ?

                                JSON.parse(
                                    row.dados
                                )

                                :

                                null

                            );

                        }
                        catch(e){

                            reject(
                                e
                            );

                        }

                    }

                );

            }

        );

    }

);


/* ========================================================= */
/* 12. IMPRESSÃO VIA CHROME                                  */
/* ========================================================= */
/*
    Canal:
        imprimir-html

    Fluxo:
    1. recebe o HTML pronto
    2. cria um arquivo temporário
    3. grava esse HTML
    4. abre o arquivo em uma nova janela do Chrome

    O arquivo temporário é salvo na pasta TEMP do Windows.
*/

ipcMain.handle(

    'imprimir-html',

    async(
        _,
        html
    )=>{

        try {

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


/* ========================================================= */
/* 13. ATUALIZAÇÃO AUTOMÁTICA                                */
/* ========================================================= */
/*
    Canais IPC:
        check-update
        install-update

    check-update:
        verifica se existe nova versão.

    install-update:
        baixa a atualização, acompanha o progresso
        e reinicia o aplicativo para instalar.
*/

ipcMain.handle(

    'check-update',

    async()=>{

        try {

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
                        ?.version
                    ||
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

                erro:
                    e.message

            };

        }

    }

);


ipcMain.handle(

    'install-update',

    async()=>{

        try {

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
                        )
                        +
                        '%'

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


/* ========================================================= */
/* 14. VERSÃO DO SISTEMA                                     */
/* ========================================================= */
/*
    Canal:
        get-version

    Retorna a versão definida no package.json
    através de app.getVersion().
*/

ipcMain.handle(

    'get-version',

    async()=>{

        return app.getVersion();

    }

);


/* ========================================================= */
/* 15. LOGO DO SISTEMA                                       */
/* ========================================================= */
/*
    Canal:
        get-logo-path

    Lê logo.png e devolve a imagem em Base64.
    Isso permite utilizar a logo em relatórios e impressões.
*/

ipcMain.handle(

    'get-logo-path',

    async()=>{

        const logo =
            fs.readFileSync(

                path.join(
                    __dirname,
                    'logo.png'
                )

            );


        return `data:image/png;base64,${
            logo.toString(
                'base64'
            )
        }`;

    }

);


/* ========================================================= */
/* 16. INICIALIZAÇÃO DO APLICATIVO                           */
/* ========================================================= */
/*
    Quando o Electron estiver pronto:

    1. mantém autoDownload desativado
    2. inicia o servidor Express na porta 3000
    3. aceita conexões em 0.0.0.0
    4. informa os endereços no console
    5. cria a janela principal
*/

app.whenReady()
.then(()=>{

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
                'http://10.1.1.14:3000'
            );


            console.log(
                'Rota automática: OpenStreetMap + OSRM'
            );

        }

    );


    criarJanela();

});


/* ========================================================= */
/* 17. ENCERRAMENTO DO APLICATIVO                            */
/* ========================================================= */
/*
    Quando todas as janelas forem fechadas,
    encerra o aplicativo no Windows/Linux.

    No macOS o comportamento padrão é diferente,
    por isso existe a verificação "darwin".
*/

app.on(

    'window-all-closed',

    ()=>{

        if(
            process.platform
            !==
            'darwin'
        ){

            app.quit();

        }

    }

);


/* ========================================================= */
/* 18. REABRIR JANELA NO macOS                               */
/* ========================================================= */
/*
    Se o aplicativo estiver ativo e não houver
    nenhuma janela aberta, cria uma nova janela principal.
*/

app.on(

    'activate',

    ()=>{

        if(
            BrowserWindow
                .getAllWindows()
                .length
            ===
            0
        ){

            criarJanela();

        }

    }

);