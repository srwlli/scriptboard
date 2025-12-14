import argparse
import csv
import hashlib
import json
import os
import re
import shutil
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

@dataclass(frozen=True)
class Action:
    op: str
    src: str
    dst: Optional[str] = None
    meta: Optional[dict] = None

def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

def log_action(action: Action) -> None:
    payload = {"ts": now_iso(), "op": action.op, "src": action.src}
    if action.dst is not None:
        payload["dst"] = action.dst
    if action.meta:
        payload.update(action.meta)
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
    sys.stdout.flush()

def safe_iter_files(root: Path, recursive: bool = True) -> Iterable[Path]:
    root = root.expanduser().resolve()
    if not root.exists():
        return []
    if root.is_file():
        return [root]
    if recursive:
        return (p for p in root.rglob("*") if p.is_file())
    return (p for p in root.glob("*") if p.is_file())

def ensure_dir(p: Path, apply: bool) -> None:
    if p.exists():
        return
    if apply:
        p.mkdir(parents=True, exist_ok=True)

def unique_path(dst: Path) -> Path:
    if not dst.exists():
        return dst
    stem = dst.stem
    suffix = dst.suffix
    parent = dst.parent
    i = 1
    while True:
        cand = parent / f"{stem} ({i}){suffix}"
        if not cand.exists():
            return cand
        i += 1

def move_file(src: Path, dst_dir: Path, apply: bool) -> Action:
    src = src.expanduser().resolve()
    dst_dir = dst_dir.expanduser().resolve()
    ensure_dir(dst_dir, apply)
    dst = unique_path(dst_dir / src.name)
    if apply:
        shutil.move(str(src), str(dst))
    return Action(op="move", src=str(src), dst=str(dst))

def rename_file(src: Path, new_name: str, apply: bool) -> Action:
    src = src.expanduser().resolve()
    dst = unique_path(src.with_name(new_name))
    if apply:
        src.rename(dst)
    return Action(op="rename", src=str(src), dst=str(dst))

