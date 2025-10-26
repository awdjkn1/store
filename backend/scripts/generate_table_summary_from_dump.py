#!/usr/bin/env python3
"""Generate a human-readable per-table summary from a pg_dump schema file.

Reads `/workspaces/store/backend/scripts/existing_db_schema.sql` and writes
`existing_db_tables_summary.txt` with table name and columns (name + type + extras).
"""
import re
from pathlib import Path

DUMP = Path(__file__).resolve().parents[0] / "existing_db_schema.sql"
OUT = Path(__file__).resolve().parents[0] / "existing_db_tables_summary.txt"

create_re = re.compile(r"^CREATE\s+TABLE(?:\s+ONLY)?\s+public\.\"?(?P<table>[^\"\s(]+)\"?\s*\(", re.I)
col_re = re.compile(r"^\s+\"?(?P<col>[^\"\s(]+)\"?\s+(?P<type>[^,]+),?\s*(?:--.*)?$")

def parse_dump(path: Path):
    tables = {}
    cur_table = None
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            m = create_re.match(line)
            if m:
                cur_table = m.group('table')
                tables[cur_table] = []
                continue
            if cur_table:
                if line.strip().startswith(')'):
                    cur_table = None
                    continue
                mc = col_re.match(line)
                if mc:
                    col = mc.group('col')
                    typ = mc.group('type').strip()
                    tables[cur_table].append((col, typ))
    return tables

def write_summary(tables, out: Path):
    with out.open('w', encoding='utf-8') as f:
        f.write('Database schema summary\n')
        f.write('=======================\n\n')
        for t, cols in sorted(tables.items()):
            f.write(f'TABLE: {t}\n')
            if not cols:
                f.write('  (no parsed columns)\n\n')
                continue
            for col, typ in cols:
                f.write(f'  - {col} : {typ}\n')
            f.write('\n')

def main():
    if not DUMP.exists():
        print(f'Dump file not found: {DUMP}')
        return 1
    tables = parse_dump(DUMP)
    write_summary(tables, OUT)
    print(f'Wrote summary to: {OUT}')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
