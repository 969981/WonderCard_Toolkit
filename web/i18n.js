/* Offline i18n module. Translation is presentation-only; WC data/JSON are untouched. */
(() => {
  'use strict';
  const catalog = {
    'zh-CN': {
      'app.title':'配信卡编辑器','side.workspace':'工作区','side.import':'导入配信卡','side.clear':'清空','side.local':'本地离线运行','side.privacy':'文件仅在当前浏览器中处理，不上传到服务器。',
      'top.library':'文件库','top.workspace':'配信卡工作台','top.json':'导出 JSON','top.binary':'导出 WC 文件','top.theme':'切换深浅色模式','top.language':'界面语言',
      'workspace.description':'查看、编辑和审计第六 / 第七世代 Wonder Card。保留未知字节，非破坏性写回。','workspace.auditCsv':'导出批量审计 CSV',
      'drop.label':'将 .wc6 / .wc7 / .wc6full / .wc7full 或 JSON 文件拖放到此处','empty.heading':'导入你的第一张配信卡','empty.description':'支持一次选择多个文件。也可以直接拖放文件到窗口中。','empty.open':'选择文件',
      'hero.changed':'已修改','hero.id':'卡片编号','hero.date':'接收日期','hero.size':'文件长度','hero.gift':'神秘礼物配信',
      'tab.fields':'字段编辑','tab.json':'JSON 数据','tab.audit':'审计与验证','section.header':'基础信息','section.pokemon':'宝可梦设定','section.item':'道具设定','section.full':'Full 配信控制字段','section.json':'结构化 JSON','section.audit':'审计与一致性','section.history':'变更记录',
      'full.warning':'Full 格式修改后的 CRC 生成规则尚未经过真实样本外部验证，本工具只允许原样导出 Full。',
      'json.tip':'下方展示当前字段及基线原始字节。可复制或导出 JSON。修改请在「字段编辑」中进行，避免破坏未解析内容。',
      'inspector.title':'十六进制检查器','inspector.red':'红色高亮 = 修改字节 · 点击字节可查看偏移','search.placeholder':'⌕ 搜索卡片 / ID / 文件名','files.count':'{n} 个文件','files.none':'没有匹配的卡片','files.invalidDate':'无效日期',
      'kind.pokemon':'宝可梦配信','kind.item':'道具配信','kind.bp':'BP 配信','kind.unknown':'未知类型','card.fallback':'配信卡','hero.unknownDate':'未知 / 未设置','diff.count':'{n} 改动','diff.empty':'未检测到字节修改。原始内容保持不变。',
      'validation.selected':'已选择 {offset} · {value}','validation.fullLocked':'Full 已修改 · 禁止导出','validation.untouched':'编辑只影响指定字段 · 未知字节保留','files.imported':'成功导入 {n} 个文件',
      'error.invalidHex':'raw_hex 必须是偶数字符的十六进制字符串','error.unsupported':'不支持的文件扩展名，请提供 .wc6 / .wc7 / .wc6full / .wc7full','error.size':'{format} 应为 {expected} 字节，实际为 {actual} 字节','error.string':'字符串必须合法，且不含空字符','error.longString':'字符串超长：至多 {max} 个 UTF-16 单位','error.date':'日期必须是有效的 YYYY-MM-DD','error.date7':'WC7 日期仅支持 2000–2099','error.positive':'数值必须是非负整数','error.range':'值必须在 0..{max} 范围内','error.unknownField':'未知或不可编辑字段：{field}',
      'error.integer':'字段「{field}」需要无符号整数','error.fullLocked':'Full 修改后 CRC 尚未验证，禁止导出；请先导出 JSON','error.noFiles':'暂无文件可审计',
      'toast.exportBin':'已导出 {filename}（{n} 字节差异）','toast.exportJson':'已导出无损 JSON（兼容 v0.1）','toast.exportCsv':'已导出 {n} 张卡片的审计报告','toast.cleared':'文件列表已清空（磁盘原件未改变）','toast.sample':'已加载合成演示卡片，可直接修改日期或导入自己的文件',
      'audit.format':'文件格式','audit.bytes':'文件字节','audit.reserved':'未知字段 / 保留区','audit.reservedValue':'保持原始数据，不会自动重新序列化','audit.sha':'SHA-256 (原件)','audit.shaUnavailable':'当前浏览器不可用','audit.modifiedFields':'修改的字段数','audit.modifiedBytes':'变化字节数','audit.pid':'来源 / 生成模式','audit.iv':'IV 规则','audit.date':'日期解析','audit.result':'数据审计','audit.full':'Full 写回',
      'audit.invalidDate':'日期无法解析或为空','audit.unknownPid':'未知 PID 生成模式','audit.highLevel':'等级超过 100','audit.oddIv':'出现非典型 IV 控制值','audit.nonPokemon':'非宝可梦配信','audit.iv3':'3 项保底 31','audit.iv2':'2 项保底 31','audit.ivRaw':'见原始 IV 字节','audit.na':'不适用',
      'audit.ok':'基础格式检查通过（不代表官方合法性）','audit.fullLocked':'修改后禁止导出：CRC 未验证','audit.fullUnchanged':'未修改时可原样导出','audit.noDiff':'未修改任何字节。',
      'pid.0':'固定 PID','pid.1':'随机允许闪','pid.2':'强制闪光','pid.3':'禁止闪光','pid.unknown':'未知',
      'option.card_type.0':'宝可梦','option.card_type.1':'道具','option.card_type.3':'对战点数','option.gender.0':'雄','option.gender.1':'雌','option.gender.2':'无性别','option.gender.3':'随机','option.ability_mode.0':'特性 1','option.ability_mode.1':'特性 2','option.ability_mode.2':'隐藏特性','option.ability_mode.3':'随机普通特性','option.ability_mode.4':'随机全部特性','option.nature.255':'随机',
      'hint.pid_type':'0 固定 / 1 随机 / 2 强制闪 / 3 禁止闪。改变此项会影响配信生成规则。','hint.date':'WC6 为 YYYYMMDD 整数；WC7 的年份为相对 2000 的编码。','hint.title':'改动后重编码为 UTF-16LE；未编辑的原始字节保持不变。','hint.status_flags':'原始 8 位标志，请结合游戏与 PKHeX 研究。','hint.card_type':'为防止字段结构不一致，首版禁止跨类型修改。','hint.iv_hp':'254 (FE) 常用于保底 3V；253 (FD) 常用于保底 2V；255 为随机。','hint.pid':'当 PID 类型不是固定 PID 时，这个数值未必直接用于最终宝可梦。','hint.met_level':'历史映射字段，实际等级一般以 level 字段为准。',
      'field.card_id':'卡片 ID','field.title':'卡片标题','field.date':'接收日期','field.card_location':'卡片来源 / Location','field.card_type':'礼物类型','field.status_flags':'状态标志位','field.card_color':'背景色 / 卡片标志','field.tid':'训练家 ID (TID)','field.sid':'秘密 ID (SID)','field.origin_game':'来源游戏','field.encryption_constant':'加密常数 (EC)','field.ball':'精灵球 ID','field.held_item':'携带道具','field.species':'宝可梦图鉴编号','field.form':'形态','field.language':'宝可梦语言','field.nickname':'昵称','field.nature':'性格模式','field.gender':'性别模式','field.ability_mode':'特性模式','field.pid_type':'PID / 闪光模式','field.egg_location':'蛋获得地点','field.met_location':'相遇地点','field.met_level':'旧版等级字段','field.ot_gender':'原训练家性别','field.ot_name':'原训练家名字','field.level':'等级','field.is_egg':'是否为蛋','field.pid':'固定 PID','field.memory_intensity':'Memory 强度','field.memory_id':'Memory ID','field.memory_variable':'Memory 参数','field.memory_feeling':'Memory 感受','field.item_id':'道具 ID','field.quantity':'数量','field.allowed_games_mask':'游戏版本掩码','field.distribution_effect':'动画效果','field.allowed_language':'允许接收的语言','field.distribution_mode':'配信模式','field.sub_id':'Sub ID','field.set_count':'设置数量','field.rarity_or_marker':'标识位','field.move':'技能 {n}','field.relearn_move':'回忆招式 {n}','field.iv':'IV · {stat}','field.ev':'EV · {stat}'
    },
    'zh-TW': {
      'app.title':'配信卡編輯器','side.workspace':'工作區','side.import':'匯入配信卡','side.clear':'清空','side.local':'本機離線執行','side.privacy':'檔案只會在目前瀏覽器中處理，不會上傳伺服器。','top.library':'檔案庫','top.workspace':'配信卡工作台','top.json':'匯出 JSON','top.binary':'匯出 WC 檔案','top.theme':'切換明暗主題','top.language':'介面語言',
      'workspace.description':'檢視、編輯與稽核第六／第七世代 Wonder Card。保留未知位元組，非破壞性寫回。','workspace.auditCsv':'匯出批次稽核 CSV','drop.label':'將 .wc6 / .wc7 / .wc6full / .wc7full 或 JSON 檔案拖放至此','empty.heading':'匯入第一張配信卡','empty.description':'可一次選取多個檔案，也可以將檔案拖入視窗。','empty.open':'選取檔案','hero.changed':'已修改','hero.id':'卡片編號','hero.date':'接收日期','hero.size':'檔案大小','hero.gift':'神秘禮物配信',
      'tab.fields':'欄位編輯','tab.json':'JSON 資料','tab.audit':'稽核與驗證','section.header':'基本資訊','section.pokemon':'寶可夢設定','section.item':'道具設定','section.full':'Full 配信控制欄位','section.json':'結構化 JSON','section.audit':'稽核與一致性','section.history':'變更紀錄','full.warning':'Full 格式修改後的 CRC 尚未經真實樣本驗證，因此僅允許原樣匯出 Full。','json.tip':'下方顯示目前欄位和原始位元組，可複製或匯出 JSON。請在欄位編輯中修改，避免破壞未解析資料。',
      'inspector.title':'十六進位檢查器','inspector.red':'紅色醒目標示 = 已修改位元組；點選可查看偏移','search.placeholder':'⌕ 搜尋卡片 / ID / 檔名','files.count':'{n} 個檔案','files.none':'找不到符合條件的卡片','files.invalidDate':'無效日期','kind.pokemon':'寶可夢配信','kind.item':'道具配信','kind.bp':'BP 配信','kind.unknown':'未知類型','card.fallback':'配信卡','hero.unknownDate':'未知／未設定','diff.count':'{n} 個變更','diff.empty':'未偵測到位元組修改，原始內容保持不變。',
      'validation.selected':'已選取 {offset} · {value}','validation.fullLocked':'Full 已修改 · 禁止匯出','validation.untouched':'只修改指定欄位 · 保留未知位元組','files.imported':'已成功匯入 {n} 個檔案','error.integer':'欄位「{field}」需要無號整數','error.fullLocked':'Full 修改後 CRC 尚未驗證，禁止匯出；請先匯出 JSON','error.noFiles':'目前沒有可稽核檔案',
      'toast.exportBin':'已匯出 {filename}（{n} 位元組差異）','toast.exportJson':'已匯出無損 JSON（相容 v0.1）','toast.exportCsv':'已匯出 {n} 張卡片的稽核報告','toast.cleared':'檔案清單已清空（磁碟原件未改變）','toast.sample':'已載入合成示範卡片，可修改日期或匯入自己的檔案',
      'audit.format':'檔案格式','audit.bytes':'檔案位元組','audit.reserved':'未知欄位／保留區','audit.reservedValue':'保留原始資料，不會自動重新序列化','audit.sha':'SHA-256（原件）','audit.shaUnavailable':'目前瀏覽器無法使用','audit.modifiedFields':'修改欄位數','audit.modifiedBytes':'變更位元組數','audit.pid':'來源／生成模式','audit.iv':'IV 規則','audit.date':'日期解析','audit.result':'資料稽核','audit.full':'Full 寫回','audit.invalidDate':'日期無法解析或為空','audit.unknownPid':'未知 PID 生成模式','audit.highLevel':'等級超過 100','audit.oddIv':'出現非典型 IV 控制值','audit.nonPokemon':'非寶可夢配信','audit.iv3':'保底 3 項 31','audit.iv2':'保底 2 項 31','audit.ivRaw':'請查看原始 IV 位元組','audit.na':'不適用','audit.ok':'基礎格式檢查通過（不代表官方合法性）','audit.fullLocked':'修改後禁止匯出：CRC 未驗證','audit.fullUnchanged':'未修改可原樣匯出','audit.noDiff':'沒有修改任何位元組。',
      'pid.0':'固定 PID','pid.1':'隨機可閃光','pid.2':'強制閃光','pid.3':'禁止閃光','pid.unknown':'未知','option.card_type.0':'寶可夢','option.card_type.1':'道具','option.card_type.3':'對戰點數','option.gender.0':'雄','option.gender.1':'雌','option.gender.2':'無性別','option.gender.3':'隨機','option.ability_mode.0':'特性 1','option.ability_mode.1':'特性 2','option.ability_mode.2':'隱藏特性','option.ability_mode.3':'隨機一般特性','option.ability_mode.4':'隨機全部特性','option.nature.255':'隨機',
      'hint.pid_type':'0 固定 / 1 隨機 / 2 強制閃光 / 3 禁止閃光；變更將影響生成規則。','hint.date':'WC6 為 YYYYMMDD 整數，WC7 年份相對於 2000。','hint.title':'僅修改時重新編碼 UTF-16LE；未編輯原始位元組不變。','hint.status_flags':'原始 8 位元標誌，請搭配遊戲和 PKHeX 研究。','hint.card_type':'為避免結構不一致，首版不允許跨類型修改。','hint.iv_hp':'254 (FE) 通常表示保底 3V，253 (FD) 通常表示保底 2V；255 為隨機。','hint.pid':'若 PID 類型不是固定，這個值未必會用於最終寶可夢。','hint.met_level':'歷史對照欄位；實際等級通常依 level 為準。'
    },
    en: {
      'app.title':'Wonder Card Editor','side.workspace':'Workspace','side.import':'Import Wonder Cards','side.clear':'Clear','side.local':'Local, offline','side.privacy':'Files are processed in your browser and never uploaded.','top.library':'Library','top.workspace':'Wonder Card Studio','top.json':'Export JSON','top.binary':'Export WC File','top.theme':'Switch light/dark theme','top.language':'Interface language',
      'workspace.description':'Inspect, edit and audit Gen 6 / Gen 7 Wonder Cards. Preserve unknown bytes with non-destructive writes.','workspace.auditCsv':'Export Audit CSV','drop.label':'Drop .wc6 / .wc7 / .wc6full / .wc7full or JSON files here','empty.heading':'Import your first Wonder Card','empty.description':'Select multiple files or drag files onto this window.','empty.open':'Choose Files','hero.changed':'Modified','hero.id':'Card ID','hero.date':'Received Date','hero.size':'File Size','hero.gift':'Mystery Gift Distribution',
      'tab.fields':'Edit Fields','tab.json':'JSON Data','tab.audit':'Audit & Validate','section.header':'General','section.pokemon':'Pokémon Template','section.item':'Item Gift','section.full':'Full Distribution Settings','section.json':'Structured JSON','section.audit':'Audit & Integrity','section.history':'Change History','full.warning':'The CRC for edited Full cards has not been externally verified with real samples. Only unchanged Full exports are allowed.','json.tip':'Shows current fields and the raw baseline. You may copy or export JSON. To preserve unknown bytes, edit through the Fields tab.',
      'inspector.title':'Hex Inspector','inspector.red':'Red highlight = changed byte · Click a byte to inspect its offset','search.placeholder':'⌕ Search cards / ID / filename','files.count':'{n} files','files.none':'No matching cards','files.invalidDate':'Invalid date','kind.pokemon':'Pokémon Gift','kind.item':'Item Gift','kind.bp':'BP Gift','kind.unknown':'Unknown Type','card.fallback':'Wonder Card','hero.unknownDate':'Unknown / Not Set','diff.count':'{n} changes','diff.empty':'No byte changes. Original data is preserved.','validation.selected':'Selected {offset} · {value}','validation.fullLocked':'Full modified · Export blocked','validation.untouched':'Only targeted bytes change · Unknown bytes preserved','files.imported':'Imported {n} files',
      'error.invalidHex':'raw_hex must be a valid even-length hexadecimal string','error.unsupported':'Unsupported extension: use .wc6 / .wc7 / .wc6full / .wc7full','error.size':'{format} must contain {expected} bytes, found {actual}','error.string':'String must not contain null characters','error.longString':'String is too long: maximum {max} UTF-16 code units','error.date':'Date must be a valid YYYY-MM-DD','error.date7':'WC7 dates must be within 2000–2099','error.positive':'Value must be an unsigned integer','error.range':'Value must be between 0 and {max}','error.unknownField':'Unknown or read-only field: {field}',
      'error.integer':'Field “{field}” requires an unsigned integer','error.fullLocked':'Edited Full CRC is unverified; binary export is blocked. Export JSON instead.','error.noFiles':'No files to audit',
      'toast.exportBin':'Exported {filename} ({n} bytes changed)','toast.exportJson':'Exported lossless JSON (v0.1 compatible)','toast.exportCsv':'Exported audit report for {n} cards','toast.cleared':'Cleared file list (original files unchanged)','toast.sample':'Loaded a synthetic demo card; edit the date or import your own file',
      'audit.format':'Format','audit.bytes':'File Bytes','audit.reserved':'Unknown / Reserved Bytes','audit.reservedValue':'Kept verbatim; never silently reserialized','audit.sha':'SHA-256 (Original)','audit.shaUnavailable':'Unavailable in this browser','audit.modifiedFields':'Modified Fields','audit.modifiedBytes':'Changed Bytes','audit.pid':'PID / Generation Rule','audit.iv':'IV Rule','audit.date':'Date Parsing','audit.result':'Audit Result','audit.full':'Full Export','audit.invalidDate':'Date missing or invalid','audit.unknownPid':'Unknown PID generation mode','audit.highLevel':'Level exceeds 100','audit.oddIv':'Unusual IV control value','audit.nonPokemon':'Not a Pokémon gift','audit.iv3':'3 guaranteed 31 IVs','audit.iv2':'2 guaranteed 31 IVs','audit.ivRaw':'See raw IV bytes','audit.na':'N/A','audit.ok':'Basic format check passed (not official legality)','audit.fullLocked':'Blocked: modified Full CRC is unverified','audit.fullUnchanged':'Unchanged Full may be exported verbatim','audit.noDiff':'No bytes modified.',
      'pid.0':'Fixed PID','pid.1':'Random (shiny possible)','pid.2':'Always Shiny','pid.3':'Never Shiny','pid.unknown':'Unknown','option.card_type.0':'Pokémon','option.card_type.1':'Item','option.card_type.3':'Battle Points','option.gender.0':'Male','option.gender.1':'Female','option.gender.2':'Genderless','option.gender.3':'Random','option.ability_mode.0':'Ability 1','option.ability_mode.1':'Ability 2','option.ability_mode.2':'Hidden Ability','option.ability_mode.3':'Random normal ability','option.ability_mode.4':'Random any ability','option.nature.255':'Random',
      'hint.pid_type':'0 Fixed / 1 Random / 2 Always Shiny / 3 Never Shiny. Changing this affects how gifts are generated.','hint.date':'WC6 uses YYYYMMDD as an integer; WC7 stores the year relative to 2000.','hint.title':'Reencoded as UTF-16LE only if edited; untouched bytes remain identical.','hint.status_flags':'Raw 8-bit flags; compare with the game and PKHeX.','hint.card_type':'Changing gift type is disabled to avoid incompatible structures.','hint.iv_hp':'254 (FE) commonly requests 3 guaranteed 31s; 253 (FD) 2; 255 random.','hint.pid':'A non-fixed PID type may ignore this stored PID when generating the Pokémon.','hint.met_level':'Historical mapped field; the level field is usually authoritative.',
      'field.card_id':'Card ID','field.title':'Card Title','field.date':'Received Date','field.card_location':'Card Location','field.card_type':'Gift Type','field.status_flags':'Status Flags','field.card_color':'Card Color / Flags','field.tid':'Trainer ID (TID)','field.sid':'Secret ID (SID)','field.origin_game':'Origin Game','field.encryption_constant':'Encryption Constant (EC)','field.ball':'Poké Ball ID','field.held_item':'Held Item','field.species':'Species ID','field.form':'Form','field.language':'Pokémon Language','field.nickname':'Nickname','field.nature':'Nature Mode','field.gender':'Gender Mode','field.ability_mode':'Ability Mode','field.pid_type':'PID / Shiny Mode','field.egg_location':'Egg Location','field.met_location':'Met Location','field.met_level':'Legacy Met Level','field.ot_gender':'OT Gender','field.ot_name':'Original Trainer Name','field.level':'Level','field.is_egg':'Is Egg','field.pid':'Fixed PID','field.memory_intensity':'Memory Intensity','field.memory_id':'Memory ID','field.memory_variable':'Memory Variable','field.memory_feeling':'Memory Feeling','field.item_id':'Item ID','field.quantity':'Quantity','field.allowed_games_mask':'Allowed Games Mask','field.distribution_effect':'Distribution Animation','field.allowed_language':'Allowed Language','field.distribution_mode':'Distribution Mode','field.sub_id':'Sub ID','field.set_count':'Set Count','field.rarity_or_marker':'Marker','field.move':'Move {n}','field.relearn_move':'Relearn Move {n}','field.iv':'IV · {stat}','field.ev':'EV · {stat}'
    },
    ja: {
      'app.title':'ふしぎなおくりもの編集','side.workspace':'ワークスペース','side.import':'カードを読み込む','side.clear':'クリア','side.local':'ローカル・オフライン','side.privacy':'ファイルはブラウザー内のみで処理され、送信されません。','top.library':'ライブラリー','top.workspace':'カード編集画面','top.json':'JSON を出力','top.binary':'WC ファイルを出力','top.theme':'ライト／ダーク切替','top.language':'表示言語',
      'workspace.description':'第6・第7世代のふしぎなカードを閲覧・編集・監査します。未解析バイトはそのまま保持します。','workspace.auditCsv':'監査 CSV を出力','drop.label':'.wc6 / .wc7 / .wc6full / .wc7full / JSON をここにドロップ','empty.heading':'カードを読み込みましょう','empty.description':'複数選択、ドラッグ＆ドロップに対応しています。','empty.open':'ファイルを選択','hero.changed':'変更あり','hero.id':'カード ID','hero.date':'受信日','hero.size':'ファイルサイズ','hero.gift':'ふしぎなおくりもの',
      'tab.fields':'項目編集','tab.json':'JSON データ','tab.audit':'検証・監査','section.header':'基本情報','section.pokemon':'ポケモン設定','section.item':'どうぐ設定','section.full':'Full 配信設定','section.json':'構造化 JSON','section.audit':'監査・整合性','section.history':'変更履歴','full.warning':'Full 形式の変更後 CRC は実データで検証されていません。未編集の Full のみ出力できます。','json.tip':'現在の項目と元のバイト列を表示します。JSON のコピーや出力が可能です。未解析データを守るため項目編集タブで編集してください。',
      'inspector.title':'16進数インスペクター','inspector.red':'赤色 = 変更したバイト／クリックでオフセットを確認','search.placeholder':'⌕ カード・ID・ファイル名を検索','files.count':'{n} ファイル','files.none':'該当するカードがありません','files.invalidDate':'無効な日付','kind.pokemon':'ポケモン配信','kind.item':'どうぐ配信','kind.bp':'BP 配信','kind.unknown':'不明な形式','card.fallback':'ふしぎなカード','hero.unknownDate':'不明／未設定','diff.count':'{n} 件の変更','diff.empty':'変更されたバイトはありません。元のデータは保持されています。','validation.selected':'選択中 {offset} · {value}','validation.fullLocked':'Full 変更あり · 出力不可','validation.untouched':'指定項目のみ変更／未解析バイトは保持','files.imported':'{n} ファイルを読み込みました',
      'error.invalidHex':'raw_hex は偶数文字の16進数で入力してください','error.unsupported':'未対応の拡張子です。.wc6 / .wc7 / .wc6full / .wc7full を使用してください','error.size':'{format} は {expected} バイト必要ですが {actual} バイトです','error.string':'文字列にヌル文字を含めることはできません','error.longString':'文字列が長すぎます。最大 {max} UTF-16 単位です','error.date':'日付は有効な YYYY-MM-DD にしてください','error.date7':'WC7 の日付は 2000–2099 年のみ対応します','error.positive':'符号なし整数を指定してください','error.range':'値の範囲は 0..{max} です','error.unknownField':'不明または読み取り専用の項目：{field}',
      'error.integer':'「{field}」には符号なし整数を入力してください','error.fullLocked':'変更した Full の CRC が未検証のため出力できません。JSON を出力してください。','error.noFiles':'監査するファイルがありません','toast.exportBin':'{filename} を出力しました（{n} バイト変更）','toast.exportJson':'ロスレス JSON を出力しました（v0.1 互換）','toast.exportCsv':'{n} 件の監査 CSV を出力しました','toast.cleared':'ファイル一覧をクリアしました（元ファイルは未変更）','toast.sample':'合成サンプルカードを読み込みました',
      'audit.format':'ファイル形式','audit.bytes':'バイト数','audit.reserved':'未解析／予約領域','audit.reservedValue':'元のバイト列を変更せず保持','audit.sha':'SHA-256（元ファイル）','audit.shaUnavailable':'このブラウザーでは利用できません','audit.modifiedFields':'変更項目数','audit.modifiedBytes':'変更バイト数','audit.pid':'PID／生成ルール','audit.iv':'個体値ルール','audit.date':'日付の解析','audit.result':'監査結果','audit.full':'Full 出力','audit.invalidDate':'日付が無効または未設定','audit.unknownPid':'不明な PID 生成モード','audit.highLevel':'レベルが 100 を超えています','audit.oddIv':'一般的でない個体値指定','audit.nonPokemon':'ポケモン以外の配信','audit.iv3':'3か所が31保証','audit.iv2':'2か所が31保証','audit.ivRaw':'元の IV バイトを参照','audit.na':'該当なし','audit.ok':'基本形式の検査に合格（公式の合法性判定ではありません）','audit.fullLocked':'変更後 CRC 未検証のため出力不可','audit.fullUnchanged':'未編集の Full はそのまま出力可能','audit.noDiff':'バイトに変更はありません。',
      'pid.0':'固定 PID','pid.1':'ランダム（色違い可）','pid.2':'必ず色違い','pid.3':'色違い不可','pid.unknown':'不明','option.card_type.0':'ポケモン','option.card_type.1':'どうぐ','option.card_type.3':'BP','option.gender.0':'♂','option.gender.1':'♀','option.gender.2':'性別不明','option.gender.3':'ランダム','option.ability_mode.0':'特性 1','option.ability_mode.1':'特性 2','option.ability_mode.2':'隠れ特性','option.ability_mode.3':'通常特性からランダム','option.ability_mode.4':'すべての特性からランダム','option.nature.255':'ランダム',
      'hint.pid_type':'0 固定／1 ランダム／2 必ず色違い／3 色違い不可。変更すると生成条件が変わります。','hint.date':'WC6 は YYYYMMDD 整数、WC7 は 2000 年を基準とする年です。','hint.title':'変更したときだけ UTF-16LE で再エンコードします。','hint.status_flags':'生の8ビットフラグです。ゲームと PKHeX で確認してください。','hint.card_type':'形式の不一致を防ぐため、配信種別の変更は無効です。','hint.iv_hp':'254 (FE) は3V、253 (FD) は2V保証の指定によく使用され、255 はランダムです。','hint.pid':'PID モードが固定でない場合、この保存値は実際のポケモンで使用されないことがあります。','hint.met_level':'古い対応項目。通常は level が実際のレベルです。',
      'field.card_id':'カード ID','field.title':'カード名','field.date':'受信日','field.card_location':'受信元／場所','field.card_type':'おくりもの種別','field.status_flags':'状態フラグ','field.card_color':'カード色／フラグ','field.tid':'トレーナー ID (TID)','field.sid':'裏 ID (SID)','field.origin_game':'出身ゲーム','field.encryption_constant':'暗号化定数 (EC)','field.ball':'ボール ID','field.held_item':'持ち物','field.species':'ポケモン図鑑番号','field.form':'フォルム','field.language':'ポケモンの言語','field.nickname':'ニックネーム','field.nature':'性格','field.gender':'性別','field.ability_mode':'特性モード','field.pid_type':'PID／色違いモード','field.egg_location':'タマゴ入手場所','field.met_location':'出会った場所','field.met_level':'旧レベル項目','field.ot_gender':'親の性別','field.ot_name':'親名','field.level':'レベル','field.is_egg':'タマゴかどうか','field.pid':'固定 PID','field.memory_intensity':'思い出の強さ','field.memory_id':'思い出 ID','field.memory_variable':'思い出の値','field.memory_feeling':'思い出の気持ち','field.item_id':'どうぐ ID','field.quantity':'個数','field.allowed_games_mask':'対応ゲームビット','field.distribution_effect':'配信エフェクト','field.allowed_language':'受信できる言語','field.distribution_mode':'配信モード','field.sub_id':'サブ ID','field.set_count':'設定数','field.rarity_or_marker':'フラグ','field.move':'わざ {n}','field.relearn_move':'思い出しわざ {n}','field.iv':'個体値 · {stat}','field.ev':'努力値 · {stat}'
    }
  };
  Object.assign(catalog['zh-TW'], {
    'error.invalidHex':'raw_hex 必須是偶數長度的十六進位字串',
    'error.unsupported':'不支援的檔案副檔名，請使用 .wc6 / .wc7 / .wc6full / .wc7full',
    'error.size':'{format} 應為 {expected} 位元組，實際為 {actual}',
    'error.string':'字串不得包含空字元',
    'error.longString':'字串過長：最多 {max} 個 UTF-16 單位',
    'error.date':'日期必須為有效的 YYYY-MM-DD',
    'error.date7':'WC7 日期僅支援 2000–2099',
    'error.positive':'數值必須是非負整數',
    'error.range':'值須在 0..{max} 範圍內',
    'error.unknownField':'未知或不可編輯欄位：{field}',
    'field.card_id':'卡片 ID','field.title':'卡片標題','field.date':'接收日期','field.card_location':'卡片來源／位置','field.card_type':'禮物類型','field.status_flags':'狀態旗標','field.card_color':'背景色／卡片旗標',
    'field.tid':'訓練家 ID (TID)','field.sid':'秘密 ID (SID)','field.origin_game':'來源遊戲','field.encryption_constant':'加密常數 (EC)','field.ball':'精靈球 ID','field.held_item':'攜帶道具','field.species':'寶可夢圖鑑編號','field.form':'形態','field.language':'寶可夢語言','field.nickname':'暱稱','field.nature':'性格模式','field.gender':'性別模式','field.ability_mode':'特性模式','field.pid_type':'PID／異色模式',
    'field.egg_location':'蛋取得地點','field.met_location':'相遇地點','field.met_level':'舊版等級欄位','field.ot_gender':'原訓練家性別','field.ot_name':'原訓練家名字','field.level':'等級','field.is_egg':'是否為蛋','field.pid':'固定 PID','field.memory_intensity':'回憶強度','field.memory_id':'回憶 ID','field.memory_variable':'回憶參數','field.memory_feeling':'回憶感受',
    'field.item_id':'道具 ID','field.quantity':'數量','field.allowed_games_mask':'遊戲版本遮罩','field.distribution_effect':'動畫效果','field.allowed_language':'允許接收的語言','field.distribution_mode':'配信模式','field.sub_id':'子 ID','field.set_count':'設定數量','field.rarity_or_marker':'旗標位','field.move':'招式 {n}','field.relearn_move':'回憶招式 {n}','field.iv':'IV · {stat}','field.ev':'EV · {stat}'
  });
  const natures = {
    'zh-CN':['勤奋','怕寂寞','勇敢','固执','顽皮','大胆','坦率','悠闲','淘气','乐天','胆小','急躁','认真','爽朗','天真','内敛','慢吞吞','冷静','害羞','马虎','温和','温顺','自大','慎重','浮躁'],
    'zh-TW':['勤奮','怕寂寞','勇敢','固執','頑皮','大膽','坦率','悠閒','淘氣','樂天','膽小','急躁','認真','爽朗','天真','內斂','慢吞吞','冷靜','害羞','馬虎','溫和','溫順','自大','慎重','浮躁'],
    en:['Hardy','Lonely','Brave','Adamant','Naughty','Bold','Docile','Relaxed','Impish','Lax','Timid','Hasty','Serious','Jolly','Naive','Modest','Mild','Quiet','Bashful','Rash','Calm','Gentle','Sassy','Careful','Quirky'],
    ja:['がんばりや','さみしがり','ゆうかん','いじっぱり','やんちゃ','ずぶとい','すなお','のんき','わんぱく','のうてんき','おくびょう','せっかち','まじめ','ようき','むじゃき','ひかえめ','おっとり','れいせい','てれや','うっかりや','おだやか','おとなしい','なまいき','しんちょう','きまぐれ']
  };
  const localeNames = {'zh-CN':'简体中文','zh-TW':'繁體中文',en:'English',ja:'日本語'};
  let locale = 'zh-CN';
  const choose = lang => {
    if (Object.hasOwn(catalog,lang)) return lang;
    if (lang?.startsWith('en')) return 'en';
    if (lang?.startsWith('ja')) return 'ja';
    if (lang?.startsWith('zh')) return /(?:TW|HK|Hant)/i.test(lang) ? 'zh-TW' : 'zh-CN';
    return 'zh-CN';
  };
  try { locale=choose(localStorage.getItem('wondercard.ui.locale') || navigator.language); } catch { /* local file/private mode */ }
  function t(key,params={}) {
    const text=(catalog[locale]||{})[key] ?? catalog['zh-CN'][key] ?? key;
    return text.replace(/\{(\w+)\}/g,(_,k)=>String(params[k]??`{${k}}`));
  }
  function field(key) {
    if (/^(?:move|relearn_move)_[1-4]$/.test(key)) {
      const m=key.match(/^(move|relearn_move)_(\d)$/);
      return t(`field.${m[1]}`,{n:m[2]});
    }
    if (/^(?:iv|ev)_(hp|atk|def|spe|spa|spd)$/.test(key)) {
      const m=key.match(/^(iv|ev)_(\w+)$/);
      const stat={hp:'HP',atk:locale==='ja'?'攻撃':'ATK',def:locale==='ja'?'防御':'DEF',spe:locale==='ja'?'素早さ':'SPE',spa:locale==='ja'?'特攻':'SPA',spd:locale==='ja'?'特防':'SPD'}[m[2]];
      return t(`field.${m[1]}`,{stat});
    }
    return t('field.'+key);
  }
  function option(key,num) {
    if(key==='nature' && num!==255)return (natures[locale]||natures['zh-CN'])[num]||String(num);
    if(key==='pid_type')return t('pid.'+num);
    return t(`option.${key}.${num}`);
  }
  function translateDom(){
    document.documentElement.lang=locale;
    document.title=`WonderCard Studio · ${t('app.title')}`;
    for(const e of document.querySelectorAll('[data-i18n]'))e.textContent=t(e.dataset.i18n);
    for(const e of document.querySelectorAll('[data-i18n-placeholder]'))e.placeholder=t(e.dataset.i18nPlaceholder);
    for(const e of document.querySelectorAll('[data-i18n-title]'))e.title=t(e.dataset.i18nTitle);
    for(const e of document.querySelectorAll('[data-i18n-aria-label]'))e.setAttribute('aria-label',t(e.dataset.i18nAriaLabel));
    const s=document.getElementById('locale-switch');if(s)s.value=locale;
  }
  function setLocale(lang){
    locale=choose(lang);
    try{localStorage.setItem('wondercard.ui.locale',locale);}catch{ /* private mode */ }
    translateDom();
    window.dispatchEvent(new CustomEvent('wc-locale-change',{detail:{locale}}));
  }
  function init(){translateDom(); const sel=document.getElementById('locale-switch');if(sel)sel.addEventListener('change',()=>setLocale(sel.value));}
  window.WC_I18N={catalog,localeNames,t,field,option,getLocale:()=>locale,setLocale,translateDom,init};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();