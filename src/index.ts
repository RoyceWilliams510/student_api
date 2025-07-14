import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { promises as fs } from 'fs';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, '..');

type Entity = 'students' | 'teachers' | 'subjects' | 'classes' | 'enrollments';

function getFilePath(entity: Entity) {
  return path.join(DATA_DIR, `${entity}.json`);
}

async function readData(entity: Entity): Promise<any[]> {
  const file = getFilePath(entity);
  const data = await fs.readFile(file, 'utf-8');
  return JSON.parse(data) as any[];
}

async function writeData<T>(entity: Entity, data: T[]): Promise<void> {
  const file = getFilePath(entity);
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

function getNextId(items: any[]): number {
  return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
}

function registerCrudRoutes(entity: Entity) {
  const route = `/${entity}`;

  // List all
  app.get(route, async (_req: Request, res: Response) => {
    try {
      const data = await readData(entity);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: 'Failed to read data' });
    }
  });

  // Get by id
  app.get(`${route}/:id`, async (req: Request, res: Response) => {
    try {
      const data = await readData(entity);
      const item = data.find((i: any) => i.id === Number(req.params.id));
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    } catch (e) {
      res.status(500).json({ error: 'Failed to read data' });
    }
  });

  // Create
  app.post(route, async (req: Request, res: Response) => {
    try {
      const data = await readData(entity);
      console.log(entity);
      console.log(req.body);
      const newItem = { ...(req.body as object), id: getNextId(data) };
      data.push(newItem);
      await writeData(entity, data);
      res.status(201).json(newItem);
    } catch (e) {
      res.status(500).json({ error: 'Failed to create item' });
    }
  });

  // Update
  app.put(`${route}/:id`, async (req: Request, res: Response) => {
    try {
      const data = await readData(entity);
      const idx = data.findIndex((i: any) => i.id === Number(req.params.id));
      if (idx === -1) return res.status(404).json({ error: 'Not found' });
      data[idx] = { ...data[idx], ...req.body, id: data[idx].id };
      await writeData(entity, data);
      res.json(data[idx]);
    } catch (e) {
      res.status(500).json({ error: 'Failed to update item' });
    }
  });

  // Delete
  app.delete(`${route}/:id`, async (req: Request, res: Response) => {
    try {
      let data = await readData(entity);
      const idx = data.findIndex((i: any) => i.id === Number(req.params.id));
      if (idx === -1) return res.status(404).json({ error: 'Not found' });
      const [deleted] = data.splice(idx, 1);
      await writeData(entity, data);
      res.json(deleted);
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });
}

['students', 'teachers', 'subjects', 'classes', 'enrollments'].forEach(entity => {
  registerCrudRoutes(entity as Entity);
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Fake School API server running at http://localhost:${PORT}`);
}); 