use serde::Serialize;
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};
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
        let main_window=app.get_webview_window("main")
            .ok_or_else(||"Main window was not available for the native file picker".to_string())?;
        let selection = app.dialog().file().set_parent(&main_window)
            .add_filter("WonderCard / JSON v2", &["wc6", "wc7", "wc6full", "wc7full", "wc8", "wb8", "wa8", "wc9", "wa9", "pgf", "wc5full", "pgt", "pcd", "wc4", "bin", "json"])
            .blocking_pick_files();
        let mut cards = Vec::new();
        for selected in selection.unwrap_or_default() {
            let path = selected.into_path().map_err(|e|e.to_string())?;
            cards.push(read_selected_path(path)?);
        }
        Ok(cards)
    }).await.map_err(|e|e.to_string())?
}


/** Pure disk read boundary; invoked only after a user-chosen native picker path. */
fn read_selected_path(path:PathBuf)->Result<OpenedCard,String>{
    let ext=path.extension().and_then(|x|x.to_str()).unwrap_or("").to_ascii_lowercase();
    let limit=if ext=="json"{MAX_JSON}else{MAX_BINARY};
    let len=fs::metadata(&path).map_err(|e|e.to_string())?.len();
    if len>limit as u64{return Err("Selected file exceeds allowed size".into());}
    let bytes=fs::read(&path).map_err(|e|e.to_string())?;
    if bytes.len()>limit{return Err("Selected file exceeds allowed size".into());}
    let filename=path.file_name().and_then(|x|x.to_str())
        .ok_or_else(||"Selected file has no valid Unicode name".to_string())?.to_string();
    Ok(OpenedCard{filename,source_path:path.to_string_lossy().into_owned(),bytes})
}

/// Opens a native Save As dialog and publishes to a newly created path only.
/// No arbitrary JS-supplied destination paths are accepted by this command.
#[tauri::command]
pub async fn save_card_atomic(app:AppHandle, suggested_name:String,
    kind:String, data:Vec<u8>) -> Result<bool,String>
{
    validate_save_request(&suggested_name,&kind,data.len())?;
    tauri::async_runtime::spawn_blocking(move || {
        let main_window=app.get_webview_window("main")
            .ok_or_else(||"Main window was not available for the Save As dialog".to_string())?;
        let dialog=app.dialog().file().set_parent(&main_window).set_file_name(suggested_name);
        let dialog=if kind=="json" {
            dialog.add_filter("JSON v2",&["json"])
        } else {
            dialog.add_filter("WonderCard",&["wc6","wc7","wc6full","wc7full","wc8","wb8","wa8","wc9","wa9","pgf","wc5full","pgt","pcd","wc4","bin"])
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
    fn native_disk_read_preserves_raw_bytes_and_name(){
        let dir=std::env::temp_dir().join(format!("wc-pro-native-read-{}",std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        let path=dir.join("synthetic.wc7");
        let mut raw=vec![0u8;264];raw[0xd0]=50;raw[0x107]=0xa5;
        fs::write(&path,&raw).unwrap();
        let read=read_selected_path(path.clone()).unwrap();
        assert_eq!(read.filename,"synthetic.wc7");
        assert_eq!(read.bytes,raw);
        assert_eq!(read.source_path,path.to_string_lossy());
        let _=fs::remove_dir_all(dir);
    }
    #[test]
    fn rejects_oversized_json_before_loading_into_memory(){
        let dir=std::env::temp_dir().join(format!("wc-pro-native-limit-{}",std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        let path=dir.join("too_big.json");
        let file=fs::File::create(&path).unwrap();
        file.set_len((MAX_JSON+1) as u64).unwrap();
        assert!(read_selected_path(path).is_err());
        let _=fs::remove_dir_all(dir);
    }
    #[test]
    fn command_rejects_traversal_or_oversize_before_dialog(){
        assert!(validate_save_request("../evil.wc6","wc",264).is_err());
        assert!(validate_save_request("card.wc6","wc",2*1024*1024+1).is_err());
        assert!(validate_save_request("card.wc6","wc",264).is_ok());
        assert!(validate_save_request("card.json","json",10000).is_ok());
        assert!(validate_save_request("a","anything",1).is_err());
    }
}