def sanitize_filename(name: str, keep: str = r"[^A-Za-z0-9._ -]") -> str:
    name = re.sub(keep, "_", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name

def file_hash(p: Path, algo: str = "sha256", chunk_size: int = 1024 * 1024) -> str:
    h = hashlib.new(algo)
    with p.open("rb") as f:
        while True:
            b = f.read(chunk_size)
            if not b:
                break
            h.update(b)
    return h.hexdigest()

def cmd_organize(args: argparse.Namespace) -> None:
    src = Path(args.path).expanduser().resolve()
    mode = args.by
    recursive = not args.no_recursive
    apply = args.apply
    base = Path(args.dest).expanduser().resolve() if args.dest else src
    for f in safe_iter_files(src, recursive=recursive):
        if mode == "ext":
            key = f.suffix[1:].lower() if f.suffix else "noext"
        elif mode == "date":
            t = time.gmtime(f.stat().st_mtime)
            key = time.strftime("%Y-%m-%d", t)
        else:
            t = time.gmtime(f.stat().st_mtime)
            key = time.strftime("%Y-%m", t)
        dst_dir = base / key
        act = move_file(f, dst_dir, apply=apply)
        log_action(act)

def cmd_rename(args: argparse.Namespace) -> None:
    root = Path(args.path).expanduser().resolve()
    recursive = not args.no_recursive
    apply = args.apply
    pattern = re.compile(args.pattern) if args.pattern else None
    replace = args.replace if args.replace is not None else ""
    prefix = args.prefix or ""
    suffix = args.suffix or ""
    lower = args.lower
    upper = args.upper
    sanitize = args.sanitize
    start = args.start
    step = args.step
    width = args.width
    only_ext = args.ext.lower().lstrip(".") if args.ext else None
    i = start
    for f in safe_iter_files(root, recursive=recursive):
        if only_ext and f.suffix.lower().lstrip(".") != only_ext:
            continue
        name = f.stem
        ext = f.suffix
        if pattern:
            name = pattern.sub(replace, name)
        if args.enumerate:
            name = f"{name}_{i:0{width}d}"
            i += step
        name = prefix + name + suffix
        if lower and upper:
            pass
        elif lower:
            name = name.lower()
        elif upper:
            name = name.upper()
        new_name = name + ext
        if sanitize:
            new_name = sanitize_filename(new_name)
        if new_name != f.name:
            act = rename_file(f, new_name, apply=apply)
            log_action(act)

def cmd_clean(args: argparse.Namespace) -> None:
    root = Path(args.path).expanduser().resolve()
    recursive = not args.no_recursive
    apply = args.apply
    older_days = args.older_than_days
    larger_mb = args.larger_than_mb
    archive_dir = Path(args.archive).expanduser().resolve() if args.archive else (root / "_archive")
    cutoff = time.time() - (older_days * 86400) if older_days is not None else None
    for f in safe_iter_files(root, recursive=recursive):
        st = f.stat()
        ok = True
        if cutoff is not None and st.st_mtime >= cutoff:
            ok = False
        if larger_mb is not None and st.st_size < larger_mb * 1024 * 1024:
            ok = False
        if not ok:
            continue
        if args.delete:
            if apply:
                f.unlink()
            log_action(Action(op="delete", src=str(f.resolve())))
        else:
            act = move_file(f, archive_dir, apply=apply)
            log_action(act)

def cmd_index(args: argparse.Namespace) -> None:
    root = Path(args.path).expanduser().resolve()
    recursive = not args.no_recursive
    out = Path(args.out).expanduser().resolve() if args.out else None
    fmt = args.format
    include_hash = args.hash
    algo = args.hash_algo
    rows = []
    for f in safe_iter_files(root, recursive=recursive):
        st = f.stat()
        row = {
            "path": str(f.resolve()),
            "name": f.name,
            "size_bytes": st.st_size,
            "mtime_epoch": int(st.st_mtime),
        }
        if include_hash:
            try:
                row[f"{algo}"] = file_hash(f, algo=algo)
            except Exception as e:
                row[f"{algo}"] = None
                row["hash_error"] = str(e)
        rows.append(row)
    if fmt == "json":
        s = json.dumps(rows, ensure_ascii=False, indent=2)
        if out:
            out.write_text(s, encoding="utf-8")
        else:
            sys.stdout.write(s + "\n")
    else:
        if not rows:
            headers = ["path", "name", "size_bytes", "mtime_epoch"] + ([algo] if include_hash else [])
        else:
            headers = list(rows[0].keys())
        if out:
            with out.open("w", newline="", encoding="utf-8") as f:
                w = csv.DictWriter(f, fieldnames=headers)
                w.writeheader()
                for r in rows:
                    w.writerow(r)
        else:
            w = csv.DictWriter(sys.stdout, fieldnames=headers)
            w.writeheader()
            for r in rows:
                w.writerow(r)

def cmd_dupes(args: argparse.Namespace) -> None:
    root = Path(args.path).expanduser().resolve()
    recursive = not args.no_recursive
    apply = args.apply
    algo = args.hash_algo
    by_size = {}
    for f in safe_iter_files(root, recursive=recursive):
        try:
            by_size.setdefault(f.stat().st_size, []).append(f)
        except Exception:
            continue
    groups = []
    for size, files in by_size.items():
        if len(files) < 2:
            continue
        hashes = {}
        for f in files:
            try:
                h = file_hash(f, algo=algo)
                hashes.setdefault(h, []).append(f)
            except Exception:
                continue
        for h, fs in hashes.items():
            if len(fs) > 1:
                groups.append((size, h, fs))
    for size, h, fs in groups:
        keep = fs[0]
        log_action(Action(op="dupe_group", src=str(keep.resolve()), meta={"size_bytes": size, "hash_algo": algo, "hash": h, "count": len(fs)}))
        for f in fs[1:]:
            if args.delete:
                if apply:
                    try:
                        f.unlink()
                        log_action(Action(op="delete_dupe", src=str(f.resolve()), meta={"kept": str(keep.resolve())}))
                    except Exception as e:
                        log_action(Action(op="delete_dupe_failed", src=str(f.resolve()), meta={"kept": str(keep.resolve()), "error": str(e)}))
                else:
                    log_action(Action(op="delete_dupe", src=str(f.resolve()), meta={"kept": str(keep.resolve()), "dry_run": True}))
            elif args.archive:
                archive_dir = Path(args.archive).expanduser().resolve()
                act = move_file(f, archive_dir, apply=apply)
                log_action(Action(op="archive_dupe", src=act.src, dst=act.dst, meta={"kept": str(keep.resolve())}))
            else:
                log_action(Action(op="dupe", src=str(f.resolve()), meta={"kept": str(keep.resolve())}))

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="fileman", description="File management utility (safe by default; dry-run unless --apply).")
    p.add_argument("--apply", action="store_true", help="perform actions (default is dry-run)")
    sub = p.add_subparsers(dest="cmd", required=True)

    o = sub.add_parser("organize", help="organize files into folders")
    o.add_argument("path", help="file or directory")
    o.add_argument("--by", choices=["ext", "date", "month"], default="ext")
    o.add_argument("--dest", help="destination base directory (default: same as path)")
    o.add_argument("--no-recursive", action="store_true")
    o.set_defaults(func=cmd_organize)

    r = sub.add_parser("rename", help="bulk rename files")
    r.add_argument("path", help="directory or file")
    r.add_argument("--pattern", help="regex pattern applied to stem")
    r.add_argument("--replace", help="replacement for regex matches")
    r.add_argument("--prefix", help="prefix to add")
    r.add_argument("--suffix", help="suffix to add")
    r.add_argument("--lower", action="store_true")
    r.add_argument("--upper", action="store_true")
    r.add_argument("--sanitize", action="store_true")
    r.add_argument("--enumerate", action="store_true")
    r.add_argument("--start", type=int, default=1)
    r.add_argument("--step", type=int, default=1)
    r.add_argument("--width", type=int, default=3)
    r.add_argument("--ext", help="only rename files with this extension (e.g. png)")
    r.add_argument("--no-recursive", action="store_true")
    r.set_defaults(func=cmd_rename)

    c = sub.add_parser("clean", help="archive or delete files by rules")
    c.add_argument("path", help="directory or file")
    c.add_argument("--older-than-days", type=int)
    c.add_argument("--larger-than-mb", type=int)
    c.add_argument("--archive", help="archive directory (default: <path>/_archive)")
    c.add_argument("--delete", action="store_true", help="delete instead of archiving")
    c.add_argument("--no-recursive", action="store_true")
    c.set_defaults(func=cmd_clean)

    i = sub.add_parser("index", help="index files to json/csv")
    i.add_argument("path", help="directory or file")
    i.add_argument("--format", choices=["json", "csv"], default="json")
    i.add_argument("--out", help="output path (default: stdout)")
    i.add_argument("--hash", action="store_true")
    i.add_argument("--hash-algo", default="sha256")
    i.add_argument("--no-recursive", action="store_true")
    i.set_defaults(func=cmd_index)

    d = sub.add_parser("dupes", help="find duplicates (size+hash)")
    d.add_argument("path", help="directory or file")
    d.add_argument("--hash-algo", default="sha256")
    d.add_argument("--archive", help="archive duplicates (keeps first copy in-place)")
    d.add_argument("--delete", action="store_true", help="delete duplicates (keeps first copy)")
    d.add_argument("--no-recursive", action="store_true")
    d.set_defaults(func=cmd_dupes)

    return p

def main(argv=None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        args.func(args)
        return 0
    except KeyboardInterrupt:
        return 130

if __name__ == "__main__":
    raise SystemExit(main())
