function show(id){document.getElementById(id).hidden=false;}
function hide(id){document.getElementById(id).hidden=true;}
function $(id){return document.getElementById(id);}

/* ===== データ ===== */
var STORE='yafusho_items';
var items=[];
try{var raw=localStorage.getItem(STORE);if(raw)items=JSON.parse(raw)||[];}catch(e){}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(items));}catch(e){}}
var editingId=null;

function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function escA(s){return esc(s).replace(/"/g,'&quot;');}

function thumb(src){return src?'<img class="tbl-thumb" src="'+escA(src)+'" alt="">':'<span class="tbl-thumb empty">—</span>';}
function urlCell(arr){arr=(arr||[]).filter(function(u){return u;});if(!arr.length)return '<span class="muted">—</span>';var h='';for(var i=0;i<arr.length;i++){h+='<a href="'+escA(arr[i])+'" target="_blank" rel="noopener">'+esc(arr[i])+'</a>';}return '<div class="url-cell">'+h+'</div>';}
function catBadge(c){return '<span class="cat-badge">'+esc(c||'単一商品')+'</span>';}

var statusFilter='',listingFilter='';
var selected={},visibleIds=[];

/* ===== 設定（出品内容の選択肢 / 列） — 端末ローカル ===== */
var SETTINGS='yafusho_settings';
var DEFAULT_LISTING=['新規出品','リニューアル-同一ページ','リニューアル-新規ページ','再登録'];
var DEFAULT_COLS=[
  {key:'date',label:'日付',width:110,align:'left'},
  {key:'yahooImg',label:'Yahoo画像',width:90,align:'center'},
  {key:'rakutenImg',label:'楽天画像',width:90,align:'center'},
  {key:'name',label:'商品名',width:220,align:'left'},
  {key:'sales',label:'予想月商',width:100,align:'right'},
  {key:'yahooUrls',label:'ヤフショURL',width:220,align:'left'},
  {key:'rakutenUrls',label:'楽天URL',width:220,align:'left'},
  {key:'pagePlan',label:'制作予定ページ',width:110,align:'center'},
  {key:'listingType',label:'出品内容',width:160,align:'left'},
  {key:'status',label:'状態',width:100,align:'left'},
  {key:'actions',label:'操作',width:130,align:'center'}
];
function getSettings(){var d={listing:DEFAULT_LISTING.slice(),cols:null};try{var c=JSON.parse(localStorage.getItem(SETTINGS));if(c){if(c.listing&&c.listing.length)d.listing=c.listing;if(c.cols)d.cols=c.cols;}}catch(e){}return d;}
function saveSettings(s){try{localStorage.setItem(SETTINGS,JSON.stringify(s));}catch(e){}}
function getListing(){return getSettings().listing;}
function getCols(){
  var s=getSettings();var saved=s.cols;
  if(!saved)return DEFAULT_COLS.map(function(c){return {key:c.key,label:c.label,width:c.width,align:c.align};});
  var out=[],seen={};
  for(var i=0;i<saved.length;i++){var d=null;for(var jj=0;jj<DEFAULT_COLS.length;jj++){if(DEFAULT_COLS[jj].key===saved[i].key)d=DEFAULT_COLS[jj];}if(d){out.push({key:saved[i].key,label:saved[i].label||d.label,width:saved[i].width||d.width,align:saved[i].align||d.align||'left'});seen[saved[i].key]=1;}}
  for(var k=0;k<DEFAULT_COLS.length;k++){if(!seen[DEFAULT_COLS[k].key])out.push({key:DEFAULT_COLS[k].key,label:DEFAULT_COLS[k].label,width:DEFAULT_COLS[k].width,align:DEFAULT_COLS[k].align});}
  return out;
}

function md(){return '<span class="muted">—</span>';}
function imgArr(it,side){var a=it[side+'Imgs'];if(a&&a.length)return a.slice();var s=it[side+'Img'];return s?[s]:[];}
function firstImg(it,side){var a=imgArr(it,side);return a.length?a[0]:'';}
function mainImg(it,side){return it[side+'Main']||firstImg(it,side);}
function stKey(st){return ({'未着手':'s-gray','作成中':'s-orange','確認待ち':'s-blue','完了':'s-green'})[st]||'s-none';}
function statusBadge(st){var map={'未着手':['1','n-gray'],'作成中':['2','n-orange'],'確認待ち':['3','n-blue'],'完了':['4','n-green']};var m=map[st];if(!m)return md();return '<span class="status-badge"><span class="num '+m[1]+'">'+m[0]+'</span>'+esc(st)+'</span>';}
function cellHtml(key,it){
  if(key==='date')return '<td class="mono cell-date">'+(it.date?esc(it.date):md())+'</td>';
  if(key==='yahooImg')return '<td>'+thumb(mainImg(it,'yahoo'))+'</td>';
  if(key==='rakutenImg')return '<td>'+thumb(mainImg(it,'rakuten'))+'</td>';
  if(key==='name')return '<td class="cell-name">'+(it.name?esc(it.name):'<span class="muted">(無題)</span>')+'</td>';
  if(key==='sales')return '<td class="mono">'+((it.sales!==''&&it.sales!=null)?esc(it.sales)+' 万円':md())+'</td>';
  if(key==='yahooUrls')return '<td>'+urlCell(it.yahooUrls)+'</td>';
  if(key==='rakutenUrls')return '<td>'+urlCell(it.rakutenUrls)+'</td>';
  if(key==='pagePlan')return '<td class="mono">'+(it.pagePlan?esc(it.pagePlan):md())+'</td>';
  if(key==='listingType'){var lo=getListing();var lh='<option value=""'+(!it.listingType?' selected':'')+'>未設定</option>';for(var li=0;li<lo.length;li++){lh+='<option'+(it.listingType===lo[li]?' selected':'')+'>'+esc(lo[li])+'</option>';}return '<td><select class="row-sel row-listing" data-id="'+it.id+'">'+lh+'</select></td>';}
  if(key==='status'){var so=['未着手','作成中','確認待ち','完了'];var sh='<option value=""'+(!it.status?' selected':'')+'>未設定</option>';for(var si=0;si<so.length;si++){sh+='<option'+(it.status===so[si]?' selected':'')+'>'+so[si]+'</option>';}return '<td><select class="row-sel row-status '+stKey(it.status)+'" data-id="'+it.id+'">'+sh+'</select></td>';}
  if(key==='actions')return '<td><div class="act-cell"><button class="btn btn-line btn-sm" data-edit="'+it.id+'">編集</button><button class="btn btn-danger btn-sm" data-del="'+it.id+'">削除</button></div></td>';
  return '<td></td>';
}
function renderHead(){var cols=getCols();var h='<tr><th class="col-check" style="width:34px;min-width:34px;text-align:center"><input type="checkbox" id="checkAll"></th>';for(var i=0;i<cols.length;i++){h+='<th style="width:'+cols[i].width+'px;min-width:'+cols[i].width+'px;text-align:'+(cols[i].align||'left')+'">'+esc(cols[i].label)+'</th>';}$('gridHead').innerHTML=h+'</tr>';}

function statusCount(st){if(st==='')return items.length;if(st==='__none__')return items.filter(function(x){return !x.status;}).length;return items.filter(function(x){return x.status===st;}).length;}
function updateStatusPills(){var sp=document.querySelectorAll('#statusRow .spill');for(var i=0;i<sp.length;i++){var st=sp[i].getAttribute('data-status');var c=sp[i].querySelector('.cnt');if(c)c.textContent=statusCount(st);}}

function render(){
  var cols=getCols();
  var tb=$('gridBody');tb.innerHTML='';
  var list=items.filter(function(x){
    if(listingFilter==='__none__'){if(x.listingType)return false;}else if(listingFilter){if(x.listingType!==listingFilter)return false;}
    if(statusFilter==='__none__'){if(x.status)return false;}else if(statusFilter){if(x.status!==statusFilter)return false;}
    return true;
  });
  visibleIds=[];
  for(var i=0;i<list.length;i++){
    var it=list[i];visibleIds.push(it.id);var tr=document.createElement('tr');var tds='';
    for(var c=0;c<cols.length;c++){var cell=cellHtml(cols[c].key,it);var al=cols[c].align;if(al&&al!=='left')cell=cell.replace('<td','<td style="text-align:'+al+'"');tds+=cell;}
    tr.innerHTML='<td class="col-check" style="text-align:center"><input type="checkbox" class="row-check" data-id="'+it.id+'"'+(selected[it.id]?' checked':'')+'></td>'+tds;tb.appendChild(tr);
  }
  $('grid').style.display=list.length?'':'none';
  var es=$('emptyState');es.style.display=list.length?'none':'';
  if(!list.length){
    es.querySelector('.lead').textContent=items.length?'この絞り込みに該当する商品はありません':'まだ商品がありません';
    es.querySelector('p').textContent=items.length?'別の状態タブを選ぶか、「全体」に戻してください。':'「＋ 新規作成」から商品を登録すると、ここに一覧で表示されます。';
  }
  renderCatPills();updateStatusPills();updateBulkBar();
  var ca=$('checkAll');if(ca)ca.checked=(visibleIds.length>0&&visibleIds.every(function(id){return selected[id];}));
}

/* ===== フォーム ===== */
function val(id){var e=$(id);return e?e.value:'';}
function setVal(id,v){var e=$(id);if(e)e.value=v;}
function collectUrls(listId){var ins=document.querySelectorAll('#'+listId+' .url-row input');var a=[];for(var i=0;i<ins.length;i++){if(ins[i].value.trim())a.push(ins[i].value.trim());}return a;}
function resetUrls(id,ph){$(id).innerHTML='<div class="url-row"><input type="text" placeholder="'+ph+'"><button class="url-del">×</button></div>';}
function fillUrls(id,arr,ph){arr=(arr||[]).filter(function(u){return u;});if(!arr.length){resetUrls(id,ph);return;}var h='';for(var i=0;i<arr.length;i++){h+='<div class="url-row"><input type="text" value="'+escA(arr[i])+'" placeholder="'+ph+'"><button class="url-del">×</button></div>';}$(id).innerHTML=h;}
var PH_Y='https://store.shopping.yahoo.co.jp/…';
var PH_R='https://item.rakuten.co.jp/…';

function todayStr(){var d=new Date();var m=('0'+(d.getMonth()+1)).slice(-2);var day=('0'+d.getDate()).slice(-2);return d.getFullYear()+'-'+m+'-'+day;}
function populateListing(){var sel=$('fListing');if(!sel)return;var list=getListing();var cur=sel.value;sel.innerHTML='';for(var i=0;i<list.length;i++){var o=document.createElement('option');o.textContent=list[i];sel.appendChild(o);}if(cur)sel.value=cur;}
function resetForm(){populateListing();mainYahoo='';mainRakuten='';updateMini('yahoo');updateMini('rakuten');galYahoo=[];galRakuten=[];renderStrip('yahoo');renderStrip('rakuten');switchTab('basic');setVal('fDate',todayStr());setVal('fSales','');setVal('fListing','新規出品');setVal('fPagePlan','');setVal('fStatus','未着手');setVal('fName','');resetUrls('urlYahoo',PH_Y);resetUrls('urlRakuten',PH_R);}
function openNew(){editingId=null;$('edTitle').textContent='新規作成';resetForm();show('editModal');}
function openEdit(id){var it=null;for(var i=0;i<items.length;i++){if(items[i].id===id){it=items[i];break;}}if(!it)return;editingId=id;$('edTitle').textContent='編集';populateListing();mainYahoo=it.yahooMain||'';mainRakuten=it.rakutenMain||'';updateMini('yahoo');updateMini('rakuten');galYahoo=imgArr(it,'yahoo');galRakuten=imgArr(it,'rakuten');renderStrip('yahoo');renderStrip('rakuten');switchTab('basic');setVal('fDate',it.date||'');setVal('fSales',it.sales||'');setVal('fListing',it.listingType||'新規出品');setVal('fPagePlan',it.pagePlan||'');setVal('fStatus',it.status||'未着手');setVal('fName',it.name||'');fillUrls('urlYahoo',it.yahooUrls,PH_Y);fillUrls('urlRakuten',it.rakutenUrls,PH_R);show('editModal');}

function gather(){return{id:editingId||('it'+Date.now()),yahooMain:mainYahoo,rakutenMain:mainRakuten,yahooImgs:galYahoo.slice(),rakutenImgs:galRakuten.slice(),date:val('fDate'),sales:val('fSales'),listingType:val('fListing'),pagePlan:val('fPagePlan'),status:val('fStatus'),name:val('fName'),yahooUrls:collectUrls('urlYahoo'),rakutenUrls:collectUrls('urlRakuten')};}
function saveForm(closeAfter){var d=gather();if(editingId){for(var i=0;i<items.length;i++){if(items[i].id===editingId){items[i]=d;break;}}}else{items.push(d);editingId=d.id;$('edTitle').textContent='編集';}persist();render();if(closeAfter)hide('editModal');}

/* ===== ヘッダー/モーダルのボタン ===== */
$('btnLog').onclick=function(){show('logModal');};
$('btnAdd').onclick=openNew;
$('btnAddRow').onclick=function(){items.push({id:'it'+Date.now(),yahooMain:'',rakutenMain:'',yahooImgs:[],rakutenImgs:[],date:todayStr(),sales:'',listingType:'新規出品',pagePlan:'',status:'未着手',name:'',yahooUrls:[],rakutenUrls:[]});persist();render();};
$('btnSaveStay').onclick=function(){saveForm(false);};
$('btnSaveClose').onclick=function(){saveForm(true);};

/* 各種管理（出品内容の選択肢） */
function listingRow(v){var d=document.createElement('div');d.className='edit-row';d.innerHTML='<input type="text" value="'+escA(v)+'" placeholder="選択肢名"><button type="button" class="row-del">×</button>';return d;}
function openManage(){var box=$('listingEditor');box.innerHTML='';var list=getListing();for(var i=0;i<list.length;i++){box.appendChild(listingRow(list[i]));}show('manageModal');}
$('btnManage').onclick=openManage;
$('btnAddListing').onclick=function(){$('listingEditor').appendChild(listingRow(''));};
$('btnSaveListing').onclick=function(){var ins=$('listingEditor').querySelectorAll('input');var arr=[];for(var i=0;i<ins.length;i++){if(ins[i].value.trim())arr.push(ins[i].value.trim());}var s=getSettings();s.listing=arr.length?arr:DEFAULT_LISTING.slice();saveSettings(s);populateListing();populateBulkListing();renderCatPills();render();hide('manageModal');log('出品内容の選択肢を更新（'+s.listing.length+'件）');};

/* 項目調整（列の名称・並び・幅） */
function colRow(c){var d=document.createElement('div');d.className='col-edit-row';d.setAttribute('data-key',c.key);var al=c.align||'left';function seg(v,t){return '<button type="button" class="seg-btn'+(al===v?' on':'')+'" data-a="'+v+'">'+t+'</button>';}d.innerHTML='<span class="mv-btns"><button type="button" class="mv up">↑</button><button type="button" class="mv down">↓</button></span><input type="text" class="col-name" value="'+escA(c.label)+'"><span class="col-w-wrap"><input type="number" class="col-w" min="40" value="'+c.width+'"><span class="unit">px</span></span><span class="seg">'+seg('left','左')+seg('center','中')+seg('right','右')+'</span>';return d;}
function openCols(){var box=$('colsEditor');box.innerHTML='';var cols=getCols();for(var i=0;i<cols.length;i++){box.appendChild(colRow(cols[i]));}show('colsModal');}
$('btnCols2').onclick=openCols;
$('btnSaveCols').onclick=function(){var rows=$('colsEditor').querySelectorAll('.col-edit-row');var arr=[];for(var i=0;i<rows.length;i++){arr.push({key:rows[i].getAttribute('data-key'),label:rows[i].querySelector('.col-name').value.trim()||rows[i].getAttribute('data-key'),align:(rows[i].querySelector('.seg-btn.on')?rows[i].querySelector('.seg-btn.on').getAttribute('data-a'):'left'),width:parseInt(rows[i].querySelector('.col-w').value,10)||100});}var s=getSettings();s.cols=arr;saveSettings(s);renderHead();render();hide('colsModal');log('項目を更新');};
$('btnResetCols').onclick=function(){var s=getSettings();s.cols=null;saveSettings(s);renderHead();render();openCols();log('項目をデフォルトに戻す');};
$('btnBulkDel').onclick=function(){if(items.length&&confirm('全ての商品を削除します。よろしいですか？')){items=[];persist();render();}};

/* 閉じる系 */
var closers=document.querySelectorAll('[data-close]');
for(var j=0;j<closers.length;j++){closers[j].addEventListener('click',function(){hide(this.getAttribute('data-close'));});}
var overlays=document.querySelectorAll('.overlay');
for(var k=0;k<overlays.length;k++){overlays[k].addEventListener('click',function(e){if(e.target===this)this.hidden=true;});}

/* 画像カラム（楽天/Yahoo） */
/* ===== タブ切り替え ===== */
function switchTab(name){var ts=document.querySelectorAll('.mtab');for(var i=0;i<ts.length;i++){ts[i].classList.toggle('on',ts[i].getAttribute('data-tab')===name);}if($('panel-basic'))$('panel-basic').hidden=(name!=='basic');if($('panel-images'))$('panel-images').hidden=(name!=='images');}
var mtabs=document.querySelectorAll('.mtab');
for(var mt=0;mt<mtabs.length;mt++){mtabs[mt].addEventListener('click',function(){switchTab(this.getAttribute('data-tab'));});}

/* ===== 画像ギャラリー（複数・並び替え） ===== */
var galYahoo=[],galRakuten=[],mainYahoo='',mainRakuten='';
function galOf(side){return side==='yahoo'?galYahoo:galRakuten;}
function updateMini(side){
  var el=$(side==='yahoo'?'miniYahoo':'miniRakuten');if(!el)return;
  var src=side==='yahoo'?mainYahoo:mainRakuten;
  var tag='<span class="tag-badge '+(side==='yahoo'?'tb-y':'tb-r')+'">'+(side==='yahoo'?'Y':'R')+'</span>';
  if(src){el.innerHTML=tag+'<img src="'+escA(src)+'" alt=""><button type="button" class="mini-clear" data-main="'+side+'" title="削除">×</button>';}
  else{el.innerHTML=tag+'<div class="mini-ph">＋ 画像</div>';}
}
function renderStrip(side){
  var arr=galOf(side);var el=$(side==='yahoo'?'stripYahoo':'stripRakuten');if(!el)return;
  if(!arr.length){el.innerHTML='<div class="strip-empty">まだ画像がありません</div>';return;}
  var h='';
  for(var i=0;i<arr.length;i++){
    h+='<div class="strip-item">'+
       '<span class="strip-no">'+(i===0?'メイン':(i+1)+'枚目')+'</span>'+
       '<img src="'+escA(arr[i])+'" alt="">'+
       '<div class="strip-ctrls">'+
         '<button type="button" class="sbtn mv-l" data-side="'+side+'" data-idx="'+i+'" title="左へ">←</button>'+
         '<button type="button" class="sbtn mv-r" data-side="'+side+'" data-idx="'+i+'" title="右へ">→</button>'+
         '<button type="button" class="sbtn strip-del" data-side="'+side+'" data-idx="'+i+'" title="削除">×</button>'+
       '</div></div>';
  }
  el.innerHTML=h;
}
function addFiles(side,files){
  if(!files||!files.length)return;
  var list=Array.prototype.slice.call(files).sort(function(a,b){return (a.name||'').localeCompare((b.name||''),undefined,{numeric:true,sensitivity:'base'});});
  var arr=galOf(side);var slots=[];var pending=list.length;
  for(var i=0;i<list.length;i++)slots.push(null);
  for(var i=0;i<list.length;i++){(function(f,pos){if(!f||!/^image\//.test(f.type)){slots[pos]='';pending--;if(pending===0)flush();return;}var r=new FileReader();r.onload=function(){slots[pos]=r.result;pending--;if(pending===0)flush();};r.onerror=function(){slots[pos]='';pending--;if(pending===0)flush();};r.readAsDataURL(f);})(list[i],i);}
  function flush(){for(var k=0;k<slots.length;k++){if(slots[k])arr.push(slots[k]);}renderStrip(side);}
}
function wireDrop(dzId,fileId,side){
  var dz=$(dzId),file=$(fileId);if(!dz)return;
  dz.addEventListener('click',function(){file.click();});
  file.addEventListener('change',function(e){addFiles(side,e.target.files);file.value='';});
  dz.addEventListener('dragover',function(e){e.preventDefault();dz.classList.add('drag');});
  dz.addEventListener('dragleave',function(){dz.classList.remove('drag');});
  dz.addEventListener('drop',function(e){e.preventDefault();dz.classList.remove('drag');addFiles(side,e.dataTransfer.files);});
}
wireDrop('dzYahoo','fileYahoo','yahoo');
wireDrop('dzRakuten','fileRakuten','rakuten');
function setMain(side,src){if(side==='yahoo')mainYahoo=src;else mainRakuten=src;updateMini(side);}
function wireMini(elId,fileId,side){
  var el=$(elId),file=$(fileId);if(!el)return;
  function readF(f){if(!f||!/^image\//.test(f.type))return;var r=new FileReader();r.onload=function(){setMain(side,r.result);};r.readAsDataURL(f);}
  el.addEventListener('click',function(e){if(e.target.classList&&e.target.classList.contains('mini-clear'))return;file.click();});
  file.addEventListener('change',function(e){readF(e.target.files[0]);file.value='';});
  el.addEventListener('dragover',function(e){e.preventDefault();el.classList.add('drag');});
  el.addEventListener('dragleave',function(){el.classList.remove('drag');});
  el.addEventListener('drop',function(e){e.preventDefault();el.classList.remove('drag');readF(e.dataTransfer.files[0]);});
}
wireMini('miniYahoo','fileMiniYahoo','yahoo');
wireMini('miniRakuten','fileMiniRakuten','rakuten');

/* URL欄の追加・削除 */
function makeUrlRow(ph){var d=document.createElement('div');d.className='url-row';d.innerHTML='<input type="text" placeholder="'+ph+'"><button class="url-del">×</button>';return d;}
var adders=document.querySelectorAll('[data-addurl]');
for(var a=0;a<adders.length;a++){adders[a].addEventListener('click',function(){var id=this.getAttribute('data-addurl');var list=$(id);list.appendChild(makeUrlRow(id==='urlYahoo'?PH_Y:PH_R));});}
document.addEventListener('click',function(e){
  var t=e.target;
  if(t&&t.classList&&t.classList.contains('mini-clear')){var ms=t.getAttribute('data-main');if(ms==='yahoo')mainYahoo='';else mainRakuten='';updateMini(ms);return;}
  if(t&&t.classList&&t.classList.contains('seg-btn')){var sg=t.parentNode;var bs=sg.querySelectorAll('.seg-btn');for(var b=0;b<bs.length;b++)bs[b].classList.remove('on');t.classList.add('on');return;}
  if(t&&t.classList&&(t.classList.contains('mv-l')||t.classList.contains('mv-r')||t.classList.contains('strip-del'))){
    var sd=t.getAttribute('data-side');var ix=parseInt(t.getAttribute('data-idx'),10);var ar=galOf(sd);
    if(t.classList.contains('strip-del'))ar.splice(ix,1);
    else if(t.classList.contains('mv-l')&&ix>0){var a0=ar[ix-1];ar[ix-1]=ar[ix];ar[ix]=a0;}
    else if(t.classList.contains('mv-r')&&ix<ar.length-1){var a1=ar[ix+1];ar[ix+1]=ar[ix];ar[ix]=a1;}
    renderStrip(sd);return;
  }
  if(t&&t.classList&&t.classList.contains('row-del')){var r0=t.closest('.edit-row');if(r0)r0.remove();return;}
  if(t&&t.classList&&t.classList.contains('mv')){var row=t.closest('.col-edit-row');if(row){var bx=row.parentNode;if(t.classList.contains('up')&&row.previousElementSibling){bx.insertBefore(row,row.previousElementSibling);}else if(t.classList.contains('down')&&row.nextElementSibling){bx.insertBefore(row.nextElementSibling,row);}}return;}
  if(t&&t.classList&&t.classList.contains('url-del')){var row=t.closest('.url-row');var list=row.parentNode;if(list.children.length>1){row.remove();}else{row.querySelector('input').value='';}return;}
  if(t&&t.getAttribute){
    var ed=t.getAttribute('data-edit');if(ed){openEdit(ed);return;}
    var dl=t.getAttribute('data-del');if(dl){if(confirm('この商品を削除しますか？')){items=items.filter(function(x){return x.id!==dl;});persist();render();}return;}
  }
});

/* ピル */
function renderCatPills(){
  var el=$('catPills');if(!el)return;
  var opts=getListing();
  function cnt(v){if(v==='')return items.length;if(v==='__none__')return items.filter(function(x){return !x.listingType;}).length;return items.filter(function(x){return x.listingType===v;}).length;}
  var h='<button class="pill'+(listingFilter===''?' on':'')+'" data-listing="">全体<span class="cnt">'+cnt('')+'</span></button>';
  for(var i=0;i<opts.length;i++){h+='<button class="pill'+(listingFilter===opts[i]?' on':'')+'" data-listing="'+escA(opts[i])+'">'+esc(opts[i])+'<span class="cnt">'+cnt(opts[i])+'</span></button>';}
  h+='<button class="pill'+(listingFilter==='__none__'?' on':'')+'" data-listing="__none__">未設定<span class="cnt">'+cnt('__none__')+'</span></button>';
  el.innerHTML=h;
}
function populateBulkListing(){var el=$('bulkListing');if(!el)return;var opts=getListing();var o='<option value="">出品内容：変更なし</option>';for(var i=0;i<opts.length;i++)o+='<option>'+esc(opts[i])+'</option>';el.innerHTML=o;}
function updateBulkBar(){var n=0;for(var k in selected){if(selected[k])n++;}var bar=$('bulkBar');if(!bar)return;if(n>0){bar.hidden=false;var bc=$('bulkCount');if(bc)bc.textContent=n+'件選択';}else{bar.hidden=true;}}
function toggleAll(on){for(var i=0;i<visibleIds.length;i++){if(on)selected[visibleIds[i]]=true;else delete selected[visibleIds[i]];}render();updateBulkBar();}
function setField(id,field,v){for(var i=0;i<items.length;i++){if(items[i].id===id){items[i][field]=v;break;}}persist();render();updateBulkBar();}
function bulkApply(){var st=$('bulkStatus').value;var ls=$('bulkListing').value;var ids=[];for(var k in selected){if(selected[k])ids.push(k);}if(!ids.length)return;if(!st&&!ls){return;}for(var i=0;i<items.length;i++){if(selected[items[i].id]){if(st)items[i].status=st;if(ls)items[i].listingType=ls;}}persist();log('一括更新: '+ids.length+'件'+(st?' 状態→'+st:'')+(ls?' 出品内容→'+ls:''));selected={};$('bulkStatus').value='';if($('bulkListing'))$('bulkListing').value='';render();updateBulkBar();}
function bulkClear(){selected={};render();updateBulkBar();}
function wirePills(rowSel,pillSel){var ps=document.querySelectorAll(rowSel+' '+pillSel);for(var i=0;i<ps.length;i++){ps[i].addEventListener('click',function(){for(var j=0;j<ps.length;j++){ps[j].classList.remove('on');}this.classList.add('on');});}}
populateBulkListing();renderCatPills();
if($('catPills'))$('catPills').addEventListener('click',function(e){var b=e.target;while(b&&b!==this&&!(b.classList&&b.classList.contains('pill')))b=b.parentNode;if(!b||!b.classList||!b.classList.contains('pill'))return;listingFilter=b.getAttribute('data-listing')||'';render();});
if($('bulkApply'))$('bulkApply').onclick=bulkApply;
if($('bulkClear'))$('bulkClear').onclick=bulkClear;
document.addEventListener('change',function(e){var t=e.target;if(!t||!t.classList)return;
  if(t.classList.contains('row-status')){setField(t.getAttribute('data-id'),'status',t.value);return;}
  if(t.classList.contains('row-listing')){setField(t.getAttribute('data-id'),'listingType',t.value);return;}
  if(t.id==='checkAll'){toggleAll(t.checked);return;}
  if(t.classList.contains('row-check')){var id=t.getAttribute('data-id');if(t.checked)selected[id]=true;else delete selected[id];updateBulkBar();}
});
var spills=document.querySelectorAll('#statusRow .spill');
for(var sp=0;sp<spills.length;sp++){spills[sp].addEventListener('click',function(){for(var q=0;q<spills.length;q++){spills[q].classList.remove('on');}this.classList.add('on');statusFilter=this.getAttribute('data-status')||'';render();});}

/* ===== GitHub 設定 ===== */
var CFG='yafusho_cfg';
function getCfg(){var d={owner:'kaiyoshida0318',repo:'yafusho-gazo',branch:'main',pat:''};try{var c=JSON.parse(localStorage.getItem(CFG));if(c)for(var k in c){if(c[k])d[k]=c[k];}}catch(e){}return d;}
function saveCfg(c){try{localStorage.setItem(CFG,JSON.stringify(c));}catch(e){}}

$('btnAdv').onclick=function(){var b=$('advBox');b.hidden=!b.hidden;this.textContent=(b.hidden?'▶':'▼')+' 詳細設定（オーナー／リポジトリ／ブランチ）';};
function openSettings(){var c=getCfg();$('cfgPat').value=c.pat||'';$('cfgOwner').value=c.owner;$('cfgRepo').value=c.repo;$('cfgBranch').value=c.branch;show('settingsModal');}
$('btnSettings').onclick=openSettings;
$('btnSaveSettings').onclick=function(){saveCfg({pat:$('cfgPat').value.trim(),owner:$('cfgOwner').value.trim(),repo:$('cfgRepo').value.trim(),branch:$('cfgBranch').value.trim()||'main'});hide('settingsModal');log('GitHub設定を保存');};

/* ===== ログ ===== */
var LOGS=[];
function log(msg){var t=new Date().toLocaleTimeString('ja-JP');LOGS.unshift('['+t+'] '+msg);if(LOGS.length>500)LOGS.pop();var a=document.querySelector('#logModal textarea');if(a)a.value=LOGS.join('\n');}

/* ===== 進捗表示 ===== */
function prog(on,text){var p=$('ghProgress');if(on){p.hidden=false;p.classList.remove('gh-done');$('ghText').textContent=text||'処理中…';}else{p.hidden=true;}}
function progDone(text){var p=$('ghProgress');p.hidden=false;p.classList.add('gh-done');$('ghText').textContent=text||'✓ 完了';setTimeout(function(){p.hidden=true;p.classList.remove('gh-done');},2500);}

/* ===== GitHub API ===== */
function utf8b64(str){return btoa(unescape(encodeURIComponent(str)));}
function b64utf8(b){return decodeURIComponent(escape(atob(b)));}
function mimeExt(durl){var m=/^data:image\/(\w+)/.exec(durl||'');var e=m?m[1].toLowerCase():'png';return e==='jpeg'?'jpg':e;}
function ghHeaders(pat){return{'Authorization':'Bearer '+pat,'Accept':'application/vnd.github+json'};}

async function ghSha(owner,repo,branch,path,pat){
  var u='https://api.github.com/repos/'+owner+'/'+repo+'/contents/'+path+'?ref='+encodeURIComponent(branch);
  var r=await fetch(u,{headers:ghHeaders(pat)});
  if(r.status===200){var j=await r.json();return j.sha;}
  if(r.status===404)return null;
  throw new Error('GET '+path+' ('+r.status+')');
}
async function ghPut(owner,repo,branch,path,b64,sha,msg,pat){
  var body={message:msg,content:b64,branch:branch};if(sha)body.sha=sha;
  var r=await fetch('https://api.github.com/repos/'+owner+'/'+repo+'/contents/'+path,{method:'PUT',headers:ghHeaders(pat),body:JSON.stringify(body)});
  if(!r.ok){var t=await r.text();throw new Error('PUT '+path+' ('+r.status+') '+t.slice(0,120));}
  return r.json();
}

async function saveToGitHub(){
  var c=getCfg();
  if(!c.pat){alert('先に設定でGitHubのPATを入力してください。');openSettings();return;}
  $('btnSave').disabled=true;
  try{
    // 1) 画像（data:のものだけ）をアップロード → rawURLに置換（複数対応）
    var sides=['yahoo','rakuten'];
    for(var i=0;i<items.length;i++){
      var it=items[i];
      for(var sdi=0;sdi<sides.length;sdi++){
        var side=sides[sdi];var key=side+'Imgs';
        var arr=imgArr(it,side);
        for(var n=0;n<arr.length;n++){
          var src=arr[n];
          if(src&&src.indexOf('data:')===0){
            prog(true,'画像をアップロード中… ('+(i+1)+'/'+items.length+')');
            var ext=mimeExt(src);var path='images/'+it.id+'-'+side+'-'+n+'.'+ext;
            var b64=src.split(',')[1];
            var sha=await ghSha(c.owner,c.repo,c.branch,path,c.pat);
            await ghPut(c.owner,c.repo,c.branch,path,b64,sha,'image '+it.id+' '+side+' '+n,c.pat);
            arr[n]='https://raw.githubusercontent.com/'+c.owner+'/'+c.repo+'/'+c.branch+'/'+path;
            persist();render();
          }
        }
        it[key]=arr;
        var mkey=side+'Main';var msrc=it[mkey];
        if(msrc&&msrc.indexOf('data:')===0){
          prog(true,'画像をアップロード中… ('+(i+1)+'/'+items.length+')');
          var mext=mimeExt(msrc);var mpath='images/'+it.id+'-'+side+'-main.'+mext;
          var msha=await ghSha(c.owner,c.repo,c.branch,mpath,c.pat);
          await ghPut(c.owner,c.repo,c.branch,mpath,msrc.split(',')[1],msha,'image '+it.id+' '+side+' main',c.pat);
          it[mkey]='https://raw.githubusercontent.com/'+c.owner+'/'+c.repo+'/'+c.branch+'/'+mpath;
          persist();render();
        }
      }
      if(it.yahooImg)delete it.yahooImg;
      if(it.rakutenImg)delete it.rakutenImg;
    }
    // 2) data.json を保存
    prog(true,'データを保存中…');
    var json=JSON.stringify(items,null,2);
    var dsha=await ghSha(c.owner,c.repo,c.branch,'data.json',c.pat);
    await ghPut(c.owner,c.repo,c.branch,'data.json',utf8b64(json),dsha,'update data ('+items.length+'件)',c.pat);
    persist();
    progDone('✓ 保存しました');
    log('GitHub保存 完了（'+items.length+'件）');
  }catch(e){
    prog(false);
    alert('GitHub保存に失敗しました:\n'+e.message);
    log('GitHub保存 失敗: '+e.message);
  }finally{
    $('btnSave').disabled=false;
  }
}
$('btnSave').onclick=saveToGitHub;

/* ===== 起動時に GitHub から読み込み（公開リポジトリはPAT不要） ===== */
async function loadFromGitHub(){
  var c=getCfg();
  try{
    var u='https://raw.githubusercontent.com/'+c.owner+'/'+c.repo+'/'+c.branch+'/data.json?t='+Date.now();
    var r=await fetch(u,{cache:'no-store'});
    if(r.ok){
      var arr=await r.json();
      if(Array.isArray(arr)){items=arr;persist();render();log('GitHubから読み込み（'+items.length+'件）');}
    }else if(r.status===404){
      log('data.json は未作成（初回）。');
    }
  }catch(e){log('GitHub読み込みスキップ: '+e.message);}
}


renderHead();
render();
loadFromGitHub();
