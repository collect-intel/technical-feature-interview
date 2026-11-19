"""Python entry point for the analysis contract (see README.md).

Usage: python3 -m analysis <method> <id>
Implement a method here and point analysis/commands.json at
["python3", "-m", "analysis", "<method>"].
"""

import os
import sqlite3
import sys


def main() -> int:
    if len(sys.argv) < 3:
        print("usage: python3 -m analysis <method> <id>", file=sys.stderr)
        return 2
    method, ident = sys.argv[1], sys.argv[2]
    db = sqlite3.connect(os.environ.get("DB_PATH", "data/app.db"))
    print(f"analysis method '{method}' is not implemented in Python yet (id {ident})", file=sys.stderr)
    db.close()
    return 1


if __name__ == "__main__":
    sys.exit(main())
