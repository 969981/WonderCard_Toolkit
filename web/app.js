/* WonderCard Studio v0.2 — offline binary editor, no external dependencies.
 * Field positions generated from the v0.1 Python core. Unknown bytes preserved.
 * Does not claim official event legality validation.
 */
(() => {
  'use strict';
  const SPECS = window.WC_MANIFEST;
  const I = window.WC_I18N;
  const t = (key, values) => I.t(key, values);
  const ALL_FORMATS = ['wc6', 'wc7', 'wc6full', 'wc7full'];
  // Name + exact length only: L1 identification / read-only byte-preserving archive.
  // Sizes checked against PKHeX.Core/MysteryGifts on 2026-11-13.
  const ARCHIVE_FORMATS = Object.freeze({
    pgt:[0x104,'4'],pcd:[0x358,'4'],wc4:[0x358,'4'],pgf:[0xCC,'5'],wc5full:[0x2D0,'5'],
    pl6:[0xA47,'6'],wb7:[0x310,'7'],wb7full:[0x310,'7'],wr7:[0x140,'7'],
    wc8:[0x2D0,'8'],wc8full:[0x2D0,'8'],wb8:[0x2DC,'8'],wa8:[0x2C8,'8'],wc9:[0x2C8,'9'],wa9:[0x2C8,'9']
  });
  const isArchive = fmt => Object.hasOwn(ARCHIVE_FORMATS, fmt);
  const SIZE = 0x108, FULL_SIZE = 0x310, FULL_START = 0x208;
  const IV_ORDER = ['hp','atk','def','spe','spa','spd'];
  const $ = id => document.getElementById(id);
  const files = [];
  let selected = -1;
  let activeTab = 'fields';
  let inspectorTab = 'hex';
  let highlightedOffset = null;
  const textDecoder = new TextDecoder('utf-16le', { fatal: false });
  const FIELD_LABELS = {
    card_id:'卡片 ID', title:'卡片标题', date:'接收日期', card_location:'卡片来源 / Location',
    card_type:'礼物类型', status_flags:'状态标志位', card_color:'背景色 / 卡片标志',
    tid:'训练家 ID (TID)', sid:'秘密 ID (SID)', origin_game:'来源游戏', encryption_constant:'加密常数 (EC)',
    ball:'精灵球 ID', held_item:'携带道具', species:'宝可梦图鉴编号', form:'形态', language:'语言',
    nickname:'昵称', nature:'性格模式', gender:'性别模式', ability_mode:'特性模式', pid_type:'PID / 闪光模式',
    egg_location:'蛋获得地点', met_location:'相遇地点', met_level:'旧版等级字段',
    ot_gender:'原训练家性别', ot_name:'原训练家名字', level:'等级', is_egg:'是否为蛋', pid:'固定 PID',
    memory_intensity:'Memory 强度', memory_id:'Memory ID', memory_variable:'Memory 参数',memory_feeling:'Memory 感受',
    item_id:'道具 ID', quantity:'数量',
    allowed_games_mask:'游戏版本掩码',distribution_effect:'动画效果',allowed_language:'允许语言',
    distribution_mode:'配信模式',sub_id:'Sub ID',set_count:'设置数量',rarity_or_marker:'标识位'
  };
  for (let i=1;i<=4;i++) { FIELD_LABELS[`move_${i}`]=`技能 ${i}`; FIELD_LABELS[`relearn_move_${i}`]=`回忆招式 ${i}`; }
  for (const [i,s] of IV_ORDER.entries()) { const cn=['HP','攻击','防御','速度','特攻','特防'][i]; FIELD_LABELS[`iv_${s}`]=`IV · ${cn}`; FIELD_LABELS[`ev_${s}`]=`EV · ${cn}`; }
  const SELECTS = {
    card_type:[[0,'0 · 宝可梦'],[1,'1 · 道具'],[3,'3 · 对战点数']],
    pid_type:[[0,'0 · 固定 PID'],[1,'1 · 随机（允许闪光）'],[2,'2 · 强制闪光'],[3,'3 · 禁止闪光']],
    gender:[[0,'0 · 雄'],[1,'1 · 雌'],[2,'2 · 无性别'],[3,'3 · 随机']],
    ability_mode:[[0,'0 · 特性 1'],[1,'1 · 特性 2'],[2,'2 · 隐藏特性'],[3,'3 · 随机普通特性'],[4,'4 · 随机全部特性']],
    nature:[...['勤奋','怕寂寞','勇敢','固执','顽皮','大胆','坦率','悠闲','淘气','乐天','胆小','急躁','认真','爽朗','天真','内敛','慢吞吞','冷静','害羞','马虎','温和','温顺','自大','慎重','浮躁'].map((v,i)=>[i,`${i} · ${v}`]),[255,'255 · 随机']]
  };
  const HINTS = { pid_type:'0 固定 / 1 随机 / 2 强制闪 / 3 禁止闪。改变此项会影响配信生成规则。',
    date:'WC6 为 YYYYMMDD 整数；WC7 的年份为相对 2000 的编码。',
    title:'改动后重编码为 UTF-16LE；未编辑的原始字节保持不变。',
    status_flags:'原始 8 位标志，请结合游戏与 PKHeX 研究。',
    card_type:'为防止字段结构不一致，首版禁止跨类型修改。',
    iv_hp:'254 (FE) 常用于保底 3V；253 (FD) 常用于保底 2V；255 为随机。',
    pid:'当 PID 类型不是固定 PID 时，这个数值未必直接用于最终宝可梦。',
    met_level:'历史映射字段，实际等级一般以 level 字段为准。'};
  const HEADER_ORDER=['card_id','title','date','card_type','card_location','status_flags','card_color'];
  const POKEMON_ORDER=['species','form','level','pid_type','nature','gender','ability_mode','language','tid','sid','ot_name','ot_gender','nickname','origin_game','ball','held_item','encryption_constant','pid','met_location','egg_location','is_egg','move_1','move_2','move_3','move_4','iv_hp','iv_atk','iv_def','iv_spe','iv_spa','iv_spd','ev_hp','ev_atk','ev_def','ev_spe','ev_spa','ev_spd','relearn_move_1','relearn_move_2','relearn_move_3','relearn_move_4','met_level','memory_intensity','memory_id','memory_variable','memory_feeling'];
  const bytesToHex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  function hexToBytes(hex) { if(typeof hex !=='string' || hex.length%2 || !/^[\da-f]*$/i.test(hex)) throw Error(t('error.invalidHex')); const bytes=new Uint8Array(hex.length/2);for(let i=0;i<bytes.length;i++)bytes[i]=parseInt(hex.slice(i*2,i*2+2),16);return bytes; }
  const clone = obj => JSON.parse(JSON.stringify(obj));
  const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtOffset=n=>'0x'+n.toString(16).toUpperCase().padStart(3,'0');
  function getFormat(filename, raw) {
    const suffix=filename.toLowerCase().split('.').pop();
    let format=ALL_FORMATS.includes(suffix)||isArchive(suffix)?suffix:null;
    if (isArchive(format)) {
      const expected=ARCHIVE_FORMATS[format][0];
      if (raw.length !== expected) throw Error(t('error.size',{format,expected,actual:raw.length}));
      return format;
    }
    if (!format) {
      if(raw.length===SIZE) { const n=new DataView(raw.buffer,raw.byteOffset,raw.byteLength).getUint32(0x4c,true);format=n>20000000&&n<21001231?'wc6':'wc7'; }
      else throw Error(t('error.unsupported'));
    }
    const expected=format.endsWith('full')?FULL_SIZE:SIZE;
    if(raw.length!==expected)throw Error(t('error.size',{format,expected,actual:raw.length}));
    return format;
  }
  function validISO(value) {
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    const [y,m,d]=value.split('-').map(Number);
    if(y<1||m<1||m>12||d<1||d>31)return false;
    const dt=new Date(Date.UTC(y,m-1,d));
    return dt.getUTCFullYear()===y && dt.getUTCMonth()===m-1 && dt.getUTCDate()===d;
  }
  function readField(bytes, base, spec, gen) {
    const ofs=base+spec.offset, v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    if(spec.kind==='string')return textDecoder.decode(bytes.slice(ofs,ofs+spec.size)).split('\0')[0];
    if(spec.kind==='date') {
      const n=v.getUint32(ofs,true), year=Math.floor(n/10000)+(gen===7?2000:0),mon=Math.floor(n/100)%100,day=n%100;
      const iso=`${String(year).padStart(4,'0')}-${String(mon).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      return validISO(iso)?iso:null;
    }
    return spec.kind==='u8'?v.getUint8(ofs):spec.kind==='u16'?v.getUint16(ofs,true):v.getUint32(ofs,true);
  }
  function writeField(bytes,base,spec,value,gen){
    const ofs=base+spec.offset,v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    if(spec.kind==='string'){
      if(typeof value!=='string'||value.includes('\0'))throw Error(t('error.string'));
      const units=[];for(let i=0;i<value.length;i++){const n=value.charCodeAt(i);units.push(n&255,n>>>8);}
      if(units.length+2>spec.size)throw Error(t('error.longString',{max:(spec.size-2)/2}));
      bytes.fill(0,ofs,ofs+spec.size);bytes.set(units,ofs);return;
    }
    if(spec.kind==='date'){
      if(value===null||value==='') {v.setUint32(ofs,0,true);return;}
      if(!validISO(value))throw Error(t('error.date'));
      const [year,month,day]=value.split('-').map(Number);
      if(gen===7&&(year<2000||year>2099))throw Error(t('error.date7'));
      v.setUint32(ofs,(year-(gen===7?2000:0))*10000+month*100+day,true);return;
    }
    if(typeof value!=='number'||!Number.isInteger(value)||value<0)throw Error(t('error.positive'));
    const max=spec.kind==='u8'?255:spec.kind==='u16'?65535:4294967295;
    if(value>max)throw Error(t('error.range',{max}));
    if(spec.kind==='u8')v.setUint8(ofs,value);else if(spec.kind==='u16')v.setUint16(ofs,value,true);else v.setUint32(ofs,value,true);
  }
  function readObject(raw,base,manifest,gen){const out={};for(const [k,v] of Object.entries(manifest))out[k]=readField(raw,base,v,gen);return out;}
  function parse(raw,format,filename){
    getFormat(filename||'test.'+format,raw);
    if (isArchive(format)) return {
      schema:'wondercard-toolkit-raw-v1',format,byte_length:raw.length,
      source_filename:filename||null,source_sha256:null,raw_hex:bytesToHex(raw),
      fields:{},baseline_fields:{},capability:'readonly',
      preview:{generation:ARCHIVE_FORMATS[format][1],gift_type:'unknown'},
      notes:'Recognized by filename and size only; raw bytes preserved; no semantic parse or edits.'
    };
    const gen=format.startsWith('wc6')?6:7,base=format.endsWith('full')?FULL_START:0;
    const fields=readObject(raw,base,SPECS.header,gen);
    if(fields.card_type===0)fields.pokemon=readObject(raw,base,SPECS.pokemon,gen);
    else if(fields.card_type===1)fields.item=readObject(raw,base,SPECS.item,gen);
    if(format.endsWith('full'))fields.full=readObject(raw,0,SPECS.full,gen);
    return {schema:'wondercard-toolkit-v1',format,byte_length:raw.length,source_filename:filename||null,
      source_sha256:null,raw_hex:bytesToHex(raw),fields,baseline_fields:clone(fields),preview:makePreview(fields,format,raw),notes:'Edit fields only. raw_hex is authoritative; all unedited bytes are preserved.'};
  }
  function makePreview(fields, format, raw){
    if (isArchive(format)) return {generation:ARCHIVE_FORMATS[format][1],gift_type:'unknown',capability:'readonly'};
    const status=fields.status_flags;
    const pos=format.endsWith('full')?FULL_START:0;
    const v=new DataView(raw.buffer,raw.byteOffset,raw.byteLength);
    const pv={generation:format.startsWith('wc6')?6:7,gift_type:({0:'pokemon',1:'item',3:'battle_points'})[fields.card_type]||'unknown',once_only:!!(status&1),used:!!(status&2),status_flags_hex:'0x'+status.toString(16).padStart(2,'0').toUpperCase(),raw_date_number:v.getUint32(pos+0x4c,true)};
    if(format.startsWith('wc7'))pv.once_per_day=!!(status&4);
    if(fields.pokemon){const pk=fields.pokemon;pv.pid_rule=({0:'fixed_pid',1:'random',2:'always_shiny',3:'never_shiny'})[pk.pid_type]||'unknown';pv.iv_generation=pk.iv_hp===254?'3 guaranteed 31':pk.iv_hp===253?'2 guaranteed 31':'per-stat, 255 means random';}
    if(format.endsWith('full')){pv.stored_crc16_hex='0x'+v.getUint16(0x202,true).toString(16).toUpperCase().padStart(4,'0');pv.full_extra_raw_hex=bytesToHex(raw.slice(0,FULL_START));}
    return pv;
  }
  function flatten(obj,prefix='',result={}) { for(const [key,value] of Object.entries(obj)) {const path=prefix?prefix+'.'+key:key;if(value!==null&&typeof value==='object'&&!Array.isArray(value))flatten(value,path,result);else result[path]=value;}return result; }
  function applyChanges(doc){
    if (isArchive(doc.format)) {
      if (doc.schema !== 'wondercard-toolkit-raw-v1' ||
          Object.keys(doc.fields||{}).length || Object.keys(doc.baseline_fields||{}).length)
        throw Error(t('archive.editBlocked'));
      const raw=hexToBytes(doc.raw_hex);
      getFormat('source.'+doc.format,raw);
      return {raw,modified:[]};
    }
    if(doc.schema!=='wondercard-toolkit-v1'||!ALL_FORMATS.includes(doc.format))throw Error('不是支持的 Toolkit JSON 格式');
    const raw=hexToBytes(doc.raw_hex),expected=doc.format.endsWith('full')?FULL_SIZE:SIZE;
    if(raw.length!==expected)throw Error('JSON 中的 raw_hex 长度不正确');
    if(!doc.fields||!doc.baseline_fields)throw Error('缺少 fields / baseline_fields');
    const a=flatten(doc.fields),b=flatten(doc.baseline_fields);
    if(Object.keys(a).sort().join('|')!==Object.keys(b).sort().join('|'))throw Error('JSON 字段结构已变化，不允许添加/删除字段');
    if(a.card_type!==b.card_type)throw Error('首版不允许直接修改 card_type，请改用对应的配信模板');
    const base=doc.format.endsWith('full')?FULL_START:0,gen=doc.format.startsWith('wc6')?6:7;
    const modified=[];
    for(const key of Object.keys(a)) {
      if(a[key]===b[key])continue;
      const bits=key.split('.');const section=bits.length===2?bits[0]:'header';const name=bits[bits.length-1];
      const spec=SPECS[section]?.[name];if(!spec)throw Error(t('error.unknownField',{field:key}));
      writeField(raw,section==='full'?0:base,spec,a[key],gen);modified.push(key);
    }
    return {raw,modified};
  }
  function getDiff(original,updated){ const diff=[];for(let i=0;i<original.length;i++)if(original[i]!==updated[i])diff.push({offset:i,old:original[i],now:updated[i]});return diff; }
  async function sha256(bytes){
    if(!globalThis.crypto?.subtle)return null;
    try {const hash=await crypto.subtle.digest('SHA-256',bytes);return bytesToHex(new Uint8Array(hash));}catch{return null;}
  }
  function kindName(fields) {return t(({0:'kind.pokemon',1:'kind.item',3:'kind.bp'})[fields.card_type]||'kind.unknown');}
  function cardName(file){const f=file.doc.fields;return f.title||(isArchive(file.doc.format)?file.filename:`${f.pokemon?.species?'No.'+f.pokemon.species:t('card.fallback')} · #${f.card_id}`);} 
  async function importBytes(filename,raw){
    const fmt=getFormat(filename,raw),doc=parse(raw,fmt,filename);
    doc.source_sha256=await sha256(raw);
    files.push({filename,doc});selected=files.length-1;render();return doc;
  }
  async function importJSON(filename,text){
    const doc=JSON.parse(text);const {raw}=applyChanges(doc); const bin=hexToBytes(doc.raw_hex);
    doc.format=getFormat('source.'+doc.format,bin);
    doc.byte_length=bin.length;
    const actualHash=await sha256(bin);
    if (isArchive(doc.format)) {
      if(!doc.source_sha256 || !actualHash || doc.source_sha256.toLowerCase()!==actualHash)
        throw Error(t('archive.hashMismatch'));
    }
    if(!doc.source_sha256)doc.source_sha256=actualHash;
    doc.preview=makePreview(doc.fields,doc.format,raw);
    files.push({filename,doc});selected=files.length-1;render();
  }
  async function importOne(file){if(file.name.toLowerCase().endsWith('.json'))await importJSON(file.name,await file.text());else await importBytes(file.name,new Uint8Array(await file.arrayBuffer()));}
  async function importFiles(incoming){let ok=0,errs=[];for(const file of incoming){try{await importOne(file);ok++;}catch(err){errs.push(`${file.name}: ${err.message}`);}}if(errs.length)toast(errs.slice(0,3).join(' | '),true);else if(ok)toast(t('files.imported',{n:ok}));}
  function current(){return files[selected];}
  function currentState(){const entry=current();if(!entry)return null;const doc=entry.doc;const {raw,modified}=applyChanges(doc);const baseline=hexToBytes(doc.raw_hex);return {entry,doc,raw,baseline,modified,diff:getDiff(baseline,raw)};}
  function displayField(obj,spec,key,section,doc){
    const value=obj[key],base=section==='full'?0:doc.format.endsWith('full')?FULL_START:0;
    const absolute=base+spec.offset,edited=doc.baseline_fields[section==='header'?'ignored':section];
    const original=section==='header'?doc.baseline_fields[key]:edited?.[key];
    const changed=value!==original;
    const id=`f-${section}-${key}`;
    const readOnly=key==='card_type';
    let input;
    const options=SELECTS[key] ? SELECTS[key].map(([n]) => [n,`${n} · ${I.option(key,n)}`]) : null;
    if(key==='date')input=`<input type="date" class="field-input" id="${id}" value="${escapeHtml(value||'')}" ${readOnly?'disabled':''}>`;
    else if(options && options.some(([n])=>n===value) || options && readOnly){
      input=`<select id="${id}" class="field-input" ${readOnly?'disabled':''}>${options.map(([n,title])=>`<option value="${n}" ${n===value?'selected':''}>${escapeHtml(title)}</option>`).join('')}</select>`;
    }else if(spec.kind==='string'){
      input=`<input type="text" class="field-input" id="${id}" value="${escapeHtml(value??'')}" ${readOnly?'disabled':''}>`;
    }else{
      input=`<input type="text" spellcheck="false" class="field-input" inputmode="numeric" id="${id}" value="${escapeHtml(String(value??''))}" ${readOnly?'disabled':''}>`;
    }
    const extra=HINTS[key]?`<div class="field-note">${escapeHtml(t('hint.'+key))}</div>`:'';
    const wide=(key==='title'||key==='ot_name'||key==='nickname')?' wide':'';
    return `<div class="form-group${changed?' field-changed':''}${wide}" data-field="${section}.${key}"><div class="form-top"><label class="field-label" for="${id}">${escapeHtml(I.field(key))}</label><span class="field-offset">${fmtOffset(absolute)}</span></div>${input}${extra}</div>`;
  }
  function drawFields(){
    const state=currentState();if(!state)return;
    const {doc}=state,fields=doc.fields;
    if (isArchive(doc.format)) {
      $('fields-header').innerHTML=`<div class="archive-note"><strong>${escapeHtml(t('archive.title'))}</strong><p>${escapeHtml(t('archive.warning'))}</p><p>${escapeHtml(t('archive.meta',{format:doc.format.toUpperCase(),size:doc.byte_length}))}</p></div>`;
      $('pokemon-section').hidden=true;$('item-section').hidden=true;$('full-section').hidden=true;
      return;
    }
    $('fields-header').innerHTML=HEADER_ORDER.filter(k=>k in fields).map(k=>displayField(fields,SPECS.header[k],k,'header',doc)).join('');
    $('pokemon-section').hidden=!fields.pokemon;$('item-section').hidden=!fields.item;$('full-section').hidden=!fields.full;
    if(fields.pokemon){ const order=POKEMON_ORDER.concat(Object.keys(fields.pokemon).filter(k=>!POKEMON_ORDER.includes(k)));
      $('fields-pokemon').innerHTML=order.filter(k=>k in fields.pokemon).map(k=>displayField(fields.pokemon,SPECS.pokemon[k],k,'pokemon',doc)).join('');}
    if(fields.item)$('fields-item').innerHTML=Object.keys(fields.item).map(k=>displayField(fields.item,SPECS.item[k],k,'item',doc)).join('');
    if(fields.full)$('fields-full').innerHTML=Object.keys(fields.full).map(k=>displayField(fields.full,SPECS.full[k],k,'full',doc)).join('');
    document.querySelectorAll('.form-group .field-input').forEach(input=>{
      const group=input.closest('.form-group'),[section,key]=group.dataset.field.split('.');
      input.addEventListener('focus',()=>{group.classList.add('focused');highlightedOffset=(section==='full'?0:doc.format.endsWith('full')?FULL_START:0)+SPECS[section==='header'?'header':section][key].offset;});
      input.addEventListener('blur',()=>group.classList.remove('focused'));
      input.addEventListener('change',()=>{
        const spec=SPECS[section][key];let v=input.value;
        if(key==='date')v=v||null;
        else if(spec.kind!=='string') {const cleaned=v.trim(); if(!/^(0x[0-9a-f]+|\d+)$/i.test(cleaned)){toast(t('error.integer',{field:I.field(key)}),true);input.value=String(section==='header'?doc.fields[key]:doc.fields[section][key]);return;}v=Number(cleaned);}
        const object=section==='header'?doc.fields:doc.fields[section],previous=object[key];
        object[key]=v;
        try{const preview=applyChanges(doc);if(doc.format.endsWith('full') && preview.modified.length){ /* read-only Full export, edits displayed */ }
          group.classList.toggle('field-changed',v!==(section==='header'?doc.baseline_fields[key]:doc.baseline_fields[section][key]));
          refresh();
        }catch(e){object[key]=previous;input.value=String(previous??'');toast(e.message,true);}
      });
    });
  }
  function drawFileList(){
    const term=$('search').value.trim().toLowerCase();$('file-count').textContent=t('files.count',{n:files.length});
    const filtered=files.map((entry,index)=>({entry,index})).filter(({entry})=>{
      const f=entry.doc.fields;return [entry.filename,f.title,f.card_id,f.pokemon?.species].some(x=>String(x??'').toLowerCase().includes(term));
    });
    $('file-list').innerHTML=filtered.length?filtered.map(({entry,index})=>{
      const f=entry.doc.fields,dirty=Object.keys(flatten(f)).some(k=>flatten(f)[k]!==flatten(entry.doc.baseline_fields)[k]);
      return `<button class="file-entry${index===selected?' selected':''}" data-index="${index}" role="option" aria-selected="${index===selected}"><span class="file-symbol">${entry.doc.format.toUpperCase().replace('FULL','F')}</span><span class="file-info"><strong title="${escapeHtml(entry.filename)}">${escapeHtml(cardName(entry))}${dirty?' •':''}</strong><small>${isArchive(entry.doc.format)?escapeHtml(t('archive.readonly')):`#${f.card_id} · ${escapeHtml(f.date||t('files.invalidDate'))}`}</small></span></button>`;
    }).join(''):`<div class="no-results">${escapeHtml(t('files.none'))}</div>`;
    document.querySelectorAll('.file-entry').forEach(btn=>btn.addEventListener('click',()=>{selected=Number(btn.dataset.index);render();}));
  }
  function drawHero(state){
    const {doc,entry,modified}=state,fields=doc.fields;
    $('hero-gen').textContent=isArchive(doc.format)?'GEN '+ARCHIVE_FORMATS[doc.format][1]:doc.format.startsWith('wc6')?'GEN VI':'GEN VII';
    $('hero-format').textContent=doc.format.toUpperCase();$('hero-kind').textContent=kindName(fields).toUpperCase();
    $('dirty-pill').hidden=modified.length===0;
    $('card-title').textContent=isArchive(doc.format)?entry.filename:(fields.title||`Wonder Card #${fields.card_id}`);
    $('card-subtitle').textContent=isArchive(doc.format)?t('archive.readonly'):`${entry.filename} · ${fields.pokemon?'No.'+fields.pokemon.species:kindName(fields)}`;
    $('hero-id').textContent=isArchive(doc.format)?'—':'#'+String(fields.card_id).padStart(4,'0');
    $('hero-date').textContent=fields.date||t('hero.unknownDate');$('hero-size').textContent=doc.byte_length+' bytes';
    $('export-bin').disabled=doc.format.endsWith('full')&&modified.length>0;
    $('export-bin').title=$('export-bin').disabled?t('error.fullLocked'):'';
  }
  function drawHex(state){
    const {raw,diff}=state, changed=new Set(diff.map(x=>x.offset));
    $('hex-count').textContent=t('diff.count',{n:diff.length});
    const n=8;let lines=[];
    for(let i=0;i<raw.length;i+=n){let buttons=[];for(let j=i;j<Math.min(i+n,raw.length);j++){
      const b=raw[j].toString(16).toUpperCase().padStart(2,'0');buttons.push(`<button class="hex-byte${changed.has(j)?' changed':''}${highlightedOffset===j?' selected':''}" data-offset="${j}" title="${fmtOffset(j)} : ${b}">${b}</button>`);
    }lines.push(`<div class="hex-line"><span class="hex-addr">${fmtOffset(i)}</span><span class="hex-bytes">${buttons.join('')}</span></div>`);}
    const view=$('hex-view'),oldScroll=view.scrollTop;view.innerHTML=lines.join('');view.scrollTop=oldScroll;
    view.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{highlightedOffset=Number(btn.dataset.offset);view.querySelectorAll('button.selected').forEach(n=>n.classList.remove('selected'));btn.classList.add('selected');$('hex-validation').textContent=t('validation.selected',{offset:fmtOffset(highlightedOffset),value:'0x'+raw[highlightedOffset].toString(16).toUpperCase().padStart(2,'0')});}));
    $('diff-view').innerHTML=diff.length?diff.map(x=>`<div class="diff-item"><b>${fmtOffset(x.offset)}</b><span class="from"> &nbsp; ${x.old.toString(16).toUpperCase().padStart(2,'0')}</span> → <span class="to">${x.now.toString(16).toUpperCase().padStart(2,'0')}</span></div>`).join(''):`<p>${escapeHtml(t('diff.empty'))}</p>`;
    $('hex-validation').textContent=state.doc.format.endsWith('full')&&state.modified.length?t('validation.fullLocked'):t('validation.untouched');
  }
  function drawJson(state){
    const doc=clone(state.doc);doc.preview=makePreview(doc.fields,doc.format,state.raw);doc.notes='Edit fields only. raw_hex is original bytes; changes exist in fields.';
    $('json-text').textContent=JSON.stringify(doc,null,2);
  }
  function drawAudit(state){
    const {doc,raw,modified,diff}=state;const f=doc.fields,pk=f.pokemon;
    if (isArchive(doc.format)) {
      const rows=[[t('audit.format'),doc.format.toUpperCase()],[t('audit.bytes'),`${raw.length} bytes`],
        [t('audit.sha'),doc.source_sha256||t('audit.shaUnavailable')],
        [t('audit.result'),t('archive.warning')]];
      $('audit-items').innerHTML=rows.map(([k,v])=>`<div class="audit-row"><span>${escapeHtml(k)}</span><strong>${escapeHtml(v)}</strong></div>`).join('');
      $('audit-diff').textContent=t('audit.noDiff');return;
    }
    const flags=[];
    if(f.date===null)flags.push(t('audit.invalidDate'));
    if(pk&&![0,1,2,3].includes(pk.pid_type))flags.push(t('audit.unknownPid'));
    if(pk&&pk.level>100)flags.push(t('audit.highLevel'));
    if(pk&&IV_ORDER.some(s=>![...Array(32).keys(),253,254,255].includes(pk[`iv_${s}`])))flags.push(t('audit.oddIv'));
    const rows=[
      [t('audit.format'),doc.format.toUpperCase()],[t('audit.bytes'),`${raw.length} bytes`],
      [t('audit.reserved'),t('audit.reservedValue')],
      [t('audit.sha'),doc.source_sha256||t('audit.shaUnavailable')],
      [t('audit.modifiedFields'),String(modified.length)],[t('audit.modifiedBytes'),String(diff.length)],
      [t('audit.pid'),pk?t('pid.'+pk.pid_type):t('audit.nonPokemon')],
      [t('audit.iv'),pk?(pk.iv_hp===254?t('audit.iv3'):pk.iv_hp===253?t('audit.iv2'):t('audit.ivRaw')):t('audit.na')],
      [t('audit.date'),f.date||t('files.invalidDate')],[t('audit.result'),flags.length?flags.join('；'):t('audit.ok')],
      [t('audit.full'),doc.format.endsWith('full')?(modified.length?t('audit.fullLocked'):t('audit.fullUnchanged')):t('audit.na')]
    ];
    $('audit-items').innerHTML=rows.map(([name,value])=>`<div class="audit-row"><span>${escapeHtml(name)}</span><strong class="${name===t('audit.result')&&!flags.length?'ok':name===t('audit.result')||name===t('audit.full')&&modified.length?'warn':''}">${escapeHtml(value)}</strong></div>`).join('');
    $('audit-diff').innerHTML=diff.length?diff.map(x=>`<div class="diff-row"><span>${fmtOffset(x.offset)}</span><b>${x.old.toString(16).toUpperCase().padStart(2,'0')} → ${x.now.toString(16).toUpperCase().padStart(2,'0')}</b></div>`).join(''):`<div class="diff-row">${escapeHtml(t('audit.noDiff'))}</div>`;
  }
  function refresh(){const state=currentState();if(!state)return;drawHero(state);drawFileList();drawHex(state);if(activeTab==='json')drawJson(state);if(activeTab==='audit')drawAudit(state);}
  function render(){
    drawFileList();const state=currentState();const has=!!state;
    $('empty-state').hidden=has;$('editor').hidden=!has;$('export-bin').disabled=!has;$('export-json').disabled=!has;
    if(!has)return;
    drawHero(state);drawFields();drawHex(state);drawJson(state);drawAudit(state);
  }
  function toast(msg,error=false){const box=$('toast');box.textContent=msg;box.className='toast show'+(error?' error':'');clearTimeout(toast.timer);toast.timer=setTimeout(()=>box.className='toast',4500);}
  function download(filename,bytes,type){const blob=new Blob([bytes],{type});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
  function basenameWithoutExt(s){return s.replace(/\.(wc6|wc7|wc6full|wc7full|json|pgt|pcd|wc4|pgf|wc5full|pl6|wb7|wb7full|wr7|wc8|wc8full|wb8|wa8|wc9|wa9)$/i,'');}
  function exportBinary(){try{const state=currentState();if(!state)return;if(state.doc.format.endsWith('full')&&state.modified.length)throw Error(t('error.fullLocked'));
      const filename=basenameWithoutExt(state.entry.filename)+(isArchive(state.doc.format)?'_copy':'_edited')+'.'+state.doc.format;
      download(filename,state.raw,'application/octet-stream');toast(t('toast.exportBin',{filename,n:state.diff.length}));
    }catch(e){toast(e.message,true);}}
  function exportJson(){try{const state=currentState();if(!state)return;const doc=clone(state.doc);doc.preview=makePreview(doc.fields,doc.format,state.raw);download(basenameWithoutExt(state.entry.filename)+'.'+doc.format+'.json',JSON.stringify(doc,null,2)+'\n','application/json');toast(t('toast.exportJson'));}catch(e){toast(e.message,true);}}
  function auditCsv(){
    if(!files.length){toast(t('error.noFiles'),true);return;}
    const names=['file','format','card_id','title','date','card_type','species','pid_type','pid_rule','nature','ivs_raw','language','origin_game','edited_fields','changed_bytes','full_write_locked'];
    const rows=files.map(entry=>{
      const doc=entry.doc,f=doc.fields,pk=f.pokemon||{},state=applyChanges(doc),base=hexToBytes(doc.raw_hex),diff=getDiff(base,state.raw);
      return [entry.filename,doc.format,f.card_id??'',f.title??'',f.date||'',f.card_type??'',pk.species??'',pk.pid_type??'',({0:'fixed_pid',1:'random',2:'always_shiny',3:'never_shiny'})[pk.pid_type]??'',pk.nature??'',IV_ORDER.map(s=>pk[`iv_${s}`]??'').join('/'),pk.language??'',pk.origin_game??'',state.modified.length,diff.length,(doc.format.endsWith('full')&&state.modified.length)||isArchive(doc.format)?'yes':'no'];
    });
    const csv='\ufeff'+[names,...rows].map(line=>line.map(value=>'"'+String(value??'').replaceAll('"','""')+'"').join(',')).join('\r\n');
    download('wondercard_audit.csv',csv,'text/csv;charset=utf-8');toast(t('toast.exportCsv',{n:rows.length}));
  }
  function init(){
    const input=$('file-input');const open=()=>input.click();
    $('open-files-left').addEventListener('click',open);$('open-files-empty').addEventListener('click',open);
    input.addEventListener('change',async()=>{await importFiles([...input.files]);input.value='';});
    $('search').addEventListener('input',drawFileList);
    $('clear-files').addEventListener('click',()=>{files.length=0;selected=-1;render();toast(t('toast.cleared'));});
    $('export-bin').addEventListener('click',exportBinary);$('export-json').addEventListener('click',exportJson);$('audit-csv').addEventListener('click',auditCsv);
    $('theme-switch').addEventListener('click',()=>document.body.classList.toggle('light'));
    window.addEventListener('wc-locale-change',()=>{render();I.translateDom();});
    document.querySelectorAll('#editor-tabs button').forEach(btn=>btn.addEventListener('click',()=>{
      activeTab=btn.dataset.tab;document.querySelectorAll('#editor-tabs button').forEach(x=>x.classList.toggle('active',x===btn));
      for(const name of ['fields','json','audit'])$(name+'-tab').hidden=(activeTab!==name);
      const state=currentState();if(!state)return;if(activeTab==='json')drawJson(state);if(activeTab==='audit')drawAudit(state);
    }));
    document.querySelectorAll('.inspector-nav button').forEach(btn=>btn.addEventListener('click',()=>{
      inspectorTab=btn.dataset.inspector;document.querySelectorAll('.inspector-nav button').forEach(x=>x.classList.toggle('active',btn===x));$('hex-view').hidden=inspectorTab!=='hex';$('diff-view').hidden=inspectorTab!=='diff';
    }));
    document.addEventListener('dragover',e=>{e.preventDefault();document.body.classList.add('dragging');});
    document.addEventListener('dragleave',e=>{if(!e.relatedTarget)document.body.classList.remove('dragging');});
    document.addEventListener('drop',async e=>{e.preventDefault();document.body.classList.remove('dragging');if(e.dataTransfer?.files?.length)await importFiles([...e.dataTransfer.files]);});
    document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.key.toLowerCase()==='o'){e.preventDefault();open();}else if(e.ctrlKey&&e.key.toLowerCase()==='s'){e.preventDefault();exportBinary();}});
    const bin=atob(window.WC_SAMPLE_B64),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
    importBytes('synthetic_demo.wc6',bytes).then(()=>toast(t('files.imported',{n:1}))).catch(e=>toast(e.message,true));
  }
  // Public developer API used by automated roundtrip checks and embedders.
  window.WonderCardStudio={parse,applyChanges,getDiff,importBytes,importJSON,getFiles:()=>files,getLocale:()=>I.getLocale(),setLocale:lang=>I.setLocale(lang),select:index=>{selected=index;render();},currentState};
  init();
})();
