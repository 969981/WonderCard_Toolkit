/** Four-language UI catalogs (UI only; never change card language fields). */
export const LANGUAGES = ["zh-CN","zh-TW","en","ja"] as const;
export type Locale = typeof LANGUAGES[number];
export const rows = [
  [
    "app.name",
    "WonderCard 专业编辑器",
    "WonderCard 專業編輯器",
    "WonderCard Pro Editor",
    "WonderCard プロエディター"
  ],
  [
    "app.alpha",
    "v0.4 Alpha · 实验版",
    "v0.4 Alpha · 實驗版",
    "v0.4 Alpha · Experimental",
    "v0.4 Alpha · 実験版"
  ],
  [
    "app.offline",
    "Windows · 本地离线",
    "Windows · 本機離線",
    "Windows · Local/offline",
    "Windows · ローカル/オフライン"
  ],
  [
    "app.theme",
    "切换主题",
    "切換主題",
    "Toggle theme",
    "テーマ切替"
  ],
  [
    "app.language",
    "界面语言",
    "介面語言",
    "Interface language",
    "表示言語"
  ],
  [
    "sidebar.open",
    "打开文件",
    "開啟檔案",
    "Open files",
    "ファイルを開く"
  ],
  [
    "sidebar.demo",
    "打开合成演示卡",
    "開啟合成示範卡",
    "Open synthetic sample",
    "合成サンプルを開く"
  ],
  [
    "sidebar.library",
    "文件库",
    "檔案庫",
    "File library",
    "ファイル一覧"
  ],
  [
    "sidebar.search",
    "搜索文件名",
    "搜尋檔案名稱",
    "Search filenames",
    "ファイル名で検索"
  ],
  [
    "sidebar.readonly",
    "只读",
    "唯讀",
    "Read-only",
    "読み取り専用"
  ],
  [
    "sidebar.editable",
    "受限字段可编辑",
    "受限欄位可編輯",
    "Selected fields editable",
    "一部フィールド編集可"
  ],
  [
    "sidebar.info",
    "WC6/WC7 基础编辑；Full/未知只读；默认另存为",
    "WC6/WC7 基礎編輯；Full/未知唯讀；預設另存",
    "WC6/WC7 limited edits; Full/unknown read-only; Save As only",
    "WC6/WC7 の一部のみ編集可。Full/不明は読み取り専用。別名保存"
  ],
  [
    "empty.title",
    "打开 WonderCard 文件",
    "開啟 WonderCard 檔案",
    "Open WonderCard files",
    "WonderCard ファイルを開く"
  ],
  [
    "empty.desc",
    "选择或拖入 WC6、WC7、Full 或 JSON v2 文件。仅在本机处理数据。",
    "選取或拖入 WC6、WC7、Full 或 JSON v2 檔案。資料僅在本機處理。",
    "Select or drop WC6, WC7, Full, or JSON v2 files. Processing stays local.",
    "WC6、WC7、Full、JSON v2 を選択またはドロップ。データはローカル処理。"
  ],
  [
    "empty.pick",
    "选择文件",
    "選擇檔案",
    "Choose files",
    "ファイルを選択"
  ],
  [
    "empty.example",
    "合成示例",
    "合成範例",
    "Synthetic example",
    "合成サンプル"
  ],
  [
    "toolbar.undo",
    "撤销",
    "復原",
    "Undo",
    "元に戻す"
  ],
  [
    "toolbar.redo",
    "重做",
    "重做",
    "Redo",
    "やり直す"
  ],
  [
    "toolbar.export",
    "导出 JSON v2",
    "匯出 JSON v2",
    "Export JSON v2",
    "JSON v2 書き出し"
  ],
  [
    "toolbar.save",
    "另存为 WC",
    "另存為 WC",
    "Save WC as…",
    "WC を別名保存"
  ],
  [
    "toolbar.changed",
    "已修改字节：{count}",
    "已修改位元組：{count}",
    "Changed bytes: {count}",
    "変更バイト数: {count}"
  ],
  [
    "editor.fields",
    "字段检查器",
    "欄位檢查器",
    "Field inspector",
    "フィールドインスペクター"
  ],
  [
    "editor.byte",
    "字节检查工作台",
    "位元組檢查工作區",
    "Byte inspector",
    "バイトインスペクター"
  ],
  [
    "editor.authority",
    "原始字节为权威",
    "原始位元組為準",
    "Original bytes authoritative",
    "元のバイト列が正本"
  ],
  [
    "editor.readonly",
    "只读",
    "唯讀",
    "Read-only",
    "読み取り専用"
  ],
  [
    "editor.editable",
    "部分可编辑",
    "部分可編輯",
    "Partially editable",
    "一部編集可能"
  ],
  [
    "editor.notice",
    "不保证官方配信真实性或游戏内合法性。",
    "不保證官方配信真實性或遊戲內合法性。",
    "No guarantee of official provenance or in-game legality.",
    "公式配布元やゲーム内での正当性は保証しません。"
  ],
  [
    "editor.unknown",
    "无法可靠识别格式；可检查 HEX 只读视图。",
    "無法可靠辨識格式；可檢查 HEX 唯讀檢視。",
    "Format ambiguous; HEX inspection stays read-only.",
    "形式を確定できません。HEX は読み取り専用。"
  ],
  [
    "editor.hex",
    "HEX",
    "HEX",
    "HEX",
    "HEX"
  ],
  [
    "editor.diff",
    "字节差异",
    "位元組差異",
    "Byte diff",
    "バイト差分"
  ],
  [
    "editor.json",
    "JSON 编辑",
    "JSON 編輯",
    "Edit JSON",
    "JSON 編集"
  ],
  [
    "editor.jsonApply",
    "应用 JSON 修改",
    "套用 JSON 修改",
    "Apply JSON changes",
    "JSON 変更を適用"
  ],
  [
    "editor.jsonHelp",
    "修改 fields 字段后应用；raw_hex / baseline / hash 不得改动。",
    "修改 fields 後套用；不得修改 raw_hex / baseline / hash。",
    "Edit fields, then apply. Do not alter raw_hex / baseline / hash.",
    "fields のみ変更し適用。raw_hex / baseline / hash は変更不可。"
  ],
  [
    "editor.loading",
    "正在加载本地 Monaco…",
    "正在載入本機 Monaco…",
    "Loading local Monaco…",
    "ローカル Monaco を読み込み中…"
  ],
  [
    "diff.help",
    "只显示发生变化的字节，未修改区域保持原样。",
    "僅顯示已變更位元組，其他區域保留原樣。",
    "Only changed bytes are listed; other bytes remain intact.",
    "変更されたバイトのみ表示し、それ以外は保持します。"
  ],
  [
    "diff.none",
    "没有字节修改。",
    "沒有位元組變更。",
    "No byte changes.",
    "バイト変更はありません。"
  ],
  [
    "diff.offset",
    "偏移",
    "偏移",
    "Offset",
    "オフセット"
  ],
  [
    "diff.old",
    "原始",
    "原始",
    "Original",
    "元の値"
  ],
  [
    "diff.new",
    "修改后",
    "修改後",
    "Modified",
    "変更後"
  ],
  [
    "hex.title",
    "十六进制检查器",
    "十六進位檢查器",
    "Hex inspector",
    "HEX インスペクター"
  ],
  [
    "hex.help",
    "双击可写字段字节并输入两位 HEX；未知字节和 Full 保持只读。",
    "雙擊可寫欄位的位元組輸入兩位 HEX；未知位元組及 Full 唯讀。",
    "Double-click an allowed byte and enter two HEX digits. Unknown/Full bytes are locked.",
    "編集可能なバイトをダブルクリックして16進2桁を入力。不明/Full は読み取り専用。"
  ],
  [
    "hex.byteInput",
    "输入两位十六进制值",
    "輸入兩位十六進位值",
    "Enter two hex digits",
    "16進数2桁を入力"
  ],
  [
    "hex.editHint",
    "双击编辑该字节",
    "雙擊編輯該位元組",
    "Double-click to edit byte",
    "ダブルクリックで編集"
  ],
  [
    "hex.lockedHint",
    "字节未在允许写入范围内",
    "位元組不在允許寫入範圍內",
    "Byte outside writable field",
    "書き込み許可外のバイト"
  ],
  [
    "status.local",
    "本地模式",
    "本機模式",
    "Local mode",
    "ローカルモード"
  ],
  [
    "status.none",
    "未打开文件",
    "未開啟檔案",
    "No open file",
    "ファイル未選択"
  ],
  [
    "status.research",
    "实验版 · 未经过实卡全面验证",
    "實驗版 · 尚未完成實卡驗證",
    "Experimental · real-card validation pending",
    "実験版 · 実機検証未完了"
  ],
  [
    "message.imported",
    "已导入 {count} 个文件",
    "已匯入 {count} 個檔案",
    "Imported {count} files",
    "{count} 件のファイルを読み込みました"
  ],
  [
    "message.edited",
    "字段已更新：{field}",
    "欄位已更新：{field}",
    "Field updated: {field}",
    "フィールドを更新: {field}"
  ],
  [
    "message.byteEdited",
    "字节已更新：{offset}",
    "位元組已更新：{offset}",
    "Byte updated: {offset}",
    "バイト更新: {offset}"
  ],
  [
    "message.applied",
    "JSON 修改已验证并应用",
    "JSON 修改已驗證並套用",
    "JSON changes validated and applied",
    "JSON 変更を検証して適用しました"
  ],
  [
    "message.saved",
    "导出已触发，原文件未覆盖",
    "已觸發匯出，原檔未覆蓋",
    "Export started; source file unchanged",
    "書き出し開始。元ファイルは変更しません"
  ],
  [
    "message.close",
    "关闭提示",
    "關閉提示",
    "Dismiss message",
    "通知を閉じる"
  ],
  [
    "reason.full",
    "Full 校验与重封装未完成，只能无修改导出",
    "Full 校驗與重新封裝尚未完成，只可原樣匯出",
    "Full validation/repack unverified; unchanged export only",
    "Full の検証が未完了。変更なしの書き出しのみ"
  ],
  [
    "reason.ambiguous",
    "存在多个候选格式，禁止编辑",
    "有多個候選格式，禁止編輯",
    "Ambiguous format, edits disabled",
    "形式が複数候補のため編集不可"
  ],
  [
    "reason.unknown",
    "未知格式或文件长度不匹配",
    "未知格式或檔案長度不符",
    "Unknown format or invalid size",
    "未知の形式またはサイズ不一致"
  ],
  [
    "reason.basic",
    "依据扩展名与长度识别，仅对已验证字段开放写入",
    "依副檔名與長度辨識，僅已驗證欄位可寫入",
    "Extension/size probe; write only validated fields",
    "拡張子とサイズによる識別。検証済みフィールドのみ書き込み可"
  ],
  [
    "field.card_id",
    "配信卡 ID",
    "配信卡 ID",
    "Card ID",
    "カード ID"
  ],
  [
    "field.title",
    "配信标题",
    "配信標題",
    "Card title",
    "カード名"
  ],
  [
    "field.date",
    "接收日期",
    "接收日期",
    "Received date",
    "受取日"
  ],
  [
    "field.card_location",
    "卡片来源",
    "卡片來源",
    "Location",
    "場所"
  ],
  [
    "field.card_type",
    "礼物类型",
    "禮物類型",
    "Gift type",
    "プレゼントの種類"
  ],
  [
    "field.status_flags",
    "状态标志",
    "狀態標記",
    "Status flags",
    "状態フラグ"
  ],
  [
    "field.pokemon.species",
    "宝可梦编号",
    "寶可夢編號",
    "Pokémon species",
    "ポケモン図鑑番号"
  ],
  [
    "field.pokemon.nature",
    "性格模式",
    "性格模式",
    "Nature mode",
    "性格設定"
  ],
  [
    "field.pokemon.pid_type",
    "PID/闪光模式",
    "PID/異色模式",
    "PID/Shiny mode",
    "PID/色違い設定"
  ],
  [
    "field.pokemon.level",
    "等级",
    "等級",
    "Level",
    "レベル"
  ],
  ["field.length","长度：{length} 字节","長度：{length} 位元組","Length: {length} bytes","長さ: {length} バイト"],
  ["error.sha","源文件 SHA-256 不一致，拒绝导入","來源檔 SHA-256 不符，拒絕匯入","Source SHA-256 mismatch; import refused","元データ SHA-256 が一致しないため読み込みを拒否"],
  ["error.baseline","JSON 的原始字段基线遭到修改","JSON 的原始欄位基線已遭修改","JSON baseline fields were modified","JSON の元フィールド値が変更されています"],
  ["error.patch","JSON 字节补丁与字段修改不一致","JSON 位元組補丁與欄位變更不符","JSON patch bytes do not match edited fields","JSON パッチのバイト列がフィールド変更と一致しません"],
  ["error.hex","HEX 值必须是两位 00–FF","HEX 值必須是兩位 00–FF","HEX value must be two digits 00–FF","HEX 値は 00〜FF の2桁で指定してください"],
  ["error.date","日期编码无效或超出范围","日期編碼無效或超出範圍","Invalid or out-of-range date encoding","日付コードが無効か範囲外です"],
  ["error.readonly","该字段或字节暂未获得安全写入权限","此欄位或位元組尚未開放安全寫入","This field/byte is not writable","このフィールド/バイトへの書き込みは許可されていません"],
  ["error.large","导入文件超出允许大小","匯入檔案超出允許大小","Imported file exceeds size limit","読み込みファイルがサイズ制限を超えています"],
  ["error.exists","已存在同名文件或选择了源文件，禁止覆盖","同名檔案已存在或選到了來源檔，禁止覆寫","Target exists or is source file; overwrite is disabled","保存先が既存または元ファイルのため上書き禁止"],
  ["error.json","JSON 文件结构或字段无效","JSON 檔案結構或欄位無效","Invalid JSON structure or field","JSON の構造またはフィールドが無効です"],
  ["error.generic","操作失败：{detail}","操作失敗：{detail}","Operation failed: {detail}","操作に失敗しました: {detail}"]
] as const;
export type TextKey = typeof rows[number][0];
const catalogs: Record<Locale,Record<string,string>>={
  "zh-CN":Object.fromEntries(rows.map(row=>[row[0],row[1]])),
  "zh-TW":Object.fromEntries(rows.map(row=>[row[0],row[2]])),
  "en":Object.fromEntries(rows.map(row=>[row[0],row[3]])),
  "ja":Object.fromEntries(rows.map(row=>[row[0],row[4]]))
};
export function t(lang:Locale,key:TextKey,values?:Record<string,number|string>):string {
  let result=catalogs[lang][key]??catalogs["en"][key]??key;
  if(values)for(const [name,value] of Object.entries(values))
    result=result.replaceAll("{"+name+"}",String(value));
  return result;
}
export function labelForField(lang:Locale,fieldId:string,fallback:string):string {
  const key="field."+fieldId;
  return key in catalogs[lang] ? catalogs[lang][key] : fallback;
}
export function reasonFor(lang:Locale,format:string|null,candidateCount:number,filename:string):string {
  if(format?.endsWith("full"))return t(lang,"reason.full");
  if(!format && candidateCount)return t(lang,"reason.ambiguous");
  if(!format)return t(lang,"reason.unknown");
  void filename;
  return t(lang,"reason.basic");
}

/** Common safety validation errors localized; unknown errors retain diagnostic details. */
export function localizedError(lang:Locale,error:unknown):string {
  const detail=error instanceof Error?error.message:String(error);
  if(/SHA-256/i.test(detail))return t(lang,"error.sha");
  if(/Baseline field|baseline_fields/i.test(detail))return t(lang,"error.baseline");
  if(/Patch byte manifest|Patch bytes/i.test(detail))return t(lang,"error.patch");
  if(/HEX byte must|two hex digits/i.test(detail))return t(lang,"error.hex");
  if(/Invalid raw date|日期|ISO date|date encoding|WC7 年份/i.test(detail))return t(lang,"error.date");
  if(/只读|不可编辑|writable field|writable whitelist|outside writable|not writable|禁止修改/i.test(detail))return t(lang,"error.readonly");
  if(/oversized|too large|过大/i.test(detail))return t(lang,"error.large");
  if(/已存在|覆盖原始|already exists|Target exists|overwrite/i.test(detail))return t(lang,"error.exists");
  if(/JSON syntax|JSON schema|Invalid JSON|Missing JSON|Fields structure/i.test(detail))return t(lang,"error.json");
  return t(lang,"error.generic",{detail});
}
