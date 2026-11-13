use serde::Serialize;
use std::{fs, path::PathBuf};
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;
use crate::atomic::write_new_atomic;

const MAX_BINARY: usize = 2 * 1024 * 1024;
const MAX_JSON: usize = 10 * 1024 * 1024;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenedCard {
    filename: String,
    source_path: String,
    bytes: Vec<u8>,
}

#[tauri::command]
pub async fn open_cards_native(app: AppHandle) -> Result<Vec<OpenedCard>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let selection = app.dialog().file()
            .add_filter("WonderCard / JSON v2", &["wc6", "wc7", "wc6full", "wc7full", "bin", "json"])
            .blocking_pick_files();
        let mut cards = Vec::new();
        for selected in selection.unwrap_or_default() {
            let path = selected.into_path().map_err(|e|e.to_string())?;
            let ext = path.extension().and_then(|x|x.to_str()).unwrap_or("").to_ascii_lowercase();
            let limit = if ext=="json" {MAX_JSON} else {MAX_BINARY};
            let len=fs::metadata(&path).map_err(|e|e.to_string())?.len();
            if len > limit as u64 { return Err("Selected file exceeds allowed size".into()); }
            let bytes=fs::read(&path).map_err(|e|e.to_string())?;
            if bytes.len() > limit { return Err("Selected file exceeds allowed size".into()); }
            let filename = path.file_name().and_then(|x|x.to_str())
                .ok_or_else(||"Selected file has no valid Unicode name".to_string())?.to_string();
            cards.push(OpenedCard{
                filename,source_path:path.to_string_lossy().into_owned(),bytes
            });
        }
        Ok(cards)
    }).await.map_err(|e|e.to_string())?
}

/// Opens a native Save As dialog and publishes to a newly created path only.
/// No arbitrary JS-supplied destination paths are accepted by this command.
#[tauri::command]
pub async fn save_card_atomic(app:AppHandle, suggested_name:String,
    kind:String, data:Vec<u8>) -> Result<bool,String>
{
    validate_save_request(&suggested_name,&kind,data.len())?;
    tauri::async_runtime::spawn_blocking(move || {
        let dialog=app.dialog().file().set_file_name(suggested_name);
        let dialog=if kind=="json" {
            dialog.add_filter("JSON v2",&["json"])
        } else {
            dialog.add_filter("WonderCard",&["wc6","wc7","wc6full","wc7full","bin"])
        };
        let Some(selected)=dialog.blocking_save_file() else {return Ok(false);};
        let target:PathBuf=selected.into_path().map_err(|e|e.to_string())?;
        // Filename selected explicitly by the OS dialog. Must keep original
        // bytes untouched: the no-replace primitive fails on every existing path.
        write_new_atomic(&target,&data).map_err(|e|format!("Atomic Save As refused: {e}"))?;
        Ok(true)
    }).await.map_err(|e|e.to_string())?
}

fn validate_save_request(name:&str,kind:&str,size:usize)->Result<(),String>{
    if name.trim().is_empty() || name.len()>240 ||
       name=="." || name==".." ||
       name.chars().any(|c|c=='/'||c=='\\'||c=='\0'||c.is_control()) {
        return Err("Invalid suggested filename".into());
    }
    match kind {
        "wc" if size<=MAX_BINARY => (),
        "json" if size<=MAX_JSON => (),
        _ => return Err("Invalid kind or payload length".into())
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn command_rejects_traversal_or_oversize_before_dialog(){
        assert!(validate_save_request("../evil.wc6","wc",264).is_err());
        assert!(validate_save_request("card.wc6","wc",2*1024*1024+1).is_err());
        assert!(validate_save_request("card.wc6","wc",264).is_ok());
        assert!(validate_save_request("card.json","json",10000).is_ok());
        assert!(validate_save_request("a","anything",1).is_err());
    }
}
