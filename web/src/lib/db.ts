import Dexie, { type Table } from "dexie";

import type { Task } from "./types";

export type MetaRecord = {
  key: string;
  value: string;
};

export class GanttDb extends Dexie {
  tasks!: Table<Task, string>;
  meta!: Table<MetaRecord, string>;

  constructor() {
    super("antarfood-gantt");
    this.version(1).stores({
      tasks: "id, start, end, assignee, status",
      meta: "key",
    });
  }
}

export const db = new GanttDb();
