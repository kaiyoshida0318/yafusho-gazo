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

var statusFilter='';

/* ===== 設定（出品内容の選択肢 / 列） — 端末ローカル ===== */
var SETTINGS='yafusho_settings';
var DEFAULT_LISTING=['新規出品','リニューアル-同一ページ','リニューアル-新規ページ'];
var DEFAULT_COLS=[
  {key:'date',label:'日付',width:110},
  {key:'yahooImg',label:'Yahoo画像',width:90},
  {key:'rakutenImg',label:'楽天画像',width:90},
  {key:'name',label:'商品名',width:220},
  {key:'sales',label:'予想月商',width:100},
  {key:'yahooUrls',label:'ヤフショURL',width:220},
  {key:'rakutenUrls',label:'楽天URL',width:220},
  {key:'pagePlan',label:'制作予定ページ',width:110},
  {key:'listingType',label:'出品内容',width:160},
  {key:'status',label:'状態',width:100},
  {key:'actions',label:'操作',width:130}
];
function getSettings(){var d={listing:DEFAULT_LISTING.slice(),cols:null};try{var c=JSON.parse(localStorage.getItem(SETTINGS));if(c){if(c.listing&&c.listing.length)d.listing=c.listing;if(c.cols)d.cols=c.cols;}}catch(e){}return d;}
function saveSettings(s){try{localStorage.setItem(SETTINGS,JSON.stringify(s));}catch(e){}}
function getListing(){return getSettings().listing;}
function getCols(){
  var s=getSettings();var saved=s.cols;
  if(!saved)return DEFAULT_COLS.map(function(c){return {key:c.key,label:c.label,width:c.width};});
  var out=[],seen={};
  for(var i=0;i<saved.length;i++){var d=null;for(var jj=0;jj<DEFAULT_COLS.length;jj++){if(DEFAULT_COLS[jj].key===saved[i].key)d=DEFAULT_COLS[jj];}if(d){out.push({key:saved[i].key,label:saved[i].label||d.label,width:saved[i].width||d.width});seen[saved[i].key]=1;}}
  for(var k=0;k<DEFAULT_COLS.length;k++){if(!seen[DEFAULT_COLS[k].key])out.push({key:DEFAULT_COLS[k].key,label:DEFAULT_COLS[k].label,width:DEFAULT_COLS[k].width});}
  return out;
}

function md(){return '<span class="muted">—</span>';}
function cellHtml(key,it){
  if(key==='date')return '<td class="mono cell-date">'+(it.date?esc(it.date):md())+'</td>';
  if(key==='yahooImg')return '<td>'+thumb(it.yahooImg)+'</td>';
  if(key==='rakutenImg')return '<td>'+thumb(it.rakutenImg)+'</td>';
  if(key==='name')return '<td class="cell-name">'+(it.name?esc(it.name):'<span class="muted">(無題)</span>')+'</td>';
  if(key==='sales')return '<td class="mono">'+((it.sales!==''&&it.sales!=null)?esc(it.sales)+' 万円':md())+'</td>';
  if(key==='yahooUrls')return '<td>'+urlCell(it.yahooUrls)+'</td>';
  if(key==='rakutenUrls')return '<td>'+urlCell(it.rakutenUrls)+'</td>';
  if(key==='pagePlan')return '<td class="mono">'+(it.pagePlan?esc(it.pagePlan):md())+'</td>';
  if(key==='listingType')return '<td>'+(it.listingType?catBadge(it.listingType):md())+'</td>';
  if(key==='status')return '<td>'+(it.status?esc(it.status):md())+'</td>';
  if(key==='actions')return '<td><div class="act-cell"><button class="btn btn-line btn-sm" data-edit="'+it.id+'">編集</button><button class="btn btn-danger btn-sm" data-del="'+it.id+'">削除</button></div></td>';
  return '<td></td>';
}
function renderHead(){var cols=getCols();var h='<tr>';for(var i=0;i<cols.length;i++){h+='<th style="width:'+cols[i].width+'px;min-width:'+cols[i].width+'px">'+esc(cols[i].label)+'</th>';}$('gridHead').innerHTML=h+'</tr>';}

