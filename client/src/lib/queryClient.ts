import { QueryClient } from "@tanstack/react-query";

declare global {
  interface Window {
    electronAPI?: {
      students: {
        getAll: () => Promise<any[]>;
        search: (query: string, type: string) => Promise<any[]>;
        getById: (id: number) => Promise<any>;
        create: (studentData: any) => Promise<any>;
        update: (id: number, studentData: any) => Promise<any>;
        delete: (id: number) => Promise<boolean>;
        bulkCreate: (studentsData: any[], groupName: string) => Promise<any[]>;
      };
      groups: {
        getAll: () => Promise<any[]>;
        create: (groupData: any) => Promise<any>;
        delete: (id: number) => Promise<boolean>;
      };
      transferRequests: {
        create: (requestData: any) => Promise<any>;
        getByStudentId: (studentId: number) => Promise<any[]>;
      };
    };
  }
}

const isElectron = !!(window.electronAPI);

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  if (isElectron && window.electronAPI) {
    const parts = url.split('/').filter(Boolean);

    if (parts[0] === 'api' && parts[1] === 'students') {
      if (parts.length === 2) {
        if (method === 'GET') return window.electronAPI.students.getAll();
        if (method === 'POST') return window.electronAPI.students.create(data);
      }
      if (parts[2] === 'search' && method === 'GET') {
        const urlObj = new URL(url, 'http://localhost');
        const query = urlObj.searchParams.get('q') || '';
        const type = urlObj.searchParams.get('type') || 'nationalId';
        return window.electronAPI.students.search(query, type);
      }
      if (parts[2] === 'import' && method === 'POST') {
        const { students, groupName } = data as any;
        return { students: await window.electronAPI.students.bulkCreate(students, groupName) };
      }
      if (parts.length === 3 && !isNaN(Number(parts[2]))) {
        const id = Number(parts[2]);
        if (method === 'GET') return window.electronAPI.students.getById(id);
        if (method === 'PATCH') return window.electronAPI.students.update(id, data);
        if (method === 'DELETE') {
          await window.electronAPI.students.delete(id);
          return { success: true };
        }
      }
      if (parts.length === 4 && parts[3] === 'transfer-requests' && method === 'GET') {
        const id = Number(parts[2]);
        return window.electronAPI.transferRequests.getByStudentId(id);
      }
    }

    if (parts[0] === 'api' && parts[1] === 'groups') {
      if (parts.length === 2) {
        if (method === 'GET') return window.electronAPI.groups.getAll();
        if (method === 'POST') return window.electronAPI.groups.create(data);
      }
      if (parts.length === 3 && method === 'DELETE') {
        const id = Number(parts[2]);
        await window.electronAPI.groups.delete(id);
        return { success: true };
      }
    }

    if (parts[0] === 'api' && parts[1] === 'transfer-requests' && method === 'POST') {
      return window.electronAPI.transferRequests.create(data);
    }
  }

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res.json();
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const url = queryKey.join("/") as string;
        return apiRequest("GET", url);
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
