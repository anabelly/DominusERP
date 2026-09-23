/* ========================================================= */
/* DOMINUS ERP - PÓS-VENDA                                  */
/* ========================================================= */
(function(){
'use strict';
function garantir(){window.db=window.db||{};if(!Array.isArray(window.db.posVendas))window.db.posVendas=[];if(!Array.isArray(window.db.agenda))window.db.agenda=[];}
function usuario(){return typeof window.usuarioAtualSistema==='function'?window.usuarioAtualSistema():null;}
function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
function dataMaisDias(dias){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+dias);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function dataBR(v){if(!v)return '-';const p=String(v).split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:v;}
function nomeCliente(c){return c?.nome||c?.fantasia||c?.razaoSocial||c?.nomeCompleto||'';}
function btn(cor){
    const estilos={
        '#16a34a':{bg:'#dcfce7',txt:'#15803d',borda:'#bbf7d0'},
        '#f59e0b':{bg:'#fef3c7',txt:'#b45309',borda:'#fde68a'},
        '#dc2626':{bg:'#fee2e2',txt:'#dc2626',borda:'#fecaca'},
        '#2563eb':{bg:'#eff6ff',txt:'#2563eb',borda:'#bfdbfe'}
    };
    const e=estilos[cor]||{bg:'#f8fafc',txt:'#475569',borda:'#e2e8f0'};
    return `border:1px solid ${e.borda};background:${e.bg};color:${e.txt};padding:8px 12px;border-radius:9px;font-size:10px;font-weight:850;cursor:pointer;box-shadow:none`;
}
window.renderPosVenda=function(){
    garantir();
    const l=[...window.db.posVendas].sort((a,b)=>String(a.proximoContato||a.dataContato||'9999').localeCompare(String(b.proximoContato||b.dataContato||'9999')));
    return `
<style>
.pv-main-btn{display:inline-flex;align-items:center;gap:7px;border:0;border-radius:10px;padding:11px 16px;background:var(--primary,#dc2626);color:#fff;font-size:11px;font-weight:850;cursor:pointer;box-shadow:0 6px 16px rgba(220,38,38,.22)}
.pv-card{padding:15px;border:2px solid var(--pv-borda);border-radius:13px;background:var(--pv-fundo)}
</style>
<div class="content-card">
<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
<div><h2 style="margin:0">☎️ Pós-venda</h2><div style="font-size:11px;color:#64748b;margin-top:5px">Acompanhamento de clientes após a finalização dos serviços. OS finalizadas entram automaticamente com retorno para 7 dias.</div></div>
<button type="button" class="pv-main-btn" onclick="novoPosVenda()">＋ Novo Acompanhamento</button>
</div>
<div style="display:grid;gap:12px;margin-top:18px">
${l.map(x=>{
    const realizado=x.statusContato==='Realizado';
    const positivo=realizado && x.resultadoContato==='Positivo';
    const negativo=realizado && x.resultadoContato==='Negativo';
    const cor=positivo?'#15803d':negativo?'#b91c1c':'#2563eb';
    const fundo=positivo?'#dcfce7':negativo?'#fee2e2':'#dbeafe';
    const rotulo=positivo?'Contato realizado • Positivo':negativo?'Contato realizado • Negativo':'Não realizado';
    return `<div class="pv-card" style="--pv-borda:${cor};--pv-fundo:${fundo}">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
        <div>
          <strong>${esc(x.cliente)}</strong> ${x.os?'· '+esc(x.os):''}
          ${x.origemAutomatica?'<span style="margin-left:7px;background:#eef2ff;color:#4338ca;padding:3px 7px;border-radius:999px;font-size:8px;font-weight:900">AUTOMÁTICO</span>':''}
          <div style="font-size:10px;color:#64748b;margin-top:4px">${x.dataContato?'Último contato: '+dataBR(x.dataContato):'Ainda sem contato registrado'}${x.canal&&x.canal!=='A definir'?' · '+esc(x.canal):''}</div>
          <div style="margin-top:7px;font-size:10px;font-weight:900;color:${cor}">${rotulo}</div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">
          ${!realizado?`<button type="button" onclick="realizarContatoPosVenda('${esc(x.id)}')" style="${btn('#16a34a')}">✓ Contato realizado</button>`:''}
          <button type="button" onclick="editarPosVenda('${esc(x.id)}')" style="${btn('#f59e0b')}">✎ Editar</button>
          <button type="button" onclick="excluirPosVenda('${esc(x.id)}')" style="${btn('#dc2626')}">🗑 Excluir</button>
        </div>
      </div>
      <div style="margin-top:10px;font-size:12px"><b>${esc(x.situacao||'Aguardando contato')}</b>${x.retorno?' — '+esc(x.retorno):''}</div>
      ${x.proximoContato&&!realizado?`<div style="margin-top:8px;font-size:10px;color:#2563eb;font-weight:800">📅 Contato previsto: ${dataBR(x.proximoContato)}</div>`:''}
    </div>`;
}).join('')||'<div style="color:#94a3b8;padding:25px">Nenhum pós-venda registrado.</div>'}
</div></div>`};
function modal(x={}){const clientes=(window.db.clientes||[]).map(c=>nomeCliente(c)).filter(Boolean).sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'})).map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');configModal({title:x.id?'Editar Pós-venda':'Novo Pós-venda',size:'large',confirmText:'Salvar',body:`<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px"><label>Cliente<select id="pv-cliente"><option value="">Selecione o cliente</option>${clientes}</select></label><label>OS / Orçamento<input id="pv-os" value="${esc(x.os||'')}"></label><label>Data do contato<input id="pv-data" type="date" value="${esc(x.dataContato||'')}"></label><label>Canal<select id="pv-canal"><option>A definir</option><option>WhatsApp</option><option>Telefone</option><option>E-mail</option><option>Presencial</option></select></label><label>Situação<select id="pv-situacao"><option>Aguardando contato</option><option>Cliente satisfeito</option><option>Aguardando retorno</option><option>Problema relatado</option><option>Nova oportunidade</option><option>Sem interesse no momento</option></select></label><label>Próximo contato<input id="pv-proximo" type="date" value="${esc(x.proximoContato||'')}"></label><label style="grid-column:1/-1">Retorno / observações<textarea id="pv-retorno" rows="5">${esc(x.retorno||'')}</textarea></label></div>`,onConfirm:()=>salvarPosVenda(x.id)});setTimeout(()=>{if(x.cliente)document.getElementById('pv-cliente').value=x.cliente;if(x.canal)document.getElementById('pv-canal').value=x.canal;if(x.situacao)document.getElementById('pv-situacao').value=x.situacao;},0)}
window.novoPosVenda=()=>modal();window.editarPosVenda=id=>{garantir();modal(window.db.posVendas.find(x=>String(x.id)===String(id))||{})};
window.salvarPosVenda=async function(id){garantir();const old=window.db.posVendas.find(x=>String(x.id)===String(id));const r={...(old||{}),id:id||'PV-'+Date.now(),cliente:document.getElementById('pv-cliente').value,os:document.getElementById('pv-os').value.trim(),dataContato:document.getElementById('pv-data').value,canal:document.getElementById('pv-canal').value,situacao:document.getElementById('pv-situacao').value,proximoContato:document.getElementById('pv-proximo').value,retorno:document.getElementById('pv-retorno').value.trim(),statusContato:old?.statusContato||'Não realizado',resultadoContato:old?.resultadoContato||'',criadoEm:old?.criadoEm||new Date().toISOString(),atualizadoEm:new Date().toISOString()};if(!r.cliente){alert('Informe o cliente.');return;}if(old)Object.assign(old,r);else window.db.posVendas.push(r);await save();closeModal();await navigate('pos-venda',false)};


window.realizarContatoPosVenda=function(id){
    garantir();
    const x=window.db.posVendas.find(r=>String(r.id)===String(id));
    if(!x)return;
    const hoje=new Date().toISOString().slice(0,10);
    configModal({
        title:`Contato realizado • ${x.cliente||''}`,
        confirmText:'Concluir Pós-venda',
        body:`<div style="display:grid;gap:12px">
          <label>Data do contato<input id="pvr-data" type="date" value="${hoje}"></label>
          <label>Resultado<select id="pvr-resultado"><option value="Positivo">Positivo</option><option value="Negativo">Negativo</option></select></label>
          <label>Canal<select id="pvr-canal"><option>WhatsApp</option><option>Telefone</option><option>E-mail</option><option>Presencial</option></select></label>
          <label>Retorno do cliente<textarea id="pvr-retorno" rows="5" placeholder="Descreva o retorno recebido..."></textarea></label>
        </div>`,
        onConfirm:async()=>{
            x.dataContato=document.getElementById('pvr-data').value;
            x.resultadoContato=document.getElementById('pvr-resultado').value;
            x.canal=document.getElementById('pvr-canal').value;
            x.retorno=document.getElementById('pvr-retorno').value.trim();
            x.statusContato='Realizado';
            x.situacao=x.resultadoContato==='Positivo'?'Cliente satisfeito':'Problema relatado';
            x.proximoContato='';
            x.atualizadoEm=new Date().toISOString();
            const codigo=String(x.origemOS||x.os||'');
            (window.db.agenda||[]).forEach(a=>{
                if(String(a.origemPosVendaOS||'')===codigo && a.status!=='realizado'){
                    a.status='realizado'; a.realizadoEm=new Date().toISOString(); a.atualizadoEm=new Date().toISOString();
                }
            });
            await save(); closeModal(); await navigate('pos-venda',false);
            if(typeof window.atualizarCentralNotificacoesAgenda==='function')window.atualizarCentralNotificacoesAgenda(false);
        }
    });
};
window.excluirPosVenda=async function(id){
    garantir();
    const x=window.db.posVendas.find(r=>String(r.id)===String(id)); if(!x)return;
    if(!confirm(`Excluir o pós-venda de ${x.cliente||'este cliente'}?`))return;
    window.db.posVendas=window.db.posVendas.filter(r=>String(r.id)!==String(id));
    await save(); await navigate('pos-venda',false);
};

/* Cria Pós-venda + compromisso de baixa prioridade quando uma OS entra em Finalizada. */
window.criarPosVendaDaOS=async function(os){
    garantir();
    if(!os || String(os.status)!=='Finalizada')return null;
    const codigo=String(os.codigo||os.numero||os.id||'').trim();
    if(!codigo)return null;
    const existente=window.db.posVendas.find(x=>String(x.origemOS||'')===codigo || (x.origemAutomatica && String(x.os||'')===codigo));
    const dataContatoPrevista=existente?.proximoContato||dataMaisDias(7);
    let registro=existente;
    if(!registro){
        registro={id:'PV-OS-'+codigo.replace(/[^a-zA-Z0-9_-]/g,'')+'-'+Date.now(),cliente:os.cliente||'',os:codigo,origemOS:codigo,origemAutomatica:true,dataContato:'',canal:'A definir',situacao:'Aguardando contato',statusContato:'Não realizado',resultadoContato:'',proximoContato:dataContatoPrevista,retorno:'Pós-venda criado automaticamente após a finalização da OS.',criadoEm:new Date().toISOString(),atualizadoEm:new Date().toISOString()};
        window.db.posVendas.push(registro);
    }
    const u=usuario();
    const agendaId='AGENDA-POSVENDA-'+codigo.replace(/[^a-zA-Z0-9_-]/g,'');
    const agendaExiste=window.db.agenda.some(a=>String(a.id)===agendaId || String(a.origemPosVendaOS||'')===codigo);
    if(!agendaExiste){
        window.db.agenda.push({id:agendaId,usuarioId:String(u?.id||'master-admin'),titulo:`☎️ Pós-venda • ${codigo} • ${os.cliente||'Cliente'}`,data:dataContatoPrevista,hora:'09:00',horaFim:'',local:'',responsavel:String(u?.usuario||'admin'),prioridade:'baixa',descricao:`Entrar em contato com ${os.cliente||'o cliente'} para realizar o pós-venda da ${codigo}.`,status:'agendado',criadoEm:new Date().toISOString(),atualizadoEm:null,realizadoEm:null,historicoReagendamentos:[],origemPosVendaOS:codigo});
    }
    await save();
    if(typeof window.atualizarCentralNotificacoesAgenda==='function')window.atualizarCentralNotificacoesAgenda(false);
    return registro;
};
if(typeof window.registerPage==='function')window.registerPage('pos-venda',window.renderPosVenda);else{window.pages=window.pages||{};window.pages['pos-venda']=window.renderPosVenda}
})();