function statusCount(st){if(st==='')return items.length;if(st==='__none__')return items.filter(function(x){return !x.status;}).length;return items.filter(function(x){return x.status===st;}).length;}
function updateStatusPills(){var sp=document.querySelectorAll('#statusRow .spill');for(var i=0;i<sp.length;i++){var st=sp[i].getAttribute('data-status');var c=sp[i].querySelector('.cnt');if(c)c.textContent=statusCount(st);}}

function render(){
  var cols=getCols();
  var tb=$('gridBody');tb.innerHTML='';
  var list=items;
  if(statusFilter==='__none__')list=items.filter(function(x){return !x.status;});
  else if(statusFilter)list=items.filter(function(x){return x.status===statusFilter;});
  for(var i=0;i<list.length;i++){
    var it=list[i];var tr=document.createElement('tr');var tds='';
    for(var c=0;c<cols.length;c++){tds+=cellHtml(cols[c].key,it);}
    tr.innerHTML=tds;tb.appendChild(tr);
  }
  $('grid').style.display=list.length?'':'none';
  var es=$('emptyState');es.style.display=list.length?'none':'';
  if(!list.length){
    es.querySelector('.lead').textContent=items.length?'この絞り込みに該当する商品はありません':'まだ商品がありません';
    es.querySelector('p').textContent=items.length?'別の状態タブを選ぶか、「全体」に戻してください。':'「＋ 新規作成」から商品を登録すると、ここに一覧で表示されます。';
  }
  if($('cntAllCat'))$('cntAllCat').textContent=items.length;
  updateStatusPills();
}

/* ===== フォーム ===== */
function val(id){var e=$(id);return e?e.value:'';}
function setVal(id,v){var e=$(id);if(e)e.value=v;}
function imgSrc(boxId){var img=$(boxId).querySelector('img');return img?img.getAttribute('src'):'';}
function clearBox(id){$(id).innerHTML='<div class="img-drop">画像を選択<br><small>クリック / ドラッグ＆ドロップ</small></div>';}
function fillBox(id,src){if(src){$(id).innerHTML='<img src="'+escA(src)+'" alt="">';}else{clearBox(id);}}
function collectUrls(listId){var ins=document.querySelectorAll('#'+listId+' .url-row input');var a=[];for(var i=0;i<ins.length;i++){if(ins[i].value.trim())a.push(ins[i].value.trim());}return a;}
function resetUrls(id,ph){$(id).innerHTML='<div class="url-row"><input type="text" placeholder="'+ph+'"><button class="url-del">×</button></div>';}
function fillUrls(id,arr,ph){arr=(arr||[]).filter(function(u){return u;});if(!arr.length){resetUrls(id,ph);return;}var h='';for(var i=0;i<arr.length;i++){h+='<div class="url-row"><input type="text" value="'+escA(arr[i])+'" placeholder="'+ph+'"><button class="url-del">×</button></div>';}$(id).innerHTML=h;}
var PH_Y='https://store.shopping.yahoo.co.jp/…';
var PH_R='https://item.rakuten.co.jp/…';

function todayStr(){var d=new Date();var m=('0'+(d.getMonth()+1)).slice(-2);var day=('0'+d.getDate()).slice(-2);return d.getFullYear()+'-'+m+'-'+day;}
function populateListing(){var sel=$('fListing');if(!sel)return;var list=getListing();var cur=sel.value;sel.innerHTML='';for(var i=0;i<list.length;i++){var o=document.createElement('option');o.textContent=list[i];sel.appendChild(o);}if(cur)sel.value=cur;}
function resetForm(){populateListing();clearBox('imgRakuten');clearBox('imgYahoo');setVal('fDate',todayStr());setVal('fSales','');setVal('fListing','新規出品');setVal('fPagePlan','');setVal('fStatus','未着手');setVal('fName','');resetUrls('urlYahoo',PH_Y);resetUrls('urlRakuten',PH_R);}
function openNew(){editingId=null;$('edTitle').textContent='新規作成';resetForm();show('editModal');}
function openEdit(id){var it=null;for(var i=0;i<items.length;i++){if(items[i].id===id){it=items[i];break;}}if(!it)return;editingId=id;$('edTitle').textContent='編集';populateListing();fillBox('imgRakuten',it.rakutenImg);fillBox('imgYahoo',it.yahooImg);setVal('fDate',it.date||'');setVal('fSales',it.sales||'');setVal('fListing',it.listingType||'新規出品');setVal('fPagePlan',it.pagePlan||'');setVal('fStatus',it.status||'未着手');setVal('fName',it.name||'');fillUrls('urlYahoo',it.yahooUrls,PH_Y);fillUrls('urlRakuten',it.rakutenUrls,PH_R);show('editModal');}

