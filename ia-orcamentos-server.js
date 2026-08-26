/* ===================================================== */
/* DOMINUS ERP - ASSISTENTE LOCAL DE ORÇAMENTOS          */
/* 100% LOCAL - SEM OPENAI / SEM API / SEM INTERNET      */
/* ===================================================== */

'use strict';

(function () {

    /* ========================= */
    /* HELPERS */
    /* ========================= */

    const arr =
        v =>
            Array.isArray(v)
                ? v
                : [];


    function norm(v) {

        return String(
            v || ''
        )
        .normalize('NFD')
        .replace(
            /[\u0300-\u036f]/g,
            ''
        )
        .toLowerCase()
        .replace(
            /[^a-z0-9\s.,x×/+-]/g,
            ' '
        )
        .replace(
            /\s+/g,
            ' '
        )
        .trim();

    }


    function num(v) {

        if (
            v === null
            ||
            v === undefined
            ||
            v === ''
        ) {

            return 0;

        }

        const s =
            String(v)
            .trim();

        const n =
            Number(

                (
                    s.includes(',')

                        ?

                        s
                        .replace(
                            /\./g,
                            ''
                        )
                        .replace(
                            ',',
                            '.'
                        )

                        :

                        s
                )
                .replace(
                    /[^0-9.-]/g,
                    ''
                )

            );

        return Number.isFinite(n)
            ? n
            : 0;

    }


    function round(
        v,
        c = 2
    ) {

        const f =
            10 ** c;

        return Math.round(
            (
                Number(v || 0)
                +
                Number.EPSILON
            )
            *
            f
        )
        /
        f;

    }


    function money(v) {

        return Number(
            v || 0
        )
        .toLocaleString(
            'pt-BR',
            {
                style:
                    'currency',

                currency:
                    'BRL'
            }
        );

    }


    function esc(v) {

        return String(
            v ?? ''
        )
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );

    }


    function yes(v) {

        const t =
            norm(v);

        return [

            'sim',
            's',
            'ok',
            'pode',
            'pode sim',
            'quero',
            'inclui',
            'incluir',
            'usar',
            'certo',
            'isso'

        ]
        .includes(t)

        ||

        t.startsWith(
            'sim '
        );

    }


    function no(v) {

        const t =
            norm(v);

        return [

            'nao',
            'n',
            'sem',
            'nenhum',
            'nenhuma',
            'pular',
            'pula',
            'dispensa'

        ]
        .includes(t)

        ||

        t.startsWith(
            'nao '
        );

    }


    function skip(v) {

        return [

            'pular',
            'pula',
            'depois',
            'sem informar',
            'nao sei'

        ]
        .includes(
            norm(v)
        );

    }


    function today() {

        return new Date()
            .toISOString()
            .split('T')[0];

    }


    function addDays(
        days
    ) {

        const d =
            new Date();

        d.setHours(
            12,
            0,
            0,
            0
        );

        d.setDate(
            d.getDate()
            +
            Number(
                days || 0
            )
        );

        return d
            .toISOString()
            .split('T')[0];

    }


    function tokens(v) {

        return norm(v)
            .split(' ')
            .filter(
                x =>
                    x.length >= 2
            );

    }


    function score(
        query,
        target
    ) {

        const q =
            norm(query);

        const a =
            norm(target);

        if (
            !q
            ||
            !a
        ) {

            return 0;

        }

        if (
            q === a
        ) {

            return 1000;

        }

        if (
            a.includes(q)
        ) {

            return 850
                +
                Math.min(
                    q.length,
                    100
                );

        }

        if (
            q.includes(a)
        ) {

            return 800
                +
                Math.min(
                    a.length,
                    100
                );

        }

        const ta =
            new Set(
                tokens(a)
            );

        return tokens(q)
            .reduce(

                (
                    pontos,
                    token
                ) => {

                    if (
                        ta.has(token)
                    ) {

                        return pontos
                            +
                            80;

                    }

                    if (
                        [...ta]
                        .some(
                            x =>
                                x.includes(
                                    token
                                )
                                ||
                                token.includes(
                                    x
                                )
                        )
                    ) {

                        return pontos
                            +
                            35;

                    }

                    return pontos;

                },

                0

            );

    }


    function search(
        query,
        items,
        textFn
    ) {

        return arr(items)

            .map(
                item => ({

                    item,

                    score:
                        score(
                            query,
                            textFn(item)
                        )

                })
            )

            .filter(
                x =>
                    x.score > 0
            )

            .sort(
                (
                    a,
                    b
                ) =>
                    b.score
                    -
                    a.score
            );

    }


    function byNumber(
        text,
        options
    ) {

        const t =
            String(
                text || ''
            )
            .trim();

        if (
            !/^\d+$/.test(t)
        ) {

            return null;

        }

        return options?.[
            Number(t) - 1
        ]
        ||
        null;

    }


    function parseMeasure(
        text
    ) {

        const m =
            String(
                text || ''
            )
            .match(

                /(\d+(?:[.,]\d+)?)\s*(?:m|metro|metros)?\s*[xX×]\s*(\d+(?:[.,]\d+)?)\s*(?:m|metro|metros)?/

            );

        if (!m) {

            return null;

        }

        const width =
            num(
                m[1]
            );

        const height =
            num(
                m[2]
            );

        if (
            !(
                width > 0
                &&
                height > 0
            )
        ) {

            return null;

        }

        return {

            width,

            height,

            area:
                round(
                    width * height,
                    3
                ),

            text:
                `${String(width).replace('.', ',')} x ${String(height).replace('.', ',')} m`

        };

    }


    function parseQuantity(
        text
    ) {

        const m =
            norm(text)
            .match(
                /(\d+(?:[.,]\d+)?)/
            );

        return m
            ? num(m[1])
            : 0;

    }


    function parseHours(
        text
    ) {

        const t =
            norm(text);

        const m =
            t.match(
                /(\d+(?:[.,]\d+)?)\s*(?:h|hora|horas)\b/
            );

        if (m) {

            return num(
                m[1]
            );

        }

        return /^\d+(?:[.,]\d+)?$/
            .test(t)

            ?

            num(t)

            :

            0;

    }


    function parseKm(
        text
    ) {

        const t =
            norm(text);

        const m =
            t.match(
                /(\d+(?:[.,]\d+)?)\s*(?:km|quilometro|quilometros)\b/
            );

        if (m) {

            return num(
                m[1]
            );

        }

        return /^\d+(?:[.,]\d+)?$/
            .test(t)

            ?

            num(t)

            :

            0;

    }


    function parseValidity(
        text
    ) {

        const raw =
            String(
                text || ''
            )
            .trim();

        if (
            /^\d{4}-\d{2}-\d{2}$/
            .test(raw)
        ) {

            return raw;

        }

        const m =
            norm(text)
            .match(
                /(\d+)\s*dias?/
            );

        return m

            ?

            addDays(
                Number(
                    m[1]
                )
            )

            :

            '';

    }


    /* ========================= */
    /* DADOS DO ERP */
    /* ========================= */

    function cc() {

        const c =
            window.db
                ?.centroCustos
            ||
            {};

        return {

            combustiveis:
                arr(
                    c.combustiveis
                ),

            veiculos:
                arr(
                    c.veiculos
                ),

            equipamentos:
                arr(
                    c.equipamentos
                ),

            mao: {

                horas:
                    num(
                        c.maoDeObra
                            ?.horasMensais
                    )
                    ||
                    220,

                encargos:
                    num(
                        c.maoDeObra
                            ?.encargosPercentual
                    )

            },

            parametros: {

                desperdicio:
                    num(
                        c.parametros
                            ?.desperdicioPercentual
                    ),

                administrativo:
                    num(
                        c.parametros
                            ?.administrativoPercentual
                    ),

                margem:
                    num(
                        c.parametros
                            ?.margemLucroPercentual
                    ),

                metodo:
                    c.parametros
                        ?.metodoMargem
                    ===
                    'margem'

                        ?

                        'margem'

                        :

                        'acrescimo'

            }

        };

    }


    const clients =
        q =>
            search(

                q,

                window.db
                    ?.clientes,

                x =>
                    x.nome || ''

            );


    const products =
        q =>
            search(

                q,

                window.db
                    ?.produtos,

                x =>
                    [

                        x.codigo,
                        x.tipo,
                        x.descricao,
                        x.fornecedor

                    ]
                    .filter(Boolean)
                    .join(' ')

            );


    const employees =
        q =>
            search(

                q,

                arr(
                    window.db
                        ?.funcionarios
                )
                .filter(
                    x =>
                        !x.status
                        ||
                        norm(
                            x.status
                        )
                        ===
                        'ativo'
                ),

                x =>
                    [

                        x.id,
                        x.nome,
                        x.cargo

                    ]
                    .filter(Boolean)
                    .join(' ')

            );


    const vehicles =
        q =>
            search(

                q,

                cc()
                .veiculos
                .filter(
                    x =>
                        x.ativo
                        !==
                        false
                ),

                x =>
                    [

                        x.id,
                        x.nome,
                        x.placa

                    ]
                    .filter(Boolean)
                    .join(' ')

            );


    const equipments =
        q =>
            search(

                q,

                cc()
                .equipamentos
                .filter(
                    x =>
                        x.ativo
                        !==
                        false
                ),

                x =>
                    [

                        x.id,
                        x.nome,
                        x.tipoCalculo,
                        x.observacoes

                    ]
                    .filter(Boolean)
                    .join(' ')

            );


    /* ========================= */
    /* VOCABULÁRIO */
    /* ========================= */

    const services = [

        [
            'Fachada em ACM',
            [
                'fachada em acm',
                'fachada acm',
                'revestimento em acm',
                'revestimento acm'
            ]
        ],

        [
            'Fachada',
            [
                'fachada',
                'frente da loja',
                'frente de loja'
            ]
        ],

        [
            'Letreiro',
            [
                'letreiro',
                'letra caixa',
                'letras caixa',
                'letreiro iluminado'
            ]
        ],

        [
            'Adesivagem',
            [
                'adesivagem',
                'adesivo',
                'vinil',
                'plotagem',
                'adesivo de vitrine'
            ]
        ],

        [
            'Envelopamento de veículo',
            [
                'envelopamento de veiculo',
                'envelopamento automotivo',
                'envelopar veiculo'
            ]
        ],

        [
            'Banner / Lona',
            [
                'banner',
                'lona',
                'impressao em lona'
            ]
        ],

        [
            'Neon LED',
            [
                'neon led',
                'neon',
                'led neon'
            ]
        ],

        [
            'Impressão UV',
            [
                'impressao uv'
            ]
        ],

        [
            'Corte Laser',
            [
                'corte laser'
            ]
        ],

        [
            'Corte CNC',
            [
                'corte cnc',
                'cnc'
            ]
        ]

    ];


    function detectService(
        text
    ) {

        const t =
            norm(text);

        let best =
            '';

        let len =
            0;

        services
        .forEach(
            (
                [
                    name,
                    terms
                ]
            ) => {

                terms
                .forEach(
                    term => {

                        const n =
                            norm(term);

                        if (
                            t.includes(n)
                            &&
                            n.length > len
                        ) {

                            best =
                                name;

                            len =
                                n.length;

                        }

                    }
                );

            }
        );

        return best;

    }


    /* ========================= */
    /* ESTADO */
    /* ========================= */

    function newState() {

        const c =
            cc();

        return {

            stage:
                'start',

            client:
                '',

            service:
                '',

            serviceText:
                '',

            measureText:
                '',

            width:
                0,

            height:
                0,

            area:
                0,

            serviceQty:
                0,

            materials:
                [],

            labor:
                [],

            useTravel:
                false,

            vehicleId:
                '',

            totalKm:
                0,

            equipment:
                [],

            extras:
                [],

            payment:
                '',

            delivery:
                '',

            validity:
                '',

            note:
                'sim',

            margin:
                c.parametros
                    .margem,

            marginMethod:
                c.parametros
                    .metodo,

            manualPrice:
                0,

            options:
                [],

            temp:
                null,

            done: {

                measure:
                    false,

                materials:
                    false,

                labor:
                    false,

                travel:
                    false,

                equipment:
                    false,

                extras:
                    false,

                payment:
                    false,

                delivery:
                    false,

                validity:
                    false,

                note:
                    false

            }

        };

    }


    function session() {

        if (
            !window
                .chatIAOrcamentoLocal
        ) {

            window
                .chatIAOrcamentoLocal =
            {

                state:
                    newState(),

                messages:
                    [],

                calculation:
                    null,

                busy:
                    false

            };

        }

        return window
            .chatIAOrcamentoLocal;

    }


    function ai(text) {

        session()
        .messages
        .push({

            type:
                'ia',

            text:
                String(
                    text || ''
                )

        });

    }


    function user(text) {

        session()
        .messages
        .push({

            type:
                'usuario',

            text:
                String(
                    text || ''
                )

        });

    }


    /* ========================= */
    /* CÁLCULO */
    /* ========================= */

    function calculate(s) {

        const c =
            cc();


        const mat =
            s.materials
            .map(
                item => {

                    const p =
                        arr(
                            window.db
                                ?.produtos
                        )
                        .find(
                            x =>
                                String(
                                    x.codigo
                                )
                                ===
                                String(
                                    item.codigo
                                )
                        );

                    if (!p) {

                        return null;

                    }

                    const q =
                        num(
                            item.qty
                        );

                    const unit =
                        num(
                            p.valor
                        );

                    return {

                        codigo:
                            String(
                                p.codigo ?? ''
                            ),

                        descricao:
                            p.descricao
                            ||
                            p.tipo
                            ||
                            '',

                        quantidade:
                            q,

                        valorUnitario:
                            unit,

                        total:
                            round(
                                q * unit
                            )

                    };

                }
            )
            .filter(Boolean);


        const matTotal =
            round(

                mat.reduce(
                    (
                        total,
                        item
                    ) =>
                        total
                        +
                        item.total,

                    0
                )

            );


        const waste =
            round(

                matTotal

                *

                c.parametros
                    .desperdicio

                /

                100

            );


        const labor =
            s.labor
            .map(
                item => {

                    const f =
                        arr(
                            window.db
                                ?.funcionarios
                        )
                        .find(
                            x =>
                                String(
                                    x.id
                                )
                                ===
                                String(
                                    item.id
                                )
                        );

                    if (!f) {

                        return null;

                    }

                    const hours =
                        num(
                            item.hours
                        );

                    const hourBase =
                        num(
                            f.salario
                        )
                        /
                        c.mao.horas;

                    const hour =
                        hourBase

                        *

                        (
                            1

                            +

                            c.mao
                                .encargos

                            /

                            100
                        );

                    return {

                        id:
                            String(
                                f.id ?? ''
                            ),

                        nome:
                            f.nome || '',

                        cargo:
                            f.cargo || '',

                        horas:
                            hours,

                        custoHora:
                            round(
                                hour,
                                4
                            ),

                        total:
                            round(
                                hour
                                *
                                hours
                            )

                    };

                }
            )
            .filter(Boolean);


        const laborTotal =
            round(

                labor.reduce(
                    (
                        total,
                        item
                    ) =>
                        total
                        +
                        item.total,

                    0
                )

            );


        let travel = {

            ativo:
                false,

            total:
                0

        };


        if (
            s.useTravel
            &&
            s.vehicleId
            &&
            s.totalKm > 0
        ) {

            const v =
                c.veiculos
                .find(
                    x =>
                        String(
                            x.id
                        )
                        ===
                        String(
                            s.vehicleId
                        )
                );


            if (v) {

                const fuel =
                    c.combustiveis
                    .find(
                        x =>
                            String(
                                x.id
                            )
                            ===
                            String(
                                v.combustivelId
                            )
                    );


                const km =
                    num(
                        s.totalKm
                    );


                const consumption =
                    num(
                        v.consumoKmLitro
                    );


                const liters =
                    consumption > 0

                        ?

                        km
                        /
                        consumption

                        :

                        0;


                const fuelCost =
                    liters

                    *

                    num(
                        fuel
                            ?.valorLitro
                    );


                const opCost =
                    km

                    *

                    num(
                        v.custoOperacionalKm
                    );


                travel = {

                    ativo:
                        true,

                    veiculo:
                        v.nome || '',

                    placa:
                        v.placa || '',

                    distanciaTotalKm:
                        km,

                    litros:
                        round(
                            liters,
                            3
                        ),

                    custoCombustivel:
                        round(
                            fuelCost
                        ),

                    custoOperacional:
                        round(
                            opCost
                        ),

                    total:
                        round(
                            fuelCost
                            +
                            opCost
                        )

                };

            }

        }


        const equip =
            s.equipment
            .map(
                item => {

                    const e =
                        c.equipamentos
                        .find(
                            x =>
                                String(
                                    x.id
                                )
                                ===
                                String(
                                    item.id
                                )
                        );

                    if (!e) {

                        return null;

                    }

                    const q =
                        num(
                            item.qty
                        );

                    return {

                        id:
                            String(
                                e.id ?? ''
                            ),

                        nome:
                            e.nome || '',

                        tipoCalculo:
                            e.tipoCalculo
                            ||
                            '',

                        quantidade:
                            q,

                        valorUnitario:
                            num(
                                e.valor
                            ),

                        total:
                            round(
                                q
                                *
                                num(
                                    e.valor
                                )
                            )

                    };

                }
            )
            .filter(Boolean);


        const equipTotal =
            round(

                equip.reduce(
                    (
                        total,
                        item
                    ) =>
                        total
                        +
                        item.total,

                    0
                )

            );


        const extras =
            s.extras
            .map(
                item => ({

                    descricao:
                        item.descricao,

                    valor:
                        round(
                            num(
                                item.valor
                            )
                        )

                })
            );


        const extraTotal =
            round(

                extras.reduce(
                    (
                        total,
                        item
                    ) =>
                        total
                        +
                        item.valor,

                    0
                )

            );


        const subtotal =
            round(

                matTotal
                +
                waste
                +
                laborTotal
                +
                travel.total
                +
                equipTotal
                +
                extraTotal

            );


        const admin =
            round(

                subtotal

                *

                c.parametros
                    .administrativo

                /

                100

            );


        const cost =
            round(
                subtotal
                +
                admin
            );


        let suggested =
            0;

        let marginValue =
            0;


        if (
            s.marginMethod
            ===
            'margem'
        ) {

            if (
                s.margin < 100
            ) {

                suggested =
                    cost

                    /

                    (
                        1
                        -
                        s.margin
                        /
                        100
                    );

                marginValue =
                    suggested
                    -
                    cost;

            }

            else {

                suggested =
                    cost;

            }

        }

        else {

            marginValue =
                cost

                *

                s.margin

                /

                100;

            suggested =
                cost
                +
                marginValue;

        }


        suggested =
            round(
                suggested
            );

        marginValue =
            round(
                marginValue
            );


        const base =
            s.manualPrice > 0

                ?

                round(
                    s.manualPrice
                )

                :

                suggested;


        /*
            Mantém a regra atual
            já existente no orçamento
            manual do Dominus.
        */

        const noteAdd =
            s.note === 'nao'

                ?

                round(
                    base * 0.12
                )

                :

                0;


        const total =
            round(
                base
                +
                noteAdd
            );


        return {

            materiais: {

                detalhes:
                    mat,

                total:
                    matTotal

            },

            maoDeObra: {

                detalhes:
                    labor,

                total:
                    laborTotal

            },

            deslocamento:
                travel,

            equipamentos: {

                detalhes:
                    equip,

                total:
                    equipTotal

            },

            extras: {

                detalhes:
                    extras,

                total:
                    extraTotal

            },

            resumo: {

                custoMateriais:
                    matTotal,

                desperdicioPercentual:
                    c.parametros
                        .desperdicio,

                desperdicio:
                    waste,

                custoMaoDeObra:
                    laborTotal,

                custoDeslocamento:
                    travel.total,

                custoEquipamentos:
                    equipTotal,

                outrosCustos:
                    extraTotal,

                administrativoPercentual:
                    c.parametros
                        .administrativo,

                administrativo:
                    admin,

                custoTotal:
                    cost,

                margemPercentual:
                    s.margin,

                metodoMargem:
                    s.marginMethod,

                valorMargem:
                    marginValue,

                precoSugerido:
                    suggested,

                precoBaseCliente:
                    base,

                acrescimoRegraNota:
                    noteAdd,

                totalCliente:
                    total

            },

            calculadoEm:
                new Date()
                .toISOString()

        };

    }


    /* ========================= */
    /* FORMATAÇÃO DE OPÇÕES */
    /* ========================= */

    const clientText =
        x =>
            x.nome
            ||
            'Cliente';


    const productText =
        x =>
            `${
                x.codigo
                    ? '#' + x.codigo + ' - '
                    : ''
            }${
                x.descricao
                ||
                x.tipo
                ||
                'Produto'
            } | ${
                money(
                    num(
                        x.valor
                    )
                )
            }${
                x.quantidade !== undefined
                    ? ' | Estoque: ' + x.quantidade
                    : ''
            }`;


    const employeeText =
        x =>
            `${
                x.nome
                ||
                'Funcionário'
            }${
                x.cargo
                    ? ' - ' + x.cargo
                    : ''
            }`;


    const vehicleText =
        x =>
            `${
                x.nome
                ||
                'Veículo'
            }${
                x.placa
                    ? ' - ' + x.placa
                    : ''
            }`;


    const equipmentText =
        x =>
            `${
                x.nome
                ||
                'Equipamento'
            }${
                x.tipoCalculo
                    ? ' (' + x.tipoCalculo + ')'
                    : ''
            } - ${
                money(
                    num(
                        x.valor
                    )
                )
            }`;


    function optionsMessage(
        title,
        options,
        fmt
    ) {

        return `${title}

${
    options
    .map(
        (
            item,
            index
        ) =>
            `${index + 1}. ${fmt(item)}`
    )
    .join('\n')
}

Digite o número ou escreva o nome.`;

    }


    /* ========================= */
    /* EXTRAÇÃO FLEXÍVEL */
    /* ========================= */

    function extract(
        text,
        s
    ) {

        const service =
            detectService(
                text
            );


        if (
            service
            &&
            !s.service
        ) {

            s.service =
                service;

            s.serviceText =
                service;

        }


        const m =
            parseMeasure(
                text
            );


        if (m) {

            s.width =
                m.width;

            s.height =
                m.height;

            s.area =
                m.area;

            s.measureText =
                m.text;

            s.done.measure =
                true;

        }


        if (
            !s.client
        ) {

            const exact =
                clients(text)
                .filter(
                    x =>
                        x.score >= 800
                );


            if (
                exact.length === 1
            ) {

                s.client =
                    exact[0]
                        .item
                        .nome;

            }

        }


        const t =
            norm(text);


        if (
            /\bsem nota\b/
            .test(t)
        ) {

            s.note =
                'nao';

            s.done.note =
                true;

        }


        if (
            /\bcom nota\b/
            .test(t)
        ) {

            s.note =
                'sim';

            s.done.note =
                true;

        }


        const p =
            t.match(

                /(?:preco final|total final|fechar em|vender por)\D*(\d[\d.,]*)/

            );


        if (
            p
            &&
            num(
                p[1]
            ) > 0
        ) {

            s.manualPrice =
                num(
                    p[1]
                );

        }

    }


    /* ========================= */
    /* PRÓXIMA ETAPA */
    /* ========================= */

    function ask(
        s,
        stage,
        text
    ) {

        s.stage =
            stage;

        s.options =
            [];

        return text;

    }


    function next(s) {

        if (
            !s.client
        ) {

            return ask(
                s,
                'client',
                'Qual é o cliente? Pode escrever parte do nome que eu procuro nos clientes cadastrados.'
            );

        }


        if (
            !s.service
        ) {

            return ask(
                s,
                'service',
                'Qual serviço será realizado? Ex.: fachada em ACM, letreiro, adesivagem, banner, neon LED ou corte CNC.'
            );

        }


        if (
            !s.done.measure
        ) {

            return ask(
                s,
                'measure',
                'Qual a medida ou quantidade do serviço? Ex.: "6 x 1,20 m", "10 unidades" ou "pular".'
            );

        }


        if (
            !s.done.materials
        ) {

            return ask(
                s,
                'materials_yes',
                'Deseja incluir materiais do estoque no cálculo?'
            );

        }


        if (
            !s.done.labor
        ) {

            return ask(
                s,
                'labor_yes',
                'Deseja incluir mão de obra dos funcionários cadastrados?'
            );

        }


        if (
            !s.done.travel
        ) {

            return ask(
                s,
                'travel_yes',
                'Haverá deslocamento com veículo da empresa? Se sim, vou pedir a quilometragem total.'
            );

        }


        if (
            !s.done.equipment
        ) {

            return ask(
                s,
                'equipment_yes',
                'Deseja incluir algum equipamento do Centro de Custos?'
            );

        }


        if (
            !s.done.extras
        ) {

            return ask(
                s,
                'extras_yes',
                'Existe algum outro custo? Ex.: aluguel, frete terceirizado.'
            );

        }


        if (
            !s.done.payment
        ) {

            return ask(
                s,
                'payment',
                'Qual a forma de pagamento? Responda "pular" para deixar em branco.'
            );

        }


        if (
            !s.done.delivery
        ) {

            return ask(
                s,
                'delivery',
                'Qual o prazo de entrega? Responda "pular" para deixar em branco.'
            );

        }


        if (
            !s.done.validity
        ) {

            return ask(
                s,
                'validity',
                'Qual a validade do orçamento? Ex.: 7 dias, 15 dias ou "pular".'
            );

        }


        if (
            !s.done.note
        ) {

            return ask(
                s,
                'note',
                'O orçamento será com nota?'
            );

        }


        return summary(s);

    }


    /* ========================= */
    /* RESUMO */
    /* ========================= */

    function summary(s) {

        const calc =
            calculate(s);

        session()
            .calculation =
                calc;

        const r =
            calc.resumo;


        s.stage =
            r.totalCliente > 0

                ?

                'confirm'

                :

                'zero';


        let text =
            [

                'Orçamento praticamente pronto:',

                '',

                `Cliente: ${s.client}`,

                `Serviço: ${s.serviceText || s.service}`,

                s.measureText
                    ? `Medidas/quantidade: ${s.measureText}`
                    : null,

                '',

                `Materiais: ${money(r.custoMateriais)}`,

                `Desperdício: ${money(r.desperdicio)}`,

                `Mão de obra: ${money(r.custoMaoDeObra)}`,

                `Deslocamento: ${money(r.custoDeslocamento)}`,

                `Equipamentos: ${money(r.custoEquipamentos)}`,

                `Outros custos: ${money(r.outrosCustos)}`,

                `Administrativo: ${money(r.administrativo)}`,

                `Custo total: ${money(r.custoTotal)}`,

                `Margem: ${r.margemPercentual}% (${r.metodoMargem})`,

                `Preço sugerido: ${money(r.precoSugerido)}`,

                s.note === 'nao'
                    ? `Regra sem nota (+12%): ${money(r.acrescimoRegraNota)}`
                    : null,

                `TOTAL PARA O CLIENTE: ${money(r.totalCliente)}`,

                ''

            ]
            .filter(
                x =>
                    x !== null
            )
            .join('\n');


        if (
            r.totalCliente > 0
        ) {

            text +=
                'Posso gerar o orçamento com esses dados?';

        }

        else {

            text +=
                'O valor ainda está zerado. Adicione algum custo ou escreva, por exemplo, "preço final 2500".';

        }


        return text;

    }


    /* ========================= */
    /* PROCESSAMENTO */
    /* ========================= */

    function process(text) {

        const s =
            session()
                .state;

        const t =
            norm(text);


        if (
            [
                'reiniciar',
                'recomecar',
                'novo orcamento'
            ]
            .includes(t)
        ) {

            session()
                .state =
                    newState();

            session()
                .calculation =
                    null;

            return next(
                session()
                    .state
            );

        }


        if (
            [
                'resumo',
                'ver resumo',
                'mostrar resumo'
            ]
            .includes(t)
        ) {

            return summary(s);

        }


        if (
            t.startsWith(
                'estoque '
            )
        ) {

            const found =
                products(

                    t.replace(
                        /^estoque\s+/,
                        ''
                    )

                )
                .slice(
                    0,
                    6
                )
                .map(
                    x =>
                        x.item
                );


            return found.length

                ?

                `Encontrei no estoque:

${
    found
    .map(
        x =>
            '• ' + productText(x)
    )
    .join('\n')
}

Continuamos o orçamento quando quiser.`

                :

                'Não encontrei produto correspondente no estoque.';

        }


        extract(
            text,
            s
        );


        if (
            s.stage === 'start'
        ) {

            if (
                !s.client
            ) {

                const found =
                    clients(
                        text
                    );


                if (
                    found.length === 1

                    ||

                    (
                        found[0]
                            ?.score >= 800

                        &&

                        (
                            !found[1]

                            ||

                            found[0].score
                            -
                            found[1].score
                            >=
                            100
                        )
                    )
                ) {

                    s.client =
                        found[0]
                            .item
                            .nome;

                }

            }


            return next(s);

        }


        let response =
            '';


        switch (
            s.stage
        ) {

            /* ================= */
            /* CLIENTE */
            /* ================= */

            case 'client': {

                const chosen =
                    byNumber(
                        text,
                        s.options
                    );


                if (chosen) {

                    s.client =
                        chosen.nome;

                    response =
                        `Cliente selecionado: ${s.client}.`;

                    break;

                }


                const found =
                    clients(
                        text
                    );


                if (
                    !found.length
                ) {

                    return 'Não encontrei esse cliente no cadastro. Tente outra parte do nome.';

                }


                if (
                    found.length === 1

                    ||

                    (
                        found[0].score
                        >=
                        800

                        &&

                        (
                            !found[1]

                            ||

                            found[0].score
                            -
                            found[1].score
                            >=
                            100
                        )
                    )
                ) {

                    s.client =
                        found[0]
                            .item
                            .nome;

                    response =
                        `Cliente selecionado: ${s.client}.`;

                    break;

                }


                s.options =
                    found
                    .slice(
                        0,
                        6
                    )
                    .map(
                        x =>
                            x.item
                    );


                return optionsMessage(

                    'Encontrei mais de um cliente:',

                    s.options,

                    clientText

                );

            }


            /* ================= */
            /* SERVIÇO */
            /* ================= */

            case 'service':

                s.service =
                    detectService(
                        text
                    )
                    ||
                    String(text)
                    .trim();

                s.serviceText =
                    String(text)
                    .trim();

                response =
                    `Serviço registrado: ${s.serviceText}.`;

                break;


            /* ================= */
            /* MEDIDAS */
            /* ================= */

            case 'measure': {

                if (
                    skip(text)
                ) {

                    s.done.measure =
                        true;

                    response =
                        'Certo. Vou seguir sem medida específica.';

                    break;

                }


                const m =
                    parseMeasure(
                        text
                    );


                if (m) {

                    s.width =
                        m.width;

                    s.height =
                        m.height;

                    s.area =
                        m.area;

                    s.measureText =
                        m.text;

                    s.done.measure =
                        true;


                    response =
                        `Medidas: ${m.text}. Área calculada: ${String(m.area).replace('.', ',')} m².`;

                    break;

                }


                const q =
                    parseQuantity(
                        text
                    );


                if (
                    q > 0
                ) {

                    s.serviceQty =
                        q;

                    s.measureText =
                        `${q} unidade(s)`;

                    s.done.measure =
                        true;

                    response =
                        `Quantidade registrada: ${q} unidade(s).`;

                    break;

                }


                return 'Não consegui identificar. Use "6 x 1,20 m", "10 unidades" ou "pular".';

            }


            /* ================= */
            /* MATERIAIS */
            /* ================= */

            case 'materials_yes':

                if (
                    no(text)
                ) {

                    s.done.materials =
                        true;

                    response =
                        'Sem materiais do estoque.';

                    break;

                }


                if (
                    !yes(text)
                ) {

                    return 'Responda sim para escolher materiais ou não para seguir sem eles.';

                }


                s.stage =
                    'material_find';

                return 'Qual material deseja usar? Escreva parte da descrição, tipo ou código.';


            case 'material_find': {

                const chosen =
                    byNumber(
                        text,
                        s.options
                    );


                if (chosen) {

                    s.temp =
                        chosen;

                    s.stage =
                        'material_qty';

                    s.options =
                        [];

                    return `Selecionado: ${productText(chosen)}. Qual quantidade será usada?`;

                }


                const found =
                    products(
                        text
                    );


                if (
                    !found.length
                ) {

                    return 'Não encontrei esse material no estoque.';

                }


                if (
                    found.length === 1

                    ||

                    (
                        found[0].score
                        >=
                        800

                        &&

                        (
                            !found[1]

                            ||

                            found[0].score
                            -
                            found[1].score
                            >=
                            100
                        )
                    )
                ) {

                    s.temp =
                        found[0]
                            .item;

                    s.stage =
                        'material_qty';

                    return `Encontrei: ${productText(s.temp)}. Qual quantidade será usada?`;

                }


                s.options =
                    found
                    .slice(
                        0,
                        6
                    )
                    .map(
                        x =>
                            x.item
                    );


                return optionsMessage(

                    'Encontrei estes materiais:',

                    s.options,

                    productText

                );

            }


            case 'material_qty': {

                const q =
                    parseQuantity(
                        text
                    );


                if (
                    !(q > 0)
                ) {

                    return 'Informe uma quantidade maior que zero.';

                }


                const p =
                    s.temp;


                const old =
                    s.materials
                    .find(
                        x =>
                            String(
                                x.codigo
                            )
                            ===
                            String(
                                p.codigo
                            )
                    );


                if (old) {

                    old.qty =
                        q;

                }

                else {

                    s.materials
                    .push({

                        codigo:
                            String(
                                p.codigo ?? ''
                            ),

                        qty:
                            q

                    });

                }


                s.temp =
                    null;

                s.stage =
                    'material_more';


                return `${p.descricao || p.tipo || 'Material'} incluído. Deseja adicionar outro material?`;

            }


            case 'material_more':

                if (
                    yes(text)
                ) {

                    s.stage =
                        'material_find';

                    return 'Qual é o próximo material?';

                }


                if (
                    no(text)
                ) {

                    s.done.materials =
                        true;

                    response =
                        'Materiais concluídos.';

                    break;

                }


                return 'Responda sim para adicionar outro material ou não para continuar.';


            /* ================= */
            /* MÃO DE OBRA */
            /* ================= */

            case 'labor_yes':

                if (
                    no(text)
                ) {

                    s.done.labor =
                        true;

                    response =
                        'Sem mão de obra cadastrada no cálculo.';

                    break;

                }


                if (
                    !yes(text)
                ) {

                    return 'Responda sim para incluir mão de obra ou não para continuar sem ela.';

                }


                s.stage =
                    'employee_find';

                return 'Qual funcionário será considerado?';


            case 'employee_find': {

                const chosen =
                    byNumber(
                        text,
                        s.options
                    );


                if (chosen) {

                    s.temp =
                        chosen;

                    s.stage =
                        'employee_hours';

                    s.options =
                        [];

                    return `Selecionado: ${employeeText(chosen)}. Quantas horas?`;

                }


                const found =
                    employees(
                        text
                    );


                if (
                    !found.length
                ) {

                    return 'Não encontrei esse funcionário entre os ativos.';

                }


                if (
                    found.length === 1

                    ||

                    (
                        found[0].score
                        >=
                        800

                        &&

                        (
                            !found[1]

                            ||

                            found[0].score
                            -
                            found[1].score
                            >=
                            100
                        )
                    )
                ) {

                    s.temp =
                        found[0]
                            .item;

                    s.stage =
                        'employee_hours';

                    return `Encontrei ${employeeText(s.temp)}. Quantas horas?`;

                }


                s.options =
                    found
                    .slice(
                        0,
                        6
                    )
                    .map(
                        x =>
                            x.item
                    );


                return optionsMessage(

                    'Encontrei estes funcionários:',

                    s.options,

                    employeeText

                );

            }


            case 'employee_hours': {

                const h =
                    parseHours(
                        text
                    );


                if (
                    !(h > 0)
                ) {

                    return 'Informe as horas. Ex.: 4 horas ou 8 horas.';

                }


                const f =
                    s.temp;


                const old =
                    s.labor
                    .find(
                        x =>
                            String(
                                x.id
                            )
                            ===
                            String(
                                f.id
                            )
                    );


                if (old) {

                    old.hours =
                        h;

                }

                else {

                    s.labor
                    .push({

                        id:
                            String(
                                f.id ?? ''
                            ),

                        hours:
                            h

                    });

                }


                s.temp =
                    null;

                s.stage =
                    'employee_more';


                return `${f.nome} incluído com ${h} hora(s). Deseja adicionar outro funcionário?`;

            }


            case 'employee_more':

                if (
                    yes(text)
                ) {

                    s.stage =
                        'employee_find';

                    return 'Qual é o próximo funcionário?';

                }


                if (
                    no(text)
                ) {

                    s.done.labor =
                        true;

                    response =
                        'Mão de obra concluída.';

                    break;

                }


                return 'Responda sim para adicionar outro funcionário ou não para continuar.';


            /* ================= */
            /* DESLOCAMENTO */
            /* ================= */

            case 'travel_yes':

                if (
                    no(text)
                ) {

                    s.useTravel =
                        false;

                    s.done.travel =
                        true;

                    response =
                        'Sem custo de deslocamento.';

                    break;

                }


                if (
                    !yes(text)
                ) {

                    return 'Responda sim se haverá deslocamento ou não para continuar.';

                }


                s.useTravel =
                    true;


                s.options =
                    cc()
                    .veiculos
                    .filter(
                        x =>
                            x.ativo
                            !==
                            false
                    );


                if (
                    !s.options.length
                ) {

                    s.useTravel =
                        false;

                    s.done.travel =
                        true;

                    response =
                        'Não há veículos ativos cadastrados. Vou seguir sem deslocamento.';

                    break;

                }


                s.stage =
                    'vehicle_find';


                return optionsMessage(

                    'Qual veículo será utilizado?',

                    s.options,

                    vehicleText

                );


            case 'vehicle_find': {

                const chosen =
                    byNumber(
                        text,
                        s.options
                    )

                    ||

                    vehicles(
                        text
                    )[0]
                    ?.item;


                if (
                    !chosen
                ) {

                    return 'Não encontrei esse veículo.';

                }


                s.vehicleId =
                    String(
                        chosen.id ?? ''
                    );

                s.options =
                    [];

                s.stage =
                    'km';


                return `Veículo: ${vehicleText(chosen)}. Informe a quilometragem TOTAL, já considerando ida e volta. Ex.: 24 km.`;

            }


            case 'km': {

                const km =
                    parseKm(
                        text
                    );


                if (
                    !(km > 0)
                ) {

                    return 'Informe a distância total em km. Ex.: 24 km.';

                }


                s.totalKm =
                    km;

                s.done.travel =
                    true;

                response =
                    `Distância total registrada: ${km} km.`;

                break;

            }


            /* ================= */
            /* EQUIPAMENTOS */
            /* ================= */

            case 'equipment_yes':

                if (
                    no(text)
                ) {

                    s.done.equipment =
                        true;

                    response =
                        'Sem equipamentos.';

                    break;

                }


                if (
                    !yes(text)
                ) {

                    return 'Responda sim para incluir equipamento ou não para continuar.';

                }


                s.stage =
                    'equipment_find';

                return 'Qual equipamento deseja incluir?';


            case 'equipment_find': {

                const chosen =
                    byNumber(
                        text,
                        s.options
                    );


                if (chosen) {

                    s.temp =
                        chosen;

                    s.stage =
                        'equipment_qty';

                    s.options =
                        [];


                    return `Selecionado: ${equipmentText(chosen)}. Qual quantidade de ${chosen.tipoCalculo || 'utilização'}?`;

                }


                const found =
                    equipments(
                        text
                    );


                if (
                    !found.length
                ) {

                    return 'Não encontrei esse equipamento entre os ativos.';

                }


                if (
                    found.length === 1

                    ||

                    (
                        found[0].score
                        >=
                        800

                        &&

                        (
                            !found[1]

                            ||

                            found[0].score
                            -
                            found[1].score
                            >=
                            100
                        )
                    )
                ) {

                    s.temp =
                        found[0]
                            .item;

                    s.stage =
                        'equipment_qty';


                    return `Encontrei ${equipmentText(s.temp)}. Qual quantidade de ${s.temp.tipoCalculo || 'utilização'}?`;

                }


                s.options =
                    found
                    .slice(
                        0,
                        6
                    )
                    .map(
                        x =>
                            x.item
                    );


                return optionsMessage(

                    'Encontrei estes equipamentos:',

                    s.options,

                    equipmentText

                );

            }


            case 'equipment_qty': {

                const q =
                    parseQuantity(
                        text
                    );


                if (
                    !(q > 0)
                ) {

                    return 'Informe uma quantidade maior que zero.';

                }


                const e =
                    s.temp;


                const old =
                    s.equipment
                    .find(
                        x =>
                            String(
                                x.id
                            )
                            ===
                            String(
                                e.id
                            )
                    );


                if (old) {

                    old.qty =
                        q;

                }

                else {

                    s.equipment
                    .push({

                        id:
                            String(
                                e.id ?? ''
                            ),

                        qty:
                            q

                    });

                }


                s.temp =
                    null;

                s.stage =
                    'equipment_more';


                return `${e.nome} incluído. Deseja adicionar outro equipamento?`;

            }


            case 'equipment_more':

                if (
                    yes(text)
                ) {

                    s.stage =
                        'equipment_find';

                    return 'Qual é o próximo equipamento?';

                }


                if (
                    no(text)
                ) {

                    s.done.equipment =
                        true;

                    response =
                        'Equipamentos concluídos.';

                    break;

                }


                return 'Responda sim para adicionar outro equipamento ou não para continuar.';


            /* ================= */
            /* OUTROS CUSTOS */
            /* ================= */

            case 'extras_yes':

                if (
                    no(text)
                ) {

                    s.done.extras =
                        true;

                    response =
                        'Sem outros custos.';

                    break;

                }


                if (
                    !yes(text)
                ) {

                    return 'Responda sim para incluir outro custo ou não para continuar.';

                }


                s.stage =
                    'extra_name';

                return 'Qual a descrição do custo? Ex.: aluguel de andaime.';


            case 'extra_name':

                s.temp = {

                    descricao:
                        String(text)
                        .trim()

                };

                s.stage =
                    'extra_value';


                return `Qual o valor total de "${s.temp.descricao}"?`;


            case 'extra_value': {

                const value =
                    parseQuantity(
                        text
                    );


                if (
                    !(value > 0)
                ) {

                    return 'Informe um valor maior que zero. Ex.: 150 ou 150,00.';

                }


                s.extras
                .push({

                    descricao:
                        s.temp
                            .descricao,

                    valor:
                        value

                });


                s.temp =
                    null;

                s.stage =
                    'extra_more';


                return `Custo incluído por ${money(value)}. Deseja adicionar outro custo?`;

            }


            case 'extra_more':

                if (
                    yes(text)
                ) {

                    s.stage =
                        'extra_name';

                    return 'Qual é o próximo custo?';

                }


                if (
                    no(text)
                ) {

                    s.done.extras =
                        true;

                    response =
                        'Outros custos concluídos.';

                    break;

                }


                return 'Responda sim para adicionar outro custo ou não para continuar.';


            /* ================= */
            /* PAGAMENTO */
            /* ================= */

            case 'payment':

                if (
                    !skip(text)
                ) {

                    s.payment =
                        String(text)
                        .trim();

                }


                s.done.payment =
                    true;


                response =
                    s.payment

                        ?

                        `Pagamento: ${s.payment}.`

                        :

                        'Pagamento deixado em branco.';

                break;


            /* ================= */
            /* PRAZO */
            /* ================= */

            case 'delivery':

                if (
                    !skip(text)
                ) {

                    s.delivery =
                        String(text)
                        .trim();

                }


                s.done.delivery =
                    true;


                response =
                    s.delivery

                        ?

                        `Prazo de entrega: ${s.delivery}.`

                        :

                        'Prazo deixado em branco.';

                break;


            /* ================= */
            /* VALIDADE */
            /* ================= */

            case 'validity': {

                if (
                    skip(text)
                ) {

                    s.done.validity =
                        true;

                    response =
                        'Validade deixada em branco.';

                    break;

                }


                const v =
                    parseValidity(
                        text
                    );


                if (!v) {

                    return 'Use, por exemplo, "7 dias", "15 dias" ou responda "pular".';

                }


                s.validity =
                    v;

                s.done.validity =
                    true;

                response =
                    `Validade registrada: ${v}.`;

                break;

            }


            /* ================= */
            /* NOTA */
            /* ================= */

            case 'note':

                if (
                    yes(text)
                ) {

                    s.note =
                        'sim';

                    s.done.note =
                        true;

                    response =
                        'Orçamento com nota.';

                    break;

                }


                if (
                    no(text)
                ) {

                    s.note =
                        'nao';

                    s.done.note =
                        true;

                    response =
                        'Orçamento sem nota. Vou manter a regra de acréscimo já usada pelo Dominus.';

                    break;

                }


                return 'Responda sim para com nota ou não para sem nota.';


            /* ================= */
            /* VALOR ZERO */
            /* ================= */

            case 'zero': {

                const p =
                    t.match(

                        /(?:preco final|total final|fechar em|vender por)\D*(\d[\d.,]*)/

                    );


                if (
                    p
                    &&
                    num(
                        p[1]
                    ) > 0
                ) {

                    s.manualPrice =
                        num(
                            p[1]
                        );

                    return summary(s);

                }


                return 'O orçamento está zerado. Informe um preço final, por exemplo "preço final 2500", ou reinicie para incluir custos.';

            }


            /* ================= */
            /* CONFIRMAR */
            /* ================= */

            case 'confirm':

                if (
                    yes(text)
                    ||
                    /gerar|criar|salvar/
                    .test(t)
                ) {

                    return {

                        gerar:
                            true,

                        text:
                            'Perfeito. Vou gerar o orçamento agora.'

                    };

                }


                if (
                    no(text)
                ) {

                    s.stage =
                        'adjust';

                    return 'Diga o que deseja alterar: materiais, mão de obra, deslocamento, equipamentos, outros custos, pagamento, prazo, validade, nota ou preço final.';

                }


                return 'Responda sim para gerar ou não para fazer ajustes.';


            /* ================= */
            /* AJUSTES */
            /* ================= */

            case 'adjust':

                if (
                    t.includes(
                        'material'
                    )
                ) {

                    s.materials =
                        [];

                    s.done.materials =
                        false;

                    return next(s);

                }


                if (
                    t.includes(
                        'mao de obra'
                    )
                    ||
                    t.includes(
                        'funcionario'
                    )
                ) {

                    s.labor =
                        [];

                    s.done.labor =
                        false;

                    return next(s);

                }


                if (
                    t.includes(
                        'deslocamento'
                    )
                    ||
                    t.includes(
                        'veiculo'
                    )
                    ||
                    t.includes(
                        'km'
                    )
                ) {

                    s.useTravel =
                        false;

                    s.vehicleId =
                        '';

                    s.totalKm =
                        0;

                    s.done.travel =
                        false;

                    return next(s);

                }


                if (
                    t.includes(
                        'equipamento'
                    )
                ) {

                    s.equipment =
                        [];

                    s.done.equipment =
                        false;

                    return next(s);

                }


                if (
                    t.includes(
                        'outro'
                    )
                    ||
                    t.includes(
                        'custo'
                    )
                ) {

                    s.extras =
                        [];

                    s.done.extras =
                        false;

                    return next(s);

                }


                if (
                    t.includes(
                        'pagamento'
                    )
                ) {

                    s.payment =
                        '';

                    s.done.payment =
                        false;

                    return next(s);

                }


                if (
                    t.includes(
                        'prazo'
                    )
                ) {

                    s.delivery =
                        '';

                    s.done.delivery =
                        false;

                    return next(s);

                }


                if (
                    t.includes(
                        'validade'
                    )
                ) {

                    s.validity =
                        '';

                    s.done.validity =
                        false;

                    return next(s);

                }


                if (
                    t.includes(
                        'nota'
                    )
                ) {

                    s.done.note =
                        false;

                    return next(s);

                }


                const p =
                    t.match(

                        /(?:preco|final|fechar|vender)\D*(\d[\d.,]*)/

                    );


                if (
                    p
                    &&
                    num(
                        p[1]
                    ) > 0
                ) {

                    s.manualPrice =
                        num(
                            p[1]
                        );

                    return summary(s);

                }


                return 'Não identifiquei o ajuste. Ex.: "alterar materiais" ou "preço final 3500".';

        }


        /*
            Quando uma etapa foi concluída,
            o assistente procura a próxima
            informação que ainda falta.
        */

        s.stage =
            '';


        const n =
            next(s);


        return response

            ?

            `${response}\n\n${n}`

            :

            n;

    }


    /* ========================= */
    /* SALVAR ORÇAMENTO */
    /* ========================= */

    async function saveQuote() {

        const ses =
            session();

        const s =
            ses.state;

        const calc =
            calculate(s);


        ses.calculation =
            calc;


        if (
            !s.client
            ||
            !s.service
            ||
            !(
                calc.resumo
                    .totalCliente
                >
                0
            )
        ) {

            ai(
                'Não foi possível gerar: cliente, serviço ou valor ainda não estão completos.'
            );

            render();

            return;

        }


        const client =
            arr(
                window.db
                    ?.clientes
            )
            .find(
                x =>
                    norm(
                        x.nome
                    )
                    ===
                    norm(
                        s.client
                    )
            )
            ||
            {};


        const code =
            typeof window
                .obterProximoCodigoOrcamento
            ===
            'function'

                ?

                window
                    .obterProximoCodigoOrcamento()

                :

                Math.max(

                    3687,

                    ...arr(
                        window.db
                            ?.orcamentos
                    )
                    .map(
                        x =>
                            Number(
                                x.codigo
                            )
                            ||
                            0
                    )

                )
                +
                1;


        const description =
            [

                s.serviceText
                ||
                s.service,

                s.measureText

                    ?

                    `Medidas/Quantidade: ${s.measureText}`

                    :

                    ''

            ]
            .filter(Boolean)
            .join(
                ' - '
            );


        const quote = {

            codigo:
                code,

            data:
                today(),

            cliente:
                s.client,

            ac:
                '',

            telefone:
                client.telefone
                ||
                '',

            email:
                client.email
                ||
                '',

            validade:
                s.validity
                ||
                '',

            prazo:
                s.payment
                ||
                '',

            prazoEntrega:
                s.delivery
                ||
                '',

            temNota:
                s.note
                ||
                'sim',

            status:
                'Aguardando',

            preContrato:
                'nao',

            observacoes:
                '',

            itens: [

                {

                    produto:
                        description,

                    qtd:
                        1,

                    valor:
                        calc.resumo
                            .precoBaseCliente,

                    total:
                        calc.resumo
                            .precoBaseCliente

                }

            ],

            total:
                calc.resumo
                    .totalCliente,

            /*
                Este campo é interno.
                Ele não precisa aparecer
                no PDF para o cliente.
            */

            calculoInterno: {

                origem:
                    'Assistente Dominus Local',

                estado:
                    JSON.parse(
                        JSON.stringify(
                            s
                        )
                    ),

                calculo:
                    JSON.parse(
                        JSON.stringify(
                            calc
                        )
                    )

            }

        };


        if (
            !window.db
                .orcamentos
        ) {

            window.db
                .orcamentos =
                    [];

        }


        window.db
            .orcamentos
            .push(
                quote
            );


        window.db
            .ultimoOrcamento =
                code;


        if (
            typeof window.save
            ===
            'function'
        ) {

            await window.save();

        }

        else if (
            typeof window.saveDB
            ===
            'function'
        ) {

            await window.saveDB();

        }


        if (
            typeof window.closeModal
            ===
            'function'
        ) {

            window.closeModal();

        }


        if (
            typeof window.navigate
            ===
            'function'
        ) {

            await window.navigate(
                'orcamentos'
            );

        }


        alert(

            `Orçamento #${code} criado com sucesso pelo Assistente Dominus Local.`

        );


        window
            .chatIAOrcamentoLocal =
                null;

    }


    /* ========================= */
    /* INTERFACE */
    /* ========================= */

    window
        .abrirAssistenteOrcamentoIA =
    function() {

        window
            .chatIAOrcamentoLocal =
        {

            state:
                newState(),

            messages:
                [],

            calculation:
                null,

            busy:
                false

        };


        ai(

            'Olá! 🤖 Sou o Assistente Dominus Local.\n\n' +

            'Eu uso somente os dados internos do ERP: clientes, estoque, funcionários, veículos, equipamentos e Centro de Custos. Não uso nenhuma IA da internet, nenhuma API e nenhum crédito.\n\n' +

            'Você pode começar com uma frase como:\n' +

            '"Fachada em ACM para Mercado Central, 6 x 1,20 m"\n\n' +

            'Ou pode simplesmente me dizer o nome do cliente.'

        );


        render();

    };


    function render() {

        const ses =
            session();


        const calc =
            ses.calculation
            ||
            calculate(
                ses.state
            );


        const html =
            ses.messages
            .map(
                m => {

                    const isAI =
                        m.type
                        ===
                        'ia';


                    return `

                        <div style="
                            display:flex;
                            justify-content:${isAI ? 'flex-start' : 'flex-end'};
                            margin-bottom:12px;
                        ">

                            <div style="
                                max-width:82%;
                                background:${isAI ? '#f3f4f6' : '#7c3aed'};
                                color:${isAI ? '#111827' : '#fff'};
                                padding:12px 14px;
                                border-radius:${isAI ? '6px 16px 16px 16px' : '16px 6px 16px 16px'};
                                line-height:1.5;
                                box-shadow:0 1px 2px rgba(0,0,0,.06);
                            ">

                                ${
                                    esc(
                                        m.text
                                    )
                                    .replace(
                                        /\n/g,
                                        '<br>'
                                    )
                                }

                            </div>

                        </div>

                    `;

                }
            )
            .join('');


        configModal({

            title:
                '🤖 Assistente Dominus - Orçamento',

            size:
                'large',

            confirmText:
                'Fechar',

            onConfirm() {

                closeModal();

            },

            body: `

                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:10px;
                    margin-bottom:10px;
                    padding:10px 12px;
                    border-radius:10px;
                    background:#ecfdf5;
                    border:1px solid #a7f3d0;
                    color:#065f46;
                    font-size:12px;
                ">

                    <span>
                        ● 100% local • sem API • sem créditos • sem IA externa
                    </span>

                    <strong>
                        Total atual:
                        ${
                            money(
                                calc
                                    ?.resumo
                                    ?.totalCliente
                                ||
                                0
                            )
                        }
                    </strong>

                </div>


                <div
                    id="chat-ia-local"
                    style="
                        height:430px;
                        overflow:auto;
                        padding:14px;
                        background:#fff;
                        border-radius:12px;
                        border:1px solid #e5e7eb;
                    "
                >

                    ${html}

                </div>


                <div style="
                    display:flex;
                    gap:8px;
                    margin-top:12px;
                ">

                    <textarea
                        id="entrada-chat-ia-local"
                        rows="2"
                        placeholder="Digite sua resposta..."
                        style="
                            flex:1;
                            resize:none;
                            padding:11px 12px;
                            border:1px solid #d1d5db;
                            border-radius:10px;
                            font-family:inherit;
                        "
                        onkeydown="
                            if(
                                event.key==='Enter'
                                &&
                                !event.shiftKey
                            ){
                                event.preventDefault();
                                enviarMensagemIA();
                            }
                        "
                    ></textarea>


                    <button
                        type="button"
                        class="btn-action"
                        style="
                            width:110px;
                            background:#7c3aed;
                            align-self:stretch;
                        "
                        onclick="
                            enviarMensagemIA()
                        "
                    >

                        Enviar

                    </button>

                </div>


                <div style="
                    margin-top:8px;
                    color:#6b7280;
                    font-size:11px;
                ">

                    Comandos:
                    <b>resumo</b>
                    •
                    <b>reiniciar</b>
                    •
                    <b>pular</b>
                    •
                    <b>estoque + nome do produto</b>

                </div>

            `

        });


        setTimeout(
            () => {

                const box =
                    document
                    .getElementById(
                        'chat-ia-local'
                    );


                if (box) {

                    box.scrollTop =
                        box.scrollHeight;

                }


                const input =
                    document
                    .getElementById(
                        'entrada-chat-ia-local'
                    );


                if (input) {

                    input.focus();

                }

            },

            50

        );

    }


    window.renderChatIA =
        render;


    window.enviarMensagemIA =
    async function() {

        const ses =
            session();


        if (
            ses.busy
        ) {

            return;

        }


        const input =
            document
            .getElementById(
                'entrada-chat-ia-local'
            );


        if (!input) {

            return;

        }


        const text =
            input.value
            .trim();


        if (!text) {

            return;

        }


        input.value =
            '';


        ses.busy =
            true;


        user(
            text
        );


        try {

            const result =
                process(
                    text
                );


            if (
                result
                &&
                typeof result
                ===
                'object'
                &&
                result.gerar
            ) {

                ai(
                    result.text
                );


                ses.calculation =
                    calculate(
                        ses.state
                    );


                render();


                setTimeout(

                    () => {

                        saveQuote()
                        .catch(
                            e => {

                                console.error(
                                    e
                                );


                                ai(

                                    `Erro ao salvar o orçamento: ${e.message || e}`

                                );


                                render();

                            }
                        );

                    },

                    100

                );


                return;

            }


            ai(
                result
            );


            ses.calculation =
                calculate(
                    ses.state
                );

        }

        catch (e) {

            console.error(
                'Assistente Dominus Local:',
                e
            );


            ai(

                `Erro interno do assistente: ${e.message || e}`

            );

        }

        finally {

            ses.busy =
                false;

        }


        render();

    };


    /*
        Compatibilidade com nomes
        usados pelo assistente antigo.
    */

    window.processarRespostaIA =
    function(text) {

        const result =
            process(
                text
            );


        if (
            result
            &&
            typeof result
            ===
            'object'
            &&
            result.gerar
        ) {

            return saveQuote();

        }


        ai(
            result
        );


        session()
            .calculation =
                calculate(
                    session()
                        .state
                );


        render();

    };


    window.criarOrcamentoComIA =
        saveQuote;

})();