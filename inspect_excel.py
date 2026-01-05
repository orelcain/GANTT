from __future__ import annotations

from pathlib import Path

from openpyxl import load_workbook


def main() -> None:
    path = Path(r"c:/Users/pc hp/OneDrive/ANTARFOOD/GANTT/GANTT Mantencion temporada baja.xlsm")
    wb = load_workbook(path, data_only=False, keep_vba=True)
    print("Sheets:", wb.sheetnames)

    # Focus on the helper table because it's the cleanest source of task records.
    if "Gantt_Helper" in wb.sheetnames:
        ws = wb["Gantt_Helper"]
        header_row = 1
        headers = [ws.cell(header_row, c).value for c in range(1, 26)]
        print("\n=== Gantt_Helper (key sheet) ===")
        for i, h in enumerate(headers, start=1):
            if h not in (None, ""):
                print(f"C{i:02d}: {h}")

        # Guess some useful columns by name fragments.
        def col_idx(fragment: str) -> int | None:
            fragment_l = fragment.lower()
            for i, h in enumerate(headers, start=1):
                if isinstance(h, str) and fragment_l in h.lower():
                    return i
            return None

        cols = {
            "project": col_idx("project"),
            "phase": col_idx("phase"),
            "task": col_idx("task"),
            "assignee": col_idx("assignee"),
            "team": col_idx("team"),
            "status": col_idx("status"),
            "completion": col_idx("completion"),
            "start": col_idx("start date"),
            "due": col_idx("due date"),
        }
        print("\nDetected columns:")
        for k, v in cols.items():
            print(f"- {k}: {v}")

        # Print a sample of task records (rows where 'Task Helper' looks non-empty)
        task_col = cols.get("task")
        if task_col is None:
            print("\nNo task column detected; cannot sample records.")
            return

        rows = []
        for r in range(2, min(ws.max_row, 2000) + 1):
            task_val = ws.cell(r, task_col).value
            if task_val in (None, ""):
                continue
            rows.append(r)

        print(f"\nTask-like rows found (up to 2000): {len(rows)}")
        print("Sample records (first 10):")
        for r in rows[:10]:
            def get(col_name: str):
                c = cols.get(col_name)
                return ws.cell(r, c).value if c else None

            print(
                {
                    "row": r,
                    "project": get("project"),
                    "phase": get("phase"),
                    "task": get("task"),
                    "assignee": get("assignee"),
                    "team": get("team"),
                    "status": get("status"),
                    "completion": get("completion"),
                    "start": get("start"),
                    "due": get("due"),
                }
            )
    else:
        # Fallback: list sheet names only.
        print("\nNo 'Gantt_Helper' sheet found; available sheets:")
        for s in wb.sheetnames:
            print("-", s)


if __name__ == "__main__":
    main()