function gather(){return{id:editingId||('it'+Date.now()),rakutenImg:imgSrc('imgRakuten'),yahooImg:imgSrc('imgYahoo'),date:val('fDate'),sales:val('fSales'),listingType:val('fListing'),pagePlan:val('fPagePlan'),status:val('fStatus'),name:val('fName'),yahooUrls:collectUrls('urlYahoo'),rakutenUrls:collectUrls('urlRakuten')};}
function saveForm(closeAfter){var d=gather();if(editingId){for(var i=0;i<items.length;i++){if(items[i].id===editingId){items[i]=d;break;}}}else{items.push(d);editingId=d.id;$('edTitle').textContent='編集';}persist();render();if(closeAfter)hide('editModal');}

/* ===== ヘッダー/モーダルのボタン ===== */
$('btnLog').onclick=function(){show('logModal');};
$('btnAdd').onclick=openNew;
$('btnAddRow').onclick=function(){items.push({id:'it'+Date.now(),rakutenImg:'',yahooImg:'',date:todayStr(),sales:'',listingType:'新規出品',pagePlan:'',status:'未着手',name:'',yahooUrls:[],rakutenUrls:[]});persist();render();};
$('btnSaveStay').onclick=function(){saveForm(false);};
$('btnSaveClose').onclick=function(){saveForm(true);};

/* 各種管理（出品内容の選択肢） */
function listingRow(v){var d=document.createElement('div');d.className='edit-row';d.innerHTML='<input type="text" value="'+escA(v)+'" placeholder="選択肢名"><button type="button" class="row-del">×</button>';return d;}
function openManage(){var box=$('listingEditor');box.innerHTML='';var list=getListing();for(var i=0;i<list.length;i++){box.appendChild(listingRow(list[i]));}show('manageModal');}
$('btnManage').onclick=openManage;
$('btnAddListing').onclick=function(){$('listingEditor').appendChild(listingRow(''));};
$('btnSaveListing').onclick=function(){var ins=$('listingEditor').querySelectorAll('input');var arr=[];for(var i=0;i<ins.length;i++){if(ins[i].value.trim())arr.push(ins[i].value.trim());}var s=getSettings();s.listing=arr.length?arr:DEFAULT_LISTING.slice();saveSettings(s);populateListing();hide('manageModal');log('出品内容の選択肢を更新（'+s.listing.length+'件）');};

/* 項目調整（列の名称・並び・幅） */
function colRow(c){var d=document.createElement('div');d.className='col-edit-row';d.setAttribute('data-key',c.key);d.innerHTML='<span class="mv-btns"><button type="button" class="mv up">↑</button><button type="button" class="mv down">↓</button></span><input type="text" class="col-name" value="'+escA(c.label)+'"><span class="col-w-wrap"><input type="number" class="col-w" min="40" value="'+c.width+'"><span class="unit">px</span></span>';return d;}
function openCols(){var box=$('colsEditor');box.innerHTML='';var cols=getCols();for(var i=0;i<cols.length;i++){box.appendChild(colRow(cols[i]));}show('colsModal');}
$('btnCols2').onclick=openCols;
$('btnSaveCols').onclick=function(){var rows=$('colsEditor').querySelectorAll('.col-edit-row');var arr=[];for(var i=0;i<rows.length;i++){arr.push({key:rows[i].getAttribute('data-key'),label:rows[i].querySelector('.col-name').value.trim()||rows[i].getAttribute('data-key'),width:parseInt(rows[i].querySelector('.col-w').value,10)||100});}var s=getSettings();s.cols=arr;saveSettings(s);renderHead();render();hide('colsModal');log('項目を更新');};
$('btnResetCols').onclick=function(){var s=getSettings();s.cols=null;saveSettings(s);renderHead();render();openCols();log('項目をデフォルトに戻す');};
$('btnBulkDel').onclick=function(){if(items.length&&confirm('全ての商品を削除します。よろしいですか？')){items=[];persist();render();}};

/* 閉じる系 */
var closers=document.querySelectorAll('[data-close]');
for(var j=0;j<closers.length;j++){closers[j].addEventListener('click',function(){hide(this.getAttribute('data-close'));});}
var overlays=document.querySelectorAll('.overlay');
for(var k=0;k<overlays.length;k++){overlays[k].addEventListener('click',function(e){if(e.target===this)this.hidden=true;});}

