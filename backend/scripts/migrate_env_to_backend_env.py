#!/usr/bin/env python3
"""Write selected environment variables into `backend/.env` from the current
process environment. This script does NOT print secret values; it only reports
which variables were populated.

Run in Codespace or locally where env vars are set:
  python3 backend/scripts/migrate_env_to_backend_env.py

It will create (or overwrite) `backend/.env` and set file permissions to 600.
"""
import os
from pathlib import Path

TARGET = Path(__file__).resolve().parent.parent / 'backend' / '.env'
VARS = [
    'MONGO_URI', 'PG_HOST', 'PG_PORT', 'PG_DATABASE', 'PG_USER', 'PG_PASSWORD',
    'JWT_SECRET', 'CLIENT_ORIGIN', 'HOODPAY_API_KEY',
    'SUPABASE_HOST_DOMAIN', 'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_STORAGE_URL', 'SUPABASE_S3_ACCESS_KEY', 'SUPABASE_S3_SECRET',
    'BUCKET', 'IMAGE_ROOT'
]


def main():
    found = []
    missing = []
    lines = []
    for v in VARS:
        val = os.environ.get(v)
        if val is None:
            missing.append(v)
            # write blank placeholder
            lines.append(f"{v}=\n")
        else:
            found.append(v)
            # write value as-is (keeps secrets in workspace only)
            lines.append(f"{v}={val}\n")

    # ensure backend dir exists
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    with open(TARGET, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    try:
        TARGET.chmod(0o600)
    except Exception:
        pass

    print('Wrote backend/.env with the following vars present:')
    for v in found:
        print('  -', v)
    if missing:
        print('\nThe following vars were missing from the environment and written as blank placeholders:')
        for v in missing:
            print('  -', v)
    print('\nNote: .env is now created in `backend/.env`. It is added to .gitignore so it will not be committed.')


if __name__ == '__main__':
    main()
