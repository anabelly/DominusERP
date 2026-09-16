/* ========================================================= */
/* DOMINUS ERP - RECADOS / OCORRÊNCIAS                      */
/* ========================================================= */

(function(){
'use strict';

let salvandoRecadoOcorrencia = false;

function garantir(){
    window.db = window.db || {};
    if(!Array.isArray(window.db.recadosOcorrencias)) window.db.recadosOcorrencias=[];
}
function usuario(){
    return typeof window.usuarioAtualSistema==='function' ? window.usuarioAtualSistema() : null;
}
function admin(){
    return typeof window.usuarioEhAdministrador==='function' ? window.usuarioEhAdministrador() : false;
}
function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
function fmt(v){if(!v)return '-'; const d=new Date(v); return isNaN(d)?esc(v):d.toLocaleString('pt-BR');}
function podeGerenciar(x){
    const u=usuario();
    return admin() || String(x?.criadoPorId||'')===String(u?.id||'');
}
function visiveis(){
    garantir();
    return window.db.recadosOcorrencias
        .filter(x => x.status!=='Concluído')
        .filter(x => x.visibilidade!=='Administradores' || admin())
        .sort((a,b)=>String(b.criadoEm).localeCompare(String(a.criadoEm)));
}
function estiloBotao(cor='#111827'){
    return `border:0;background:${cor};color:#fff;padding:9px 13px;border-radius:10px;font-size:10px;font-weight:850;cursor:pointer;box-shadow:0 5px 12px rgba(15,23,42,.12);`;
}

window.renderRecadosOcorrencias=function(){
    const lista=visiveis();
    return `
    <style>
    .ro-top{display:flex;justify-content:space-between;gap:15px;align-items:center;flex-wrap:wrap;margin-bottom:18px}
    .ro-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(255px,1fr));gap:18px;align-items:start}
    .ro-note{position:relative;min-height:205px;padding:20px 18px 16px;border-radius:5px 5px 15px 5px;box-shadow:0 10px 24px rgba(15,23,42,.14);transform:rotate(-.25deg);overflow:hidden}
    .ro-note:nth-child(even){transform:rotate(.25deg)}
    .ro-recado{background:#dcfce7;border-top:7px solid #16a34a}.ro-ocorrencia{background:#fee2e2;border-top:7px solid #dc2626}
    .ro-pin{position:absolute;top:8px;right:12px;font-size:18px}.ro-tipo{font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.08em}
    .ro-ac{margin-top:12px;padding:8px 10px;border-radius:9px;background:rgba(255,255,255,.48);font-size:10px;color:#475569}.ro-ac strong{color:#111827}
    .ro-texto{font-size:14px;line-height:1.55;color:#1f2937;white-space:pre-wrap;margin:14px 0 18px}.ro-meta{font-size:9px;color:#64748b;border-top:1px solid rgba(100,116,139,.18);padding-top:10px}
    .ro-actions{margin-top:12px;display:flex;justify-content:flex-end;gap:6px;flex-wrap:wrap}
    .ro-btn-main{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:0;border-radius:10px;padding:11px 16px;background:var(--primary,#dc2626);color:#fff;font-size:11px;font-weight:850;cursor:pointer;box-shadow:0 6px 16px rgba(220,38,38,.22);transition:.18s}.ro-btn-main:hover{transform:translateY(-1px);filter:brightness(1.04)}
    </style>
    <div class="content-card">
      <div class="ro-top">
        <div><h2 style="margin:0">🗒️ Recados / Ocorrências</h2><div style="color:#64748b;font-size:11px;margin-top:5px">Mural interno da empresa</div></div>
        <button type="button" class="ro-btn-main" onclick="novoRecadoOcorrencia()">＋ Novo Recado / Ocorrência</button>
      </div>
      <div class="ro-grid">${lista.length?lista.map(x=>`
        <article class="ro-note ${x.tipo==='Ocorrência'?'ro-ocorrencia':'ro-recado'}">
          <div class="ro-pin">📌</div>
          <div class="ro-tipo" style="color:${x.tipo==='Ocorrência'?'#b91c1c':'#15803d'}">${x.tipo==='Ocorrência'?'🚨 Ocorrência':'💬 Recado'}</div>
          <div class="ro-ac"><strong>A/C:</strong> ${esc(x.atencao||'Todos')}</div>
          <div class="ro-texto">${esc(x.texto)}</div>
          <div class="ro-meta"><strong>Criado por ${esc(x.criadoPorLogin||'-')}</strong> · ${fmt(x.criadoEm)}<br>Visível para: ${esc(x.visibilidade||'Todos')}${x.atualizadoEm?`<br>Editado em: ${fmt(x.atualizadoEm)}`:''}</div>
          ${podeGerenciar(x)?`<div class="ro-actions">
            <button type="button" onclick="concluirRecadoOcorrencia('${esc(x.id)}')" style="${estiloBotao('#16a34a')}">✓ Concluído</button>
            <button type="button" onclick="editarRecadoOcorrencia('${esc(x.id)}')" style="${estiloBotao('#2563eb')}">✎ Editar</button>
            <button type="button" onclick="excluirRecadoOcorrencia('${esc(x.id)}')" style="${estiloBotao('#dc2626')}">Excluir</button>
          </div>`:''}
        </article>`).join(''):`<div style="color:#94a3b8;padding:30px">Nenhum recado ou ocorrência pendente.</div>`}</div>
    </div>`;
};

function abrirFormulario(x=null){
    const editando=!!x;
    configModal({title:editando?'Editar Recado / Ocorrência':'Novo Recado / Ocorrência',size:'medium',confirmText:editando?'Salvar Alterações':'Publicar',body:`
      <div style="display:grid;gap:14px">
        <label>Tipo<select id="ro-tipo"><option value="Recado" ${x?.tipo==='Recado'?'selected':''}>💬 Recado</option><option value="Ocorrência" ${x?.tipo==='Ocorrência'?'selected':''}>🚨 Ocorrência</option></select></label>
        <label>A/C<input id="ro-ac" value="${esc(x?.atencao||'')}" placeholder="Ex.: Produção, Luana, Alexandre, Administrativo..."></label>
        <label>Informação<textarea id="ro-texto" rows="6" placeholder="Digite a informação...">${esc(x?.texto||'')}</textarea></label>
        <label>Quem pode ver?<select id="ro-vis"><option value="Todos" ${x?.visibilidade!=='Administradores'?'selected':''}>Todos</option><option value="Administradores" ${x?.visibilidade==='Administradores'?'selected':''}>Somente administradores</option></select></label>
      </div>`,onConfirm:()=>salvarRecadoOcorrencia(x?.id||null)});
}
window.novoRecadoOcorrencia=()=>abrirFormulario(null);
window.editarRecadoOcorrencia=function(id){
    garantir(); const x=window.db.recadosOcorrencias.find(i=>String(i.id)===String(id));
    if(!x||!podeGerenciar(x))return; abrirFormulario(x);
};
window.salvarRecadoOcorrencia=async function(id=null){
    if(salvandoRecadoOcorrencia)return;
    garantir();
    const texto=document.getElementById('ro-texto')?.value.trim();
    if(!texto){alert('Informe o conteúdo.');return;}
    salvandoRecadoOcorrencia=true;
    try{
        const u=usuario();
        const atual=id?window.db.recadosOcorrencias.find(i=>String(i.id)===String(id)):null;
        if(atual){
            if(!podeGerenciar(atual))return;
            atual.tipo=document.getElementById('ro-tipo').value;
            atual.atencao=document.getElementById('ro-ac')?.value.trim()||'Todos';
            atual.texto=texto;
            atual.visibilidade=document.getElementById('ro-vis').value;
            atual.atualizadoEm=new Date().toISOString();
        }else{
            const novo={id:'RO-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),tipo:document.getElementById('ro-tipo').value,atencao:document.getElementById('ro-ac')?.value.trim()||'Todos',texto,visibilidade:document.getElementById('ro-vis').value,status:'Pendente',criadoEm:new Date().toISOString(),criadoPorId:u?.id||null,criadoPorLogin:u?.usuario||'admin'};
            window.db.recadosOcorrencias.push(novo);
        }
        await save(); closeModal(); await navigate('recados-ocorrencias',false);
    }finally{
        setTimeout(()=>{salvandoRecadoOcorrencia=false;},250);
    }
};
window.concluirRecadoOcorrencia=async function(id){
    garantir(); const x=window.db.recadosOcorrencias.find(i=>String(i.id)===String(id)); if(!x||!podeGerenciar(x))return;
    if(!confirm('Marcar esta publicação como concluída? Ela sairá do mural.'))return;
    x.status='Concluído'; x.concluidoEm=new Date().toISOString(); x.concluidoPor=usuario()?.usuario||'admin'; await save(); await navigate('recados-ocorrencias',false);
};
window.excluirRecadoOcorrencia=async function(id){
    garantir(); const x=window.db.recadosOcorrencias.find(i=>String(i.id)===String(id)); if(!x||!podeGerenciar(x))return;
    if(!confirm('Excluir esta publicação definitivamente?'))return;
    window.db.recadosOcorrencias=window.db.recadosOcorrencias.filter(i=>String(i.id)!==String(id)); await save(); await navigate('recados-ocorrencias',false);
};
if(typeof window.registerPage==='function')window.registerPage('recados-ocorrencias',window.renderRecadosOcorrencias);else{window.pages=window.pages||{};window.pages['recados-ocorrencias']=window.renderRecadosOcorrencias;}
})();