/* 画像カラム（楽天/Yahoo） */
function wireImageCol(col){
  var box=col.querySelector('.img-box');var file=col.querySelector('input[type=file]');var urlIn=col.querySelector('.img-url-row input');var apply=col.querySelector('.apply-img');
  function setImg(src){box.innerHTML='<img src="'+escA(src)+'" alt="">';}
  function readFile(f){if(!f)return;var r=new FileReader();r.onload=function(){setImg(r.result);};r.readAsDataURL(f);}
  box.addEventListener('click',function(){file.click();});
  file.addEventListener('change',function(e){readFile(e.target.files[0]);});
  box.addEventListener('dragover',function(e){e.preventDefault();box.classList.add('drag');});
  box.addEventListener('dragleave',function(){box.classList.remove('drag');});
  box.addEventListener('drop',function(e){e.preventDefault();box.classList.remove('drag');readFile(e.dataTransfer.files[0]);});
  apply.addEventListener('click',function(){var u=urlIn.value.trim();if(u)setImg(u);});
}
var imgCols=document.querySelectorAll('.img-col');
for(var ic=0;ic<imgCols.length;ic++){wireImageCol(imgCols[ic]);}

/* URL欄の追加・削除 */
function makeUrlRow(ph){var d=document.createElement('div');d.className='url-row';d.innerHTML='<input type="text" placeholder="'+ph+'"><button class="url-del">×</button>';return d;}
var adders=document.querySelectorAll('[data-addurl]');
for(var a=0;a<adders.length;a++){adders[a].addEventListener('click',function(){var id=this.getAttribute('data-addurl');var list=$(id);list.appendChild(makeUrlRow(id==='urlYahoo'?PH_Y:PH_R));});}
document.addEventListener('click',function(e){
  var t=e.target;
  if(t&&t.classList&&t.classList.contains('row-del')){var r0=t.closest('.edit-row');if(r0)r0.remove();return;}
  if(t&&t.classList&&t.classList.contains('mv')){var row=t.closest('.col-edit-row');if(row){var bx=row.parentNode;if(t.classList.contains('up')&&row.previousElementSibling){bx.insertBefore(row,row.previousElementSibling);}else if(t.classList.contains('down')&&row.nextElementSibling){bx.insertBefore(row.nextElementSibling,row);}}return;}
  if(t&&t.classList&&t.classList.contains('url-del')){var row=t.closest('.url-row');var list=row.parentNode;if(list.children.length>1){row.remove();}else{row.querySelector('input').value='';}return;}
  if(t&&t.getAttribute){
    var ed=t.getAttribute('data-edit');if(ed){openEdit(ed);return;}
    var dl=t.getAttribute('data-del');if(dl){if(confirm('この商品を削除しますか？')){items=items.filter(function(x){return x.id!==dl;});persist();render();}return;}
  }
});

/* ピル */
function wirePills(rowSel,pillSel){var ps=document.querySelectorAll(rowSel+' '+pillSel);for(var i=0;i<ps.length;i++){ps[i].addEventListener('click',function(){for(var j=0;j<ps.length;j++){ps[j].classList.remove('on');}this.classList.add('on');});}}
wirePills('#catRow','.pill');
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
    // 1) 画像（data:のものだけ）をアップロード → rawURLに置換
    var sides=['rakuten','yahoo'];
    for(var i=0;i<items.length;i++){
      var it=items[i];
      for(var sdi=0;sdi<sides.length;sdi++){
        var side=sides[sdi];var key=side+'Img';var src=it[key];
        if(src&&src.indexOf('data:')===0){
          prog(true,'画像をアップロード中… ('+(i+1)+'/'+items.length+')');
          var ext=mimeExt(src);var path='images/'+it.id+'-'+side+'.'+ext;
          var b64=src.split(',')[1];
          var sha=await ghSha(c.owner,c.repo,c.branch,path,c.pat);
          await ghPut(c.owner,c.repo,c.branch,path,b64,sha,'image '+it.id+' '+side,c.pat);
          it[key]='https://raw.githubusercontent.com/'+c.owner+'/'+c.repo+'/'+c.branch+'/'+path;
          persist();render();
        }
      }
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
