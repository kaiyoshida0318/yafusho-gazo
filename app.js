function show(id){document.getElementById(id).hidden=false;}
function hide(id){document.getElementById(id).hidden=true;}
function $(id){return document.getElementById(id);}

/* ===== データ ===== */
var STORE='yafusho_items';
var items=[];
try{var raw=localStorage.getItem(STORE);if(raw)items=JSON.parse(raw)||[];}catch(e){}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(items));}catch(e){}}
function reloadItems(){try{var r=localStorage.getItem(STORE);items=r?(JSON.parse(r)||[]):[];}catch(e){items=[];}}
var editingId=null;

function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function escA(s){return esc(s).replace(/"/g,'&quot;');}

function thumb(src){return src?'<img class="tbl-thumb" src="'+escA(src)+'" alt="">':'<span class="tbl-thumb empty">—</span>';}
function urlCell(arr){arr=(arr||[]).filter(function(u){return u;});if(!arr.length)return '<span class="muted">—</span>';var h='';for(var i=0;i<arr.length;i++){h+='<a href="'+escA(arr[i])+'" target="_blank" rel="noopener">'+esc(arr[i])+'</a>';}return '<div class="url-cell">'+h+'</div>';}
function catBadge(c){return '<span class="cat-badge">'+esc(c||'単一商品')+'</span>';}

var statusFilter='',listingFilter='',colResizeMode=false;
var dirty=false;

/* ===== 設定（出品内容の選択肢 / 列） — 端末ローカル ===== */
var SETTINGS='yafusho_settings';
var DEFAULT_LISTING=['新規出品','リニューアル-同一ページ','リニューアル-新規ページ','再登録'];
var DEFAULT_OPTS={
  status:[{l:'未着手',c:'gray',t:'1'},{l:'作成中',c:'orange',t:'2'},{l:'確認待ち',c:'blue',t:'3'},{l:'完了',c:'green',t:'4'}],
  listingType:[{l:'新規出品',c:'green',t:'新'},{l:'リニューアル-同一ページ',c:'blue',t:'同'},{l:'リニューアル-新規ページ',c:'orange',t:'新'},{l:'再登録',c:'gray',t:'再'}],
  pagePlan:[{l:'1',c:'gray',t:'1'},{l:'2',c:'gray',t:'2'},{l:'3',c:'gray',t:'3'},{l:'4',c:'gray',t:'4'}]
};
function cloneOpts(o){var r={};for(var k in o){r[k]=o[k].map(function(x){return {l:x.l,c:x.c,t:x.t};});}return r;}
function mergeOpts(c){var r=cloneOpts(DEFAULT_OPTS);for(var k in r){if(c&&c[k]&&c[k].length){r[k]=c[k].map(function(x){return {l:(x.l||''),c:(x.c||'gray'),t:(x.t!=null?x.t:'')};});}}return r;}
function getOpts(field){return getSettings().opts[field]||DEFAULT_OPTS[field];}
function optByLabel(field,label){if(!label)return null;var a=getOpts(field);for(var i=0;i<a.length;i++){if(a[i].l===label)return a[i];}return null;}
function markHtml(opt){if(!opt)return '';return '<span class="mk mk-'+esc(opt.c||'gray')+'">'+esc(opt.t||'')+'</span>';}
var DEFAULT_CATEGORIES=[{id:'cat_a',label:'新規出品',icon:'letter:A'},{id:'cat_b',label:'リニューアル-同一ページ',icon:'letter:B'},{id:'cat_c',label:'リニューアル-新規ページ',icon:'letter:C'},{id:'cat_d',label:'再登録',icon:'letter:D'}];
var DEFAULT_STATUSES=[{id:'st_todo',label:'未着手',icon:'num:1'},{id:'st_doing',label:'作成中',icon:'num:2'},{id:'st_review',label:'確認待ち',icon:'num:3'},{id:'st_done',label:'完了',icon:'num:4'}];
function getCategories(){var s=getSettings();return (s.categories&&s.categories.length)?s.categories:DEFAULT_CATEGORIES.map(function(c){return {id:c.id,label:c.label,icon:c.icon};});}
function defaultStatusId(){var s=getStatuses();return s.length?s[0].id:'';}
function getStatuses(){var s=getSettings();return (s.statuses&&s.statuses.length)?s.statuses:DEFAULT_STATUSES.map(function(c){return {id:c.id,label:c.label,icon:c.icon};});}
function saveCategories(a){var s=getSettings();s.categories=a;saveSettings(s);}
function saveStatuses(a){var s=getSettings();s.statuses=a;saveSettings(s);}
function catById(id){var a=getCategories();for(var i=0;i<a.length;i++)if(a[i].id===id)return a[i];return null;}
function statusById(id){var a=getStatuses();for(var i=0;i<a.length;i++)if(a[i].id===id)return a[i];return null;}
var LOGO_KEYS={'logo:rakuten':'楽天','logo:yahoo':'Yahoo'};
function isLogoIcon(ic){return typeof ic==='string'&&ic.indexOf('logo:')===0;}
var LETTER_COLORS={A:'#3f9b6e',B:'#2f6fb0',C:'#d98324',D:'#8257c9',E:'#c0392b',F:'#16a085',G:'#2980b9',H:'#e67e22',I:'#9b59b6',J:'#e74c3c',K:'#27ae60',L:'#0e7c8a',M:'#ad6a00',N:'#7d3c98',O:'#c0392b',P:'#117a65',Q:'#1f618d',R:'#bf0000',S:'#6d4c41',T:'#5e35b1',U:'#00838f',V:'#558b2f',W:'#8e24aa',X:'#5d4037',Y:'#ef6c00',Z:'#283593'};
function isLetterIcon(ic){return typeof ic==='string'&&/^letter:[A-Z]$/.test(ic);}
function letterSvg(ic){var ch=ic.split(':')[1];var color=LETTER_COLORS[ch]||'#7a756d';return '<svg class="cat-logo" viewBox="0 0 20 20"><rect width="20" height="20" rx="4" fill="'+color+'"/><text x="10" y="15" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="14" fill="#fff">'+ch+'</text></svg>';}
function logoSvg(ic){if(ic==='logo:rakuten')return '<svg class="cat-logo" viewBox="0 0 20 20"><rect width="20" height="20" rx="4" fill="#bf0000"/><text x="10" y="15" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="14" fill="#fff">R</text></svg>';if(ic==='logo:yahoo')return '<svg class="cat-logo" viewBox="0 0 20 20"><defs><linearGradient id="yg'+Math.random().toString(36).slice(2,7)+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff0033"/><stop offset="1" stop-color="#ff7a00"/></linearGradient></defs><rect width="20" height="20" rx="4" fill="#ff5a1f"/><text x="10" y="15" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="14" fill="#fff">Y</text></svg>';if(isLetterIcon(ic))return letterSvg(ic);return '';}
function iconHtml(ic){if(isLogoIcon(ic)||isLetterIcon(ic))return logoSvg(ic);return esc(ic||'');}
var STATUS_NUM_COLORS={1:'#3f9b6e',2:'#2f6fb0',3:'#d98324',4:'#8257c9'};
function isNumIcon(ic){return typeof ic==='string'&&/^num:[1-4]$/.test(ic);}
function statusNumSvg(ic){var n=parseInt(ic.split(':')[1],10);var color=STATUS_NUM_COLORS[n]||'#7a756d';return '<svg class="status-num" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="'+color+'"/><text x="10" y="14.5" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="12" fill="#fff">'+n+'</text></svg>';}
function statusIconHtml(ic){if(isNumIcon(ic))return statusNumSvg(ic);return '';}
var CAT_ICONS=['📦','✨','🛒','🛍️','📊','🎯','🔥','⭐','🏷️','💡','📸','🎨','📝','🆕','💰','🎁','👕','👟','🧸','🏠','🚗','⚽','🎮','💄','📱','💻','🔧','🌸'];
var DEFAULT_COLS=[
  {key:'date',label:'日付',width:110,align:'left'},
  {key:'yahooImg',label:'Yahoo画像',width:90,align:'center'},
  {key:'rakutenImg',label:'楽天画像',width:90,align:'center'},
  {key:'name',label:'商品名',width:220,align:'left'},
  {key:'sales',label:'予想月商',width:100,align:'right'},
  {key:'searchUrl',label:'検索ページURL',width:200,align:'left'},
  {key:'yahooUrls',label:'ヤフショURL',width:220,align:'left'},
  {key:'rakutenUrls',label:'楽天URL',width:220,align:'left'},
  {key:'pagePlan',label:'制作予定ページ',width:110,align:'center'},
  {key:'listingType',label:'出品内容',width:160,align:'left'},
  {key:'status',label:'状態',width:100,align:'left'},
  {key:'salesMethod',label:'販売手法',width:150,align:'left'},
  {key:'actions',label:'操作',width:90,align:'center'}
];
function getSettings(){var d={opts:cloneOpts(DEFAULT_OPTS),cols:null,colcfg:{},colorder:null,categories:null,statuses:null};try{var c=JSON.parse(localStorage.getItem(SETTINGS));if(c){if(c.opts)d.opts=mergeOpts(c.opts);if(c.cols)d.cols=c.cols;if(c.colcfg&&typeof c.colcfg==='object')d.colcfg=c.colcfg;if(c.colorder&&c.colorder.length)d.colorder=c.colorder;if(c.categories)d.categories=c.categories;if(c.statuses)d.statuses=c.statuses;}}catch(e){}return d;}
function saveSettings(s){try{localStorage.setItem(SETTINGS,JSON.stringify(s));}catch(e){}}
function getListing(){return getOpts('listingType').map(function(o){return o.l;});}
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
function cddItems(field){var arr=[{v:'',label:'未設定',ico:''}];if(field==='listingType'){var cs=getCategories();for(var i=0;i<cs.length;i++)arr.push({v:cs[i].id,label:cs[i].label,ico:iconHtml(cs[i].icon)});}else if(field==='status'){var ss=getStatuses();for(var i=0;i<ss.length;i++)arr.push({v:ss[i].id,label:ss[i].label,ico:statusIconHtml(ss[i].icon)});}else{var op=getOpts('pagePlan');for(var i=0;i<op.length;i++)arr.push({v:op[i].l,label:op[i].l,ico:markHtml(op[i])});}return arr;}
function cddFind(field,value){var a=cddItems(field);for(var i=0;i<a.length;i++)if(a[i].v===value)return a[i];return null;}
function cddCell(field,id,value){return '<td><button type="button" class="cdd" data-field="'+field+'" data-id="'+id+'" data-value="'+escA(value||'')+'"><span class="cdd-cur">'+cddInner(field,value)+'</span><span class="cdd-arrow">\u25be</span></button></td>';}
var cddState={field:null,id:null,btn:null};
function closeCdd(){var m=document.getElementById('cddMenu');if(m)m.hidden=true;cddState.btn=null;}
function cddInner(field,value){var it=cddFind(field,value);if(value&&it)return (it.ico?'<span class="cdd-ico">'+it.ico+'</span>':'')+'<span class="cdd-lbl">'+esc(it.label)+'</span>';return '<span class="cdd-empty">未設定</span>';}
function openCdd(btn){
  var field=btn.getAttribute('data-field');var id=btn.getAttribute('data-id');var cur=btn.getAttribute('data-value')||'';
  var m=document.getElementById('cddMenu');if(!m){m=document.createElement('div');m.id='cddMenu';m.className='cdd-menu';document.body.appendChild(m);}
  var its=cddItems(field);var h='';
  for(var i=0;i<its.length;i++){var it=its[i];h+='<button type="button" class="cdd-item'+(cur===it.v?' on':'')+'" data-v="'+escA(it.v)+'">'+(it.ico?'<span class="cdd-ico">'+it.ico+'</span>':'')+(it.v?'<span class="cdd-lbl">'+esc(it.label)+'</span>':'<span class="cdd-empty">'+esc(it.label)+'</span>')+'</button>';}
  m.innerHTML=h;cddState={field:field,id:id,btn:btn};
  var r=btn.getBoundingClientRect();m.hidden=false;
  var mw=Math.max(r.width,150);m.style.minWidth=mw+'px';
  var left=r.left;if(left+mw>window.innerWidth-8)left=window.innerWidth-mw-8;if(left<8)left=8;m.style.left=left+'px';
  var mh=m.offsetHeight;var top=r.bottom+4;if(top+mh>window.innerHeight-8)top=Math.max(8,r.top-mh-4);m.style.top=top+'px';
}
function cddSelect(v){
  if(!cddState.btn)return;var btn=cddState.btn;
  stageEdit(cddState.id,cddState.field,v);
  btn.setAttribute('data-value',v);
  var cur=btn.querySelector('.cdd-cur');if(cur)cur.innerHTML=cddInner(cddState.field,v);
  closeCdd();
}
var bulkEdit=false;
function bulkInp(type,it,field){var v=(it[field]!=null?it[field]:'');return '<input class="bulk-inp" type="'+type+'" data-id="'+it.id+'" data-field="'+field+'" value="'+escA(v)+'"'+(type==='number'?' min="0" step="1"':'')+'>';}
function bulkArea(it,field){var v=(it[field]!=null?it[field]:'');return '<textarea class="bulk-inp bulk-area" rows="2" data-id="'+it.id+'" data-field="'+field+'" placeholder="改行OK">'+esc(v)+'</textarea>';}
function bulkUrlArea(it,field){var a=(it[field]||[]);return '<textarea class="bulk-inp bulk-area" rows="2" data-id="'+it.id+'" data-field="'+field+'" placeholder="1行に1URL">'+esc(a.join('\n'))+'</textarea>';}
function cellHtml(key,it){
  if(key==='date')return bulkEdit?'<td>'+bulkInp('date',it,'date')+'</td>':'<td class="mono cell-date">'+(it.date?esc(it.date):md())+'</td>';
  if(key==='yahooImg')return '<td>'+thumb(mainImg(it,'yahoo'))+'</td>';
  if(key==='rakutenImg')return '<td>'+thumb(mainImg(it,'rakuten'))+'</td>';
  if(key==='name')return bulkEdit?'<td>'+bulkInp('text',it,'name')+'</td>':'<td class="cell-name">'+(it.name?esc(it.name):'<span class="muted">(無題)</span>')+'</td>';
  if(key==='sales')return bulkEdit?'<td>'+bulkInp('number',it,'sales')+'</td>':'<td class="mono">'+((it.sales!==''&&it.sales!=null)?esc(it.sales)+' 万円':md())+'</td>';
  if(key==='searchUrl')return bulkEdit?'<td>'+bulkInp('text',it,'searchUrl')+'</td>':'<td>'+(it.searchUrl?'<div class="url-cell"><a href="'+escA(it.searchUrl)+'" target="_blank" rel="noopener">'+esc(it.searchUrl)+'</a></div>':md())+'</td>';
  if(key==='yahooUrls')return bulkEdit?'<td>'+bulkUrlArea(it,'yahooUrls')+'</td>':'<td>'+urlCell(it.yahooUrls)+'</td>';
  if(key==='rakutenUrls')return bulkEdit?'<td>'+bulkUrlArea(it,'rakutenUrls')+'</td>':'<td>'+urlCell(it.rakutenUrls)+'</td>';
  if(key==='pagePlan')return cddCell('pagePlan',it.id,it.pagePlan);
  if(key==='listingType')return cddCell('listingType',it.id,it.listingType);
  if(key==='status')return cddCell('status',it.id,it.status);
  if(key==='salesMethod')return bulkEdit?'<td>'+bulkArea(it,'salesMethod')+'</td>':'<td>'+(it.salesMethod?esc(it.salesMethod).replace(/\n/g,'<br>'):md())+'</td>';
  if(key==='actions')return '<td><div class="act-cell"><button class="btn btn-line btn-sm" data-edit="'+it.id+'">編集</button><button class="btn btn-danger btn-sm" data-del="'+it.id+'">削除</button></div></td>';
  return '<td></td>';
}
function colDef(key){for(var i=0;i<DEFAULT_COLS.length;i++){if(DEFAULT_COLS[i].key===key)return DEFAULT_COLS[i];}return null;}
function getColCfg(key){var def=colDef(key);var base={visible:true,width:(def?def.width:null),wrap:'wrap',align:(def?def.align:'left'),headAlign:(def?def.align:'left')};var cc=(getSettings().colcfg||{})[key]||{};return {visible:cc.visible!==false,width:(cc.width!=null?cc.width:base.width),wrap:cc.wrap||base.wrap,align:cc.align||base.align,headAlign:cc.headAlign||base.headAlign};}
function setColCfg(key,patch){var s=getSettings();if(!s.colcfg)s.colcfg={};var cur=s.colcfg[key]||{};for(var k in patch)cur[k]=patch[k];s.colcfg[key]=cur;saveSettings(s);}
function colStyleStr(cc,isHeader){var s='';if(cc.width&&cc.width>0)s+='width:'+cc.width+'px;min-width:'+cc.width+'px;max-width:'+cc.width+'px;';if(cc.wrap==='clip')s+='white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';var a=isHeader?cc.headAlign:cc.align;if(a==='left'||a==='center'||a==='right')s+='text-align:'+a+';';return s;}
function getColOrder(){var keys=DEFAULT_COLS.map(function(c){return c.key;});var saved=getSettings().colorder;if(!saved||!saved.length)return keys.slice();var out=[],seen={};for(var i=0;i<saved.length;i++){if(keys.indexOf(saved[i])>=0&&!seen[saved[i]]){out.push(saved[i]);seen[saved[i]]=1;}}var missing=[];for(var k=0;k<keys.length;k++){if(!seen[keys[k]])missing.push(keys[k]);}if(missing.length){var ai=out.indexOf('actions');if(ai>=0){out=out.slice(0,ai).concat(missing).concat(out.slice(ai));}else{out=out.concat(missing);}}return out;}
function setColOrder(arr){var s=getSettings();s.colorder=arr;saveSettings(s);}
function moveCol(key,dir){var order=getColOrder();var i=order.indexOf(key);if(i<0)return;var step=dir<0?-1:1;var jj=i+step;while(jj>=0&&jj<order.length){if(getColCfg(order[jj]).visible!==false)break;jj+=step;}if(jj<0||jj>=order.length)return;var t=order[i];order[i]=order[jj];order[jj]=t;setColOrder(order);renderHead();render();renderColManager();}
function renderHead(){var order=getColOrder();var h='<tr>';for(var i=0;i<order.length;i++){var key=order[i];var def=colDef(key);if(!def)continue;var cc=getColCfg(key);if(!cc.visible)continue;h+='<th data-col-key="'+key+'" style="'+colStyleStr(cc,true)+'">'+esc(def.label)+(colResizeMode?'<div class="col-resize-handle" data-rk="'+key+'"></div>':'')+'</th>';}$('gridHead').innerHTML=h+'</tr>';}

function statusCount(st){if(st==='')return items.length;if(st==='__none__')return items.filter(function(x){return !x.status;}).length;return items.filter(function(x){return x.status===st;}).length;}
function updateStatusPills(){var sp=document.querySelectorAll('#statusRow .spill');for(var i=0;i<sp.length;i++){var st=sp[i].getAttribute('data-status');var c=sp[i].querySelector('.cnt');if(c)c.textContent=statusCount(st);}}

function updateStickyH(){var el=document.querySelector('.sticky-top');if(!el)return;var hh=Math.ceil(el.getBoundingClientRect().height);document.documentElement.style.setProperty('--sticky-h',hh+'px');}
function render(){
  closeCdd();
  var tb=$('gridBody');tb.innerHTML='';
  var list=items.filter(function(x){
    if(listingFilter==='__none__'){if(x.listingType)return false;}else if(listingFilter){if(x.listingType!==listingFilter)return false;}
    if(statusFilter==='__none__'){if(x.status)return false;}else if(statusFilter){if(x.status!==statusFilter)return false;}
    return true;
  });
  for(var i=0;i<list.length;i++){
    var it=list[i];var tr=document.createElement('tr');var tds='';
    var _ord=getColOrder();for(var c=0;c<_ord.length;c++){var key=_ord[c];if(!colDef(key))continue;var cc=getColCfg(key);if(!cc.visible)continue;var cell=cellHtml(key,it);cell=cell.replace('<td','<td data-col-key="'+key+'" style="'+colStyleStr(cc,false)+'"');tds+=cell;}
    tr.innerHTML=tds;tb.appendChild(tr);
  }
  $('grid').style.display=list.length?'':'none';
  var es=$('emptyState');es.style.display=list.length?'none':'';
  if(!list.length){
    es.querySelector('.lead').textContent=items.length?'この絞り込みに該当する商品はありません':'まだ商品がありません';
    es.querySelector('p').textContent=items.length?'別の状態タブを選ぶか、「全体」に戻してください。':'「＋ 新規作成」から商品を登録すると、ここに一覧で表示されます。';
  }
  renderCatTabs();renderStatusTabs();updateStickyH();
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
function fillSel(id,field,blank){var sel=$(id);if(!sel)return;var opts=getOpts(field);var cur=sel.value;var h=blank?'<option value="">未設定</option>':'';for(var i=0;i<opts.length;i++)h+='<option>'+esc(opts[i].l)+'</option>';sel.innerHTML=h;if(cur)sel.value=cur;}
function fillSelItems(id,arr){var sel=$(id);if(!sel)return;var cur=sel.value;var h='<option value="">未設定</option>';for(var i=0;i<arr.length;i++)h+='<option value="'+escA(arr[i].v)+'">'+esc(arr[i].label)+'</option>';sel.innerHTML=h;sel.value=cur;}
function populateFormSelects(){fillSelItems('fStatus',getStatuses().map(function(s){return {v:s.id,label:s.label};}));fillSelItems('fListing',getCategories().map(function(c){return {v:c.id,label:c.label};}));fillSel('fPagePlan','pagePlan',true);}
function populateListing(){populateFormSelects();}
function resetForm(){populateListing();mainYahoo='';mainRakuten='';updateMini('yahoo');updateMini('rakuten');galYahoo=[];galRakuten=[];renderStrip('yahoo');renderStrip('rakuten');switchTab('basic');setVal('fDate',todayStr());setVal('fSales','');setVal('fListing','');setVal('fPagePlan','');setVal('fStatus',defaultStatusId());setVal('fName','');setVal('fCode','');setVal('fMethod','');setVal('fSearchUrl','');resetUrls('urlYahoo',PH_Y);resetUrls('urlRakuten',PH_R);}
function openNew(){editingId=null;$('edTitle').textContent='新規作成';resetForm();show('editModal');}
function openEdit(id){var it=null;for(var i=0;i<items.length;i++){if(items[i].id===id){it=items[i];break;}}if(!it)return;editingId=id;$('edTitle').textContent='編集';populateListing();mainYahoo=it.yahooMain||'';mainRakuten=it.rakutenMain||'';updateMini('yahoo');updateMini('rakuten');galYahoo=imgArr(it,'yahoo');galRakuten=imgArr(it,'rakuten');renderStrip('yahoo');renderStrip('rakuten');switchTab('basic');setVal('fDate',it.date||'');setVal('fSales',it.sales||'');setVal('fListing',it.listingType||'');setVal('fPagePlan',it.pagePlan||'');setVal('fStatus',it.status||'');setVal('fName',it.name||'');setVal('fCode',it.code||'');setVal('fMethod',it.salesMethod||'');setVal('fSearchUrl',it.searchUrl||'');fillUrls('urlYahoo',it.yahooUrls,PH_Y);fillUrls('urlRakuten',it.rakutenUrls,PH_R);show('editModal');}

function gather(){return{id:editingId||('it'+Date.now()),yahooMain:mainYahoo,rakutenMain:mainRakuten,yahooImgs:galYahoo.slice(),rakutenImgs:galRakuten.slice(),date:val('fDate'),sales:val('fSales'),listingType:val('fListing'),pagePlan:val('fPagePlan'),status:val('fStatus'),name:val('fName'),code:val('fCode'),salesMethod:val('fMethod'),searchUrl:val('fSearchUrl'),yahooUrls:collectUrls('urlYahoo'),rakutenUrls:collectUrls('urlRakuten')};}
function saveForm(closeAfter){var d=gather();if(editingId){for(var i=0;i<items.length;i++){if(items[i].id===editingId){items[i]=d;break;}}}else{items.push(d);editingId=d.id;$('edTitle').textContent='編集';}persist();render();if(closeAfter)hide('editModal');}

/* ===== ヘッダー/モーダルのボタン ===== */
$('btnLog').onclick=function(){show('logModal');};
$('btnAdd').onclick=openNew;
$('btnAddRow').onclick=function(){items.push({id:'it'+Date.now(),yahooMain:'',rakutenMain:'',yahooImgs:[],rakutenImgs:[],date:todayStr(),sales:'',listingType:'',pagePlan:'',status:defaultStatusId(),name:'',code:'',salesMethod:'',searchUrl:'',yahooUrls:[],rakutenUrls:[]});persist();render();};
$('btnSaveStay').onclick=function(){saveForm(false);};
$('btnSaveClose').onclick=function(){saveForm(true);};

/* 各種管理（出品内容の選択肢） */
var MK_COLORS=[['gray','グレー'],['red','赤'],['orange','オレンジ'],['green','緑'],['blue','青'],['purple','紫'],['teal','ティール']];
function colorSel(c){var o='';for(var i=0;i<MK_COLORS.length;i++){o+='<option value="'+MK_COLORS[i][0]+'"'+(c===MK_COLORS[i][0]?' selected':'')+'>'+MK_COLORS[i][1]+'</option>';}return o;}
function optRow(field,opt){opt=opt||{l:'',c:'gray',t:''};var d=document.createElement('div');d.className='opt-row';d.setAttribute('data-field',field);d.innerHTML='<span class="mk-prev mk mk-'+(opt.c||'gray')+'"></span><select class="opt-color">'+colorSel(opt.c||'gray')+'</select><input class="opt-label" value="'+escA(opt.l||'')+'" placeholder="選択肢名"><span class="mv-btns"><button type="button" class="mv up">↑</button><button type="button" class="mv down">↓</button></span><button type="button" class="opt-del">×</button>';return d;}
function contOf(field){return 'optPage';}
function openManage(){var box=$('optPage');if(box){box.innerHTML='';var opts=getOpts('pagePlan');for(var i=0;i<opts.length;i++)box.appendChild(optRow('pagePlan',opts[i]));}show('manageModal');}
function collectOpts(field){var rows=$(contOf(field)).querySelectorAll('.opt-row');var arr=[];for(var i=0;i<rows.length;i++){var l=rows[i].querySelector('.opt-label').value.trim();if(!l)continue;arr.push({l:l,c:rows[i].querySelector('.opt-color').value,t:''});}return arr;}
$('btnManage').onclick=openManage;
var _addBtns=document.querySelectorAll('[data-addopt]');for(var _a=0;_a<_addBtns.length;_a++){_addBtns[_a].addEventListener('click',function(){var f=this.getAttribute('data-addopt');$(contOf(f)).appendChild(optRow(f,{}));});}
(function(){var os=$('optScroll');if(!os)return;
  function rowOf(t){var r=t;while(r&&r!==os&&!(r.classList&&r.classList.contains('opt-row')))r=r.parentNode;return (r&&r.classList&&r.classList.contains('opt-row'))?r:null;}
  function prev(r){if(!r)return;var p=r.querySelector('.mk-prev');if(!p)return;p.className='mk-prev mk mk-'+r.querySelector('.opt-color').value;p.textContent='';}
  os.addEventListener('click',function(e){var t=e.target;var r=rowOf(t);
    if(t.classList.contains('opt-del')){if(r)r.parentNode.removeChild(r);return;}
    if(t.classList.contains('mv')&&r){if(t.classList.contains('up')&&r.previousElementSibling)r.parentNode.insertBefore(r,r.previousElementSibling);else if(t.classList.contains('down')&&r.nextElementSibling)r.parentNode.insertBefore(r.nextElementSibling,r);}
  });
  os.addEventListener('input',function(e){var t=e.target;if(t.classList.contains('opt-mark')||t.classList.contains('opt-color'))prev(rowOf(t));});
  os.addEventListener('change',function(e){var t=e.target;if(t.classList.contains('opt-color'))prev(rowOf(t));});
})();
$('btnSaveOpts').onclick=function(){var s=getSettings();var pp=collectOpts('pagePlan');s.opts.pagePlan=pp.length?pp:DEFAULT_OPTS.pagePlan.map(function(x){return {l:x.l,c:x.c,t:x.t};});saveSettings(s);populateFormSelects();render();hide('manageModal');log('制作予定ページの選択肢を更新');};
/* ===== カテゴリ管理 ===== */
var catIconOpen=-1;
function openCatManager(){catIconOpen=-1;renderCatManager();show('catModal');}
function renderCatManager(){
  var list=$('catList');if(!list)return;list.innerHTML='';var cats=getCategories();
  for(var idx=0;idx<cats.length;idx++){(function(c,idx){
    var row=document.createElement('div');row.className='cat-row';
    var iconBtn=document.createElement('button');iconBtn.type='button';iconBtn.className='cat-icon-btn';
    if(isLogoIcon(c.icon)||isLetterIcon(c.icon))iconBtn.innerHTML=logoSvg(c.icon);else iconBtn.textContent=c.icon||'📦';
    iconBtn.onclick=function(){catIconOpen=(catIconOpen===idx?-1:idx);renderCatManager();};
    var labelInp=document.createElement('input');labelInp.type='text';labelInp.value=c.label;labelInp.className='cat-label-input';
    labelInp.onchange=function(){var a=getCategories();a[idx].label=labelInp.value.trim()||a[idx].label;saveCategories(a);render();};
    var up=document.createElement('button');up.type='button';up.className='cat-mv';up.textContent='▲';up.disabled=idx===0;up.onclick=function(){var a=getCategories();var t=a[idx-1];a[idx-1]=a[idx];a[idx]=t;saveCategories(a);renderCatManager();render();};
    var dn=document.createElement('button');dn.type='button';dn.className='cat-mv';dn.textContent='▼';dn.disabled=idx===cats.length-1;dn.onclick=function(){var a=getCategories();var t=a[idx+1];a[idx+1]=a[idx];a[idx]=t;saveCategories(a);renderCatManager();render();};
    var del=document.createElement('button');del.type='button';del.className='cat-del';del.textContent='🗑';del.onclick=function(){if(!confirm('カテゴリ「'+c.label+'」を削除しますか？\n中のデータは「未設定」になります。'))return;for(var i=0;i<items.length;i++){if(items[i].listingType===c.id)items[i].listingType='';}var a=getCategories();a.splice(idx,1);saveCategories(a);if(listingFilter===c.id)listingFilter='';catIconOpen=-1;persist();renderCatManager();render();};
    row.appendChild(iconBtn);row.appendChild(labelInp);row.appendChild(up);row.appendChild(dn);row.appendChild(del);list.appendChild(row);
    if(catIconOpen===idx){var pal=document.createElement('div');pal.className='cat-icon-palette';
      Object.keys(LOGO_KEYS).forEach(function(lk){var b=document.createElement('button');b.type='button';b.className='cat-icon-opt'+(lk===c.icon?' selected':'');b.innerHTML=logoSvg(lk);b.title=LOGO_KEYS[lk];b.onclick=function(){var a=getCategories();a[idx].icon=lk;saveCategories(a);catIconOpen=-1;renderCatManager();render();};pal.appendChild(b);});
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function(ch){var key='letter:'+ch;var b=document.createElement('button');b.type='button';b.className='cat-icon-opt'+(key===c.icon?' selected':'');b.innerHTML=letterSvg(key);b.onclick=function(){var a=getCategories();a[idx].icon=key;saveCategories(a);catIconOpen=-1;renderCatManager();render();};pal.appendChild(b);});
      CAT_ICONS.forEach(function(ic){var b=document.createElement('button');b.type='button';b.className='cat-icon-opt'+(ic===c.icon?' selected':'');b.textContent=ic;b.onclick=function(){var a=getCategories();a[idx].icon=ic;saveCategories(a);catIconOpen=-1;renderCatManager();render();};pal.appendChild(b);});
      list.appendChild(pal);}
  })(cats[idx],idx);}
}
function addCategory(){var inp=$('newCatLabel');var v=(inp.value||'').trim();if(!v)return;var a=getCategories();a.push({id:'cat_'+Date.now().toString(36),label:v,icon:'📦'});saveCategories(a);inp.value='';renderCatManager();render();}
/* ===== ステータス管理 ===== */
function openStatusManager(){renderStatusManager();show('statusModal');}
function renderStatusManager(){
  var list=$('statusList');if(!list)return;list.innerHTML='';var sts=getStatuses();
  for(var idx=0;idx<sts.length;idx++){(function(s,idx){
    var row=document.createElement('div');row.className='cat-row';
    var numWrap=document.createElement('div');numWrap.className='status-num-picker';
    [null,1,2,3,4].forEach(function(n){var b=document.createElement('button');b.type='button';b.className='status-num-opt';var val=n===null?'':('num:'+n);if((s.icon||'')===val)b.classList.add('selected');if(n===null){b.textContent='—';b.classList.add('status-num-none');}else b.innerHTML=statusNumSvg('num:'+n);b.onclick=function(){var a=getStatuses();a[idx].icon=val;saveStatuses(a);renderStatusManager();render();};numWrap.appendChild(b);});
    var labelInp=document.createElement('input');labelInp.type='text';labelInp.value=s.label;labelInp.className='cat-label-input';
    labelInp.onchange=function(){var a=getStatuses();a[idx].label=labelInp.value.trim()||a[idx].label;saveStatuses(a);render();};
    var up=document.createElement('button');up.type='button';up.className='cat-mv';up.textContent='▲';up.disabled=idx===0;up.onclick=function(){var a=getStatuses();var t=a[idx-1];a[idx-1]=a[idx];a[idx]=t;saveStatuses(a);renderStatusManager();render();};
    var dn=document.createElement('button');dn.type='button';dn.className='cat-mv';dn.textContent='▼';dn.disabled=idx===sts.length-1;dn.onclick=function(){var a=getStatuses();var t=a[idx+1];a[idx+1]=a[idx];a[idx]=t;saveStatuses(a);renderStatusManager();render();};
    var del=document.createElement('button');del.type='button';del.className='cat-del';del.textContent='🗑';del.onclick=function(){if(!confirm('ステータス「'+s.label+'」を削除しますか？\n中のデータは「未設定」になります。'))return;for(var i=0;i<items.length;i++){if(items[i].status===s.id)items[i].status='';}var a=getStatuses();a.splice(idx,1);saveStatuses(a);if(statusFilter===s.id)statusFilter='';persist();renderStatusManager();render();};
    row.appendChild(numWrap);row.appendChild(labelInp);row.appendChild(up);row.appendChild(dn);row.appendChild(del);list.appendChild(row);
  })(sts[idx],idx);}
}
function addStatus(){var inp=$('newStatusLabel');var v=(inp.value||'').trim();if(!v)return;var a=getStatuses();a.push({id:'st_'+Date.now().toString(36),label:v,icon:''});saveStatuses(a);inp.value='';renderStatusManager();render();}
if($('btnManageCats'))$('btnManageCats').onclick=openCatManager;
if($('btnManageStatus'))$('btnManageStatus').onclick=openStatusManager;
if($('btnAddCat'))$('btnAddCat').onclick=addCategory;
if($('btnAddStatus'))$('btnAddStatus').onclick=addStatus;
if($('newCatLabel'))$('newCatLabel').addEventListener('keydown',function(e){if(e.key==='Enter')addCategory();});
if($('newStatusLabel'))$('newStatusLabel').addEventListener('keydown',function(e){if(e.key==='Enter')addStatus();});

/* 項目調整（列の名称・並び・幅） */
/* ===== 項目管理（表示中／非表示・幅・折り返し・揃え・ドラッグ幅調整） ===== */
function getRenderedColWidth(key){var th=document.querySelector('#gridHead th[data-col-key="'+key+'"]');if(!th)return null;var w=th.getBoundingClientRect().width;return w>0?Math.round(w):null;}
function makeColAlignGroup(labelText,value,onChange){var g=document.createElement('label');g.className='col-align-group';var sp=document.createElement('span');sp.className='col-ctrl-label';sp.textContent=labelText;var s=document.createElement('select');s.className='col-align-sel';[['left','左'],['center','中央'],['right','右']].forEach(function(p){var o=document.createElement('option');o.value=p[0];o.textContent=p[1];s.appendChild(o);});s.value=value||'left';s.onchange=function(){onChange(s.value);};g.appendChild(sp);g.appendChild(s);return g;}
function renderColManager(){
  var visWrap=$('colListVisible'),hidWrap=$('colListHidden');if(!visWrap||!hidWrap)return;
  visWrap.innerHTML='';hidWrap.innerHTML='';
  var order=getColOrder();
  var visKeys=[];for(var q=0;q<order.length;q++){if(getColCfg(order[q]).visible!==false)visKeys.push(order[q]);}
  for(var i=0;i<order.length;i++){(function(key){
    var c=colDef(key);if(!c)return;
    var cc=getColCfg(key);var isVis=cc.visible!==false;
    var card=document.createElement('div');card.className='col-card';
    var name=document.createElement('div');name.className='col-card-name';
    if(isVis){
      var vi=visKeys.indexOf(key);
      var ordWrap=document.createElement('span');ordWrap.className='col-ord-wrap';
      var up=document.createElement('button');up.type='button';up.className='col-ord';up.textContent='▲';up.title='上へ';up.disabled=vi<=0;up.onclick=function(){moveCol(key,-1);};
      var dn=document.createElement('button');dn.type='button';dn.className='col-ord';dn.textContent='▼';dn.title='下へ';dn.disabled=vi>=visKeys.length-1;dn.onclick=function(){moveCol(key,1);};
      ordWrap.appendChild(up);ordWrap.appendChild(dn);
      var nm=document.createElement('span');nm.textContent=c.label;
      name.appendChild(ordWrap);name.appendChild(nm);
    }else{name.textContent=c.label;}
    card.appendChild(name);
    if(isVis){
      var controls=document.createElement('div');controls.className='col-card-controls';
      var w=document.createElement('input');w.type='number';w.min='0';w.step='10';w.className='col-width-input';w.title='幅(px)。空欄で自動';
      if(cc.width){w.value=String(cc.width);w.placeholder='自動';}else{w.value='';var m=getRenderedColWidth(c.key);w.placeholder=(m!=null)?(m+'（自動）'):'自動';}
      w.onchange=function(){var v=parseInt((w.value||'').trim(),10);setColCfg(c.key,{width:(isFinite(v)&&v>0)?v:null});renderHead();render();renderColManager();};
      var headAlignG=makeColAlignGroup('タイトル',cc.headAlign||'left',function(val){setColCfg(c.key,{headAlign:val});renderHead();render();});
      var bodyAlignG=makeColAlignGroup('データ',cc.align||'left',function(val){setColCfg(c.key,{align:val});render();});
      var sel=document.createElement('select');sel.className='col-wrap-sel';var o1=document.createElement('option');o1.value='wrap';o1.textContent='折り返す';var o2=document.createElement('option');o2.value='clip';o2.textContent='以降を非表示';sel.appendChild(o1);sel.appendChild(o2);sel.value=cc.wrap||'wrap';
      sel.onchange=function(){setColCfg(c.key,{wrap:sel.value});render();};
      controls.appendChild(w);controls.appendChild(headAlignG);controls.appendChild(bodyAlignG);controls.appendChild(sel);card.appendChild(controls);
      var mv=document.createElement('button');mv.type='button';mv.className='col-move-btn';mv.textContent='非表示にする →';
      mv.onclick=function(){setColCfg(c.key,{visible:false});renderHead();render();renderColManager();};card.appendChild(mv);
      visWrap.appendChild(card);
    }else{
      var mb=document.createElement('button');mb.type='button';mb.className='col-move-btn col-move-back';mb.textContent='← 表示する';
      mb.onclick=function(){setColCfg(c.key,{visible:true});renderHead();render();renderColManager();};card.appendChild(mb);
      hidWrap.appendChild(card);
    }
  })(order[i]);}
  if(!visWrap.children.length){var e1=document.createElement('div');e1.className='col-empty';e1.textContent='表示中の項目がありません';visWrap.appendChild(e1);}
  if(!hidWrap.children.length){var e2=document.createElement('div');e2.className='col-empty';e2.textContent='（すべて表示中）';hidWrap.appendChild(e2);}
}
function openCols(){renderColManager();show('colsModal');}
$('btnCols2').onclick=openCols;
$('btnResetCols').onclick=function(){if(!confirm('項目の表示設定をすべてデフォルトに戻します。よろしいですか？'))return;var s=getSettings();s.colcfg={};saveSettings(s);renderHead();render();renderColManager();log('項目をデフォルトに戻す');};
/* ドラッグ幅調整モード */
function enterColResizeMode(){colResizeMode=true;hide('colsModal');var bar=$('resizeBar');if(bar)bar.hidden=false;renderHead();render();}
function exitColResizeMode(){colResizeMode=false;var bar=$('resizeBar');if(bar)bar.hidden=true;renderHead();render();show('colsModal');renderColManager();}
function startColResize(e,th,key){
  e.preventDefault();e.stopPropagation();
  var startX=e.clientX;var startW=th.getBoundingClientRect().width;var cells=document.querySelectorAll('#grid [data-col-key="'+key+'"]');var newW=Math.round(startW);
  document.body.style.userSelect='none';document.body.style.cursor='col-resize';
  function move(ev){newW=Math.max(40,Math.round(startW+(ev.clientX-startX)));for(var i=0;i<cells.length;i++){cells[i].style.width=newW+'px';cells[i].style.minWidth=newW+'px';cells[i].style.maxWidth=newW+'px';}}
  function up(){document.removeEventListener('mousemove',move);document.removeEventListener('mouseup',up);document.body.style.userSelect='';document.body.style.cursor='';setColCfg(key,{width:newW});}
  document.addEventListener('mousemove',move);document.addEventListener('mouseup',up);
}
if($('btnDragResize'))$('btnDragResize').onclick=enterColResizeMode;
if($('btnResizeDone'))$('btnResizeDone').onclick=exitColResizeMode;
var _gh=$('gridHead');if(_gh)_gh.addEventListener('mousedown',function(e){var t=e.target;if(t&&t.classList&&t.classList.contains('col-resize-handle')){startColResize(e,t.parentNode,t.getAttribute('data-rk'));}});
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
function catMatchF(rc,sel){if(sel==='')return true;if(sel==='__none__')return !rc;return rc===sel;}
function statusMatchF(rs,sel){if(sel==='')return true;if(sel==='__none__')return !rs;return rs===sel;}
function countCat(id){var n=0;for(var i=0;i<items.length;i++){if(catMatchF(items[i].listingType,id)&&statusMatchF(items[i].status,statusFilter))n++;}return n;}
function countStatus(id){var n=0;for(var i=0;i<items.length;i++){if(statusMatchF(items[i].status,id)&&catMatchF(items[i].listingType,listingFilter))n++;}return n;}
function renderCatTabs(){
  var el=$('catPills');if(!el)return;var cs=getCategories();
  var h='<button class="ctab'+(listingFilter===''?' on':'')+'" data-listing=""><span class="ctab-ico">📊</span>全体<span class="cnt">'+countCat('')+'</span></button>';
  for(var i=0;i<cs.length;i++){h+='<button class="ctab'+(listingFilter===cs[i].id?' on':'')+'" data-listing="'+escA(cs[i].id)+'"><span class="ctab-ico">'+iconHtml(cs[i].icon)+'</span>'+esc(cs[i].label)+'<span class="cnt">'+countCat(cs[i].id)+'</span></button>';}
  h+='<button class="ctab ctab-none'+(listingFilter==='__none__'?' on':'')+'" data-listing="__none__"><span class="ctab-ico">❓</span>未設定<span class="cnt">'+countCat('__none__')+'</span></button>';
  el.innerHTML=h;
}
function renderStatusTabs(){
  var el=$('statusRow');if(!el)return;var ss=getStatuses();
  var h='<button class="stab'+(statusFilter===''?' on':'')+'" data-status="">全体<span class="cnt">'+countStatus('')+'</span></button>';
  for(var i=0;i<ss.length;i++){h+='<button class="stab'+(statusFilter===ss[i].id?' on':'')+'" data-status="'+escA(ss[i].id)+'"><span class="stab-ico">'+statusIconHtml(ss[i].icon)+'</span>'+esc(ss[i].label)+'<span class="cnt">'+countStatus(ss[i].id)+'</span></button>';}
  h+='<button class="stab stab-none'+(statusFilter==='__none__'?' on':'')+'" data-status="__none__">未設定<span class="cnt">'+countStatus('__none__')+'</span></button>';
  el.innerHTML=h;
}
function markDirty(){dirty=true;var b=$('btnSaveEdits');if(b)b.hidden=false;}
function clearDirty(){dirty=false;var b=$('btnSaveEdits');if(b)b.hidden=true;}
function stageEdit(id,field,v){for(var i=0;i<items.length;i++){if(items[i].id===id){items[i][field]=v;break;}}markDirty();}
function wirePills(rowSel,pillSel){var ps=document.querySelectorAll(rowSel+' '+pillSel);for(var i=0;i<ps.length;i++){ps[i].addEventListener('click',function(){for(var j=0;j<ps.length;j++){ps[j].classList.remove('on');}this.classList.add('on');});}}
renderCatTabs();renderStatusTabs();
if($('catPills'))$('catPills').addEventListener('click',function(e){var b=e.target;while(b&&b!==this&&!(b.classList&&b.classList.contains('ctab')))b=b.parentNode;if(!b||!b.classList||!b.classList.contains('ctab'))return;listingFilter=b.getAttribute('data-listing')||'';render();});
if($('statusRow'))$('statusRow').addEventListener('click',function(e){var b=e.target;while(b&&b!==this&&!(b.classList&&b.classList.contains('stab')))b=b.parentNode;if(!b||!b.classList||!b.classList.contains('stab'))return;statusFilter=b.getAttribute('data-status')||'';render();});
function setBulkBtn(){var b=$('btnBulkEdit');if(b){b.classList.toggle('on',bulkEdit);b.textContent=bulkEdit?'キャンセル':'✏️ 一括編集';}}
function enterBulk(){bulkEdit=true;setBulkBtn();var s=$('btnSaveEdits');if(s)s.hidden=false;render();}
function cancelBulk(){bulkEdit=false;setBulkBtn();reloadItems();clearDirty();render();toast('一括編集をキャンセルしました');}
if($('btnSaveEdits'))$('btnSaveEdits').onclick=function(){persist();if(bulkEdit){bulkEdit=false;setBulkBtn();}clearDirty();render();log('変更を保存しました');toast('✅ 変更を保存しました');};
if($('btnBulkEdit'))$('btnBulkEdit').onclick=function(){if(bulkEdit)cancelBulk();else enterBulk();};
if($('gridBody'))$('gridBody').addEventListener('input',function(e){var t=e.target;if(!t||!t.classList||!t.classList.contains('bulk-inp'))return;var id=t.getAttribute('data-id');var field=t.getAttribute('data-field');for(var i=0;i<items.length;i++){if(items[i].id===id){if(field==='yahooUrls'||field==='rakutenUrls'){items[i][field]=t.value.split('\n').map(function(s){return s.trim();}).filter(function(s){return s;});}else{items[i][field]=t.value;}break;}}markDirty();});
document.addEventListener('click',function(e){
  var t=e.target;var item=t.closest?t.closest('.cdd-item'):null;
  if(item&&cddState.btn){cddSelect(item.getAttribute('data-v')||'');return;}
  var trg=t.closest?t.closest('.cdd'):null;
  if(trg){if(cddState.btn===trg)closeCdd();else openCdd(trg);return;}
  if(!(t.closest&&t.closest('#cddMenu')))closeCdd();
});
window.addEventListener('scroll',function(){closeCdd();},true);
window.addEventListener('resize',function(){closeCdd();});
window.addEventListener('resize',updateStickyH);setTimeout(updateStickyH,0);
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeCdd();});


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
var _toastTimer=null;
function toast(msg){var t=$('toast');if(!t)return;t.textContent=msg;t.hidden=false;requestAnimationFrame(function(){t.classList.add('show');});if(_toastTimer)clearTimeout(_toastTimer);_toastTimer=setTimeout(function(){t.classList.remove('show');setTimeout(function(){t.hidden=true;},260);},2400);}
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
