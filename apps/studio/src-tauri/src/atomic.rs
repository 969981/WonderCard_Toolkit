//! Commit-only new file publishing. No overwrite, even under concurrent writers.
use std::{
    fs::{self, File, OpenOptions},
    io::{self, Write},
    path::{Path, PathBuf},
    sync::atomic::{AtomicU64, Ordering},
};
static NEXT_TEMP: AtomicU64 = AtomicU64::new(1);

/// Write complete content to a private same-directory temporary file, sync its
/// contents, then publish using an atomic **no-replace** hard link.
/// Unlike check-then-write, this never truncates an existing target. The file
/// system must support hard links; unsupported/network mounts fail closed.
/// The target's parent must already exist; this routine never creates directories.
pub fn write_new_atomic(target: &Path, payload: &[u8]) -> io::Result<()> {
    if !target.is_absolute() {
        return Err(io::Error::new(io::ErrorKind::InvalidInput, "Absolute target path required"));
    }
    let parent = target.parent()
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "Target must have a parent"))?;
    let filename = target.file_name()
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "Target must name a file"))?
        .to_string_lossy();
    let (mut file, temp_path) = create_private_temp(parent, &filename)?;
    // Temp is removed on all normal error paths. A hard process kill may leave
    // a .partial file, but never a truncated target file.
    let output = (|| -> io::Result<()> {
        file.write_all(payload)?;
        file.sync_all()?;
        drop(file);
        // Hard-link creation is no-replace and atomic within the same volume.
        // Importantly, std::fs::rename is NOT sufficient for this guarantee.
        fs::hard_link(&temp_path, target)?;
        // On systems that support directory syncing, strengthen persistence.
        let _ = File::open(parent).and_then(|dir| dir.sync_all());
        Ok(())
    })();
    // Always attempt to remove temporary staging. If a write failed no target
    // exists, and if the link succeeded the target owns an additional hard link.
    let cleanup = fs::remove_file(&temp_path);
    output?;
    cleanup?;
    // Verification catches a storage driver that reported success but returned
    // unexpected bytes. Never delete published output on verification failure.
    let readback = fs::read(target)?;
    if readback != payload {
        return Err(io::Error::new(io::ErrorKind::InvalidData, "Saved bytes differ from payload"));
    }
    Ok(())
}

fn create_private_temp(parent: &Path, filename: &str) -> io::Result<(File, PathBuf)> {
    for _ in 0..128 {
        let sequence = NEXT_TEMP.fetch_add(1, Ordering::Relaxed);
        let temp = parent.join(format!(".{filename}.{}.{}.partial", std::process::id(), sequence));
        match OpenOptions::new().write(true).create_new(true).open(&temp) {
            Ok(file) => return Ok((file, temp)),
            Err(e) if e.kind() == io::ErrorKind::AlreadyExists => continue,
            Err(e) => return Err(e),
        }
    }
    Err(io::Error::new(io::ErrorKind::AlreadyExists, "Exhausted staging filenames"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{sync::{Arc, Barrier}, thread};
    static NEXT_CASE: AtomicU64 = AtomicU64::new(1);
    struct TestDir(PathBuf);
    impl TestDir {
        fn new() -> Self {
            let n = NEXT_CASE.fetch_add(1, Ordering::Relaxed);
            let p = std::env::temp_dir().join(format!("wc-pro-atomic-{}-{n}", std::process::id()));
            fs::create_dir(&p).unwrap();
            Self(p)
        }
    }
    impl Drop for TestDir { fn drop(&mut self) { let _ = fs::remove_dir_all(&self.0); } }
    #[test]
    fn binary_exact_and_no_temp_after_success() {
        let dir = TestDir::new();
        let target = dir.0.join("card.wc6");
        let mut data = vec![0u8; 0x108];
        data[0xd0] = 50; data[0x105] = 0xa5;
        write_new_atomic(&target, &data).unwrap();
        assert_eq!(fs::read(&target).unwrap(), data);
        assert_eq!(fs::read_dir(&dir.0).unwrap().count(), 1);
    }
    #[test]
    fn preexisting_destination_unchanged() {
        let dir = TestDir::new();
        let target = dir.0.join("original.wc7");
        fs::write(&target, b"DO NOT OVERWRITE").unwrap();
        assert!(write_new_atomic(&target, b"changed").is_err());
        assert_eq!(fs::read(&target).unwrap(), b"DO NOT OVERWRITE");
        assert_eq!(fs::read_dir(&dir.0).unwrap().count(), 1);
    }
    #[test]
    fn concurrent_same_name_exactly_one_publisher() {
        let dir = TestDir::new();
        let target = dir.0.join("race.wc6");
        let barrier = Arc::new(Barrier::new(9));
        let mut threads = vec![];
        for n in 0..8u8 {
            let target = target.clone();
            let barrier = barrier.clone();
            threads.push(thread::spawn(move || {
                let payload = vec![n; 264];
                barrier.wait();
                write_new_atomic(&target, &payload).is_ok()
            }));
        }
        barrier.wait();
        let results: Vec<bool> = threads.into_iter().map(|thread| thread.join().unwrap()).collect();
        assert_eq!(results.iter().filter(|&&success| success).count(), 1);
        assert_eq!(fs::read(&target).unwrap().len(), 264);
        assert_eq!(fs::read_dir(&dir.0).unwrap().count(), 1);
    }
    #[test]
    fn no_directory_creation_or_partial_publication_on_failure() {
        let dir = TestDir::new();
        let missing = dir.0.join("does-not-exist").join("card.wc6");
        assert!(write_new_atomic(&missing, b"test").is_err());
        assert!(!missing.exists());
        assert!(!missing.parent().unwrap().exists());
    }
    #[test]
    fn source_hardlink_alias_stays_unchanged() {
        let dir = TestDir::new();
        let original=dir.0.join("real.wc6");
        let alias=dir.0.join("alias.wc6");
        fs::write(&original,b"unchanged").unwrap();
        fs::hard_link(&original,&alias).unwrap();
        assert!(write_new_atomic(&alias,b"new").is_err());
        assert_eq!(fs::read(&original).unwrap(),b"unchanged");
    }
}