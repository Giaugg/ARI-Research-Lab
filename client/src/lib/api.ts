const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface User {
  user_id: number;
  name: string;
  email: string;
  institution: string;
  bio: string;
  research_fields: string[];
  avatar_url: string;
  created_at?: string;
  following_count?: number;
  followers_count?: number;
  groups_count?: number;
  publications_count?: number;
  is_following?: boolean;
}

export interface Post {
  post_id: number;
  author_id: number;
  group_id?: number | null;
  post_type: 'discussion' | 'question' | 'research' | 'paper_share';
  title: string;
  content: string;
  created_at: string;
  author_name: string;
  author_institution: string;
  author_avatar: string;
  group_name?: string | null;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  tags: string[];
}

export interface CommentItem {
  comment_id: number;
  post_id: number;
  parent_id: number | null;
  content: string;
  depth: number;
  created_at: string;
  sort_path: number[];
  author_id: number;
  author_name: string;
  author_avatar: string;
  author_institution: string;
  direct_replies_count?: number;
}

export interface ResearchGroup {
  group_id: number;
  name: string;
  topic: string;
  description: string;
  avatar_url: string;
  created_at: string;
  owner_name: string;
  owner_institution: string;
  members_count: number;
  posts_count: number;
  is_member: boolean;
  user_role?: 'owner' | 'admin' | 'member' | null;
}

export interface Publication {
  publication_id: number;
  title: string;
  doi: string;
  venue: string;
  abstract: string;
  published_at: string;
  authors: {
    user_id: number;
    name: string;
    institution: string;
    avatar_url: string;
    author_order: number;
  }[];
}

// Global active user state storage in localStorage if in browser
export const getActiveUserId = (): number => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('ari_active_user_id');
    if (stored) return parseInt(stored, 10);
  }
  return 1; // Default to Prof. Stonebraker
};

export const setActiveUserId = (userId: number) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ari_active_user_id', userId.toString());
    window.dispatchEvent(new Event('ari_user_changed'));
  }
};

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-user-id': getActiveUserId().toString()
});

export const api = {
  // Auth & Profile
  getMe: async (): Promise<{ user: User }> => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    return res.json();
  },

  // Users
  getUsers: async (search?: string): Promise<{ users: User[] }> => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE}/users${q}`, { headers: getHeaders() });
    return res.json();
  },

  getUserById: async (id: number | string) => {
    const res = await fetch(`${API_BASE}/users/${id}`, { headers: getHeaders() });
    return res.json();
  },

  toggleFollow: async (targetId: number | string) => {
    const res = await fetch(`${API_BASE}/users/${targetId}/follow`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  getMutualConnections: async (userId: number | string, targetId: number | string) => {
    const res = await fetch(`${API_BASE}/users/${userId}/mutual/${targetId}`, { headers: getHeaders() });
    return res.json();
  },

  // Posts
  getPosts: async (params?: { 
    group_id?: number | string; 
    tag?: string; 
    post_type?: string; 
    search?: string; 
    use_fts?: boolean; 
    pagination_type?: 'offset' | 'keyset';
    page?: number;
    limit?: number;
    last_created_at?: string;
    last_post_id?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.group_id) queryParams.append('group_id', params.group_id.toString());
    if (params?.tag) queryParams.append('tag', params.tag);
    if (params?.post_type) queryParams.append('post_type', params.post_type);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.use_fts) queryParams.append('use_fts', 'true');
    if (params?.pagination_type) queryParams.append('pagination_type', params.pagination_type);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.last_created_at) queryParams.append('last_created_at', params.last_created_at);
    if (params?.last_post_id) queryParams.append('last_post_id', params.last_post_id.toString());

    const res = await fetch(`${API_BASE}/posts?${queryParams.toString()}`, { headers: getHeaders() });
    return res.json();
  },

  getPostById: async (id: number | string) => {
    const res = await fetch(`${API_BASE}/posts/${id}`, { headers: getHeaders() });
    return res.json();
  },

  createPost: async (postData: { title: string; content: string; post_type: string; group_id?: number | null; tags?: string[] }) => {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(postData)
    });
    return res.json();
  },

  toggleLikePost: async (postId: number | string) => {
    const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  getTags: async () => {
    const res = await fetch(`${API_BASE}/posts/tags`, { headers: getHeaders() });
    return res.json();
  },

  // Hierarchical Comments (Problem 3)
  getComments: async (postId: number | string): Promise<{ comments: CommentItem[]; executionMs: number; totalComments: number }> => {
    const res = await fetch(`${API_BASE}/comments/post/${postId}`, { headers: getHeaders() });
    return res.json();
  },

  createComment: async (postId: number | string, content: string, parent_id?: number | null) => {
    const res = await fetch(`${API_BASE}/comments/post/${postId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content, parent_id })
    });
    return res.json();
  },

  deleteComment: async (commentId: number | string) => {
    const res = await fetch(`${API_BASE}/comments/${commentId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  // Research Groups
  getGroups: async (topic?: string): Promise<{ groups: ResearchGroup[] }> => {
    const q = topic ? `?topic=${encodeURIComponent(topic)}` : '';
    const res = await fetch(`${API_BASE}/groups${q}`, { headers: getHeaders() });
    return res.json();
  },

  getGroupById: async (id: number | string) => {
    const res = await fetch(`${API_BASE}/groups/${id}`, { headers: getHeaders() });
    return res.json();
  },

  createGroup: async (groupData: { name: string; topic: string; description?: string }) => {
    const res = await fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(groupData)
    });
    return res.json();
  },

  toggleJoinGroup: async (groupId: number | string) => {
    const res = await fetch(`${API_BASE}/groups/${groupId}/join`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  // Publications
  getPublications: async (search?: string): Promise<{ publications: Publication[] }> => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE}/publications${q}`, { headers: getHeaders() });
    return res.json();
  },

  getCoauthorshipGraph: async () => {
    const res = await fetch(`${API_BASE}/publications/coauthorship`, { headers: getHeaders() });
    return res.json();
  },

  // Graph & Recursive SQL Traversal (Problems 1, 2, 4, 5)
  getNetworkGraph: async () => {
    const res = await fetch(`${API_BASE}/network/graph`, { headers: getHeaders() });
    return res.json();
  },

  getReachability: async (userId: number | string, maxDepth: number = 3) => {
    const res = await fetch(`${API_BASE}/network/reachability/${userId}?maxDepth=${maxDepth}`, { headers: getHeaders() });
    return res.json();
  },

  findPath: async (sourceId: number | string, targetId: number | string, maxDepth: number = 5) => {
    const res = await fetch(`${API_BASE}/network/path?sourceId=${sourceId}&targetId=${targetId}&maxDepth=${maxDepth}`, { headers: getHeaders() });
    return res.json();
  },

  getRecommendations: async (userId: number | string) => {
    const res = await fetch(`${API_BASE}/network/recommendations/${userId}`, { headers: getHeaders() });
    return res.json();
  },

  detectCycles: async (userId: number | string, maxDepth: number = 4) => {
    const res = await fetch(`${API_BASE}/network/cycles/${userId}?maxDepth=${maxDepth}`, { headers: getHeaders() });
    return res.json();
  },

  getCommunities: async () => {
    const res = await fetch(`${API_BASE}/network/communities`, { headers: getHeaders() });
    return res.json();
  },

  // Lab & PostgreSQL Performance Engine
  runExplain: async (queryType: string, params: any = {}) => {
    const res = await fetch(`${API_BASE}/lab/explain`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ queryType, params })
    });
    return res.json();
  },

  benchmarkIndexes: async (target: string = 'network') => {
    const res = await fetch(`${API_BASE}/lab/benchmark/indexes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ target })
    });
    return res.json();
  },

  benchmarkPagination: async () => {
    const res = await fetch(`${API_BASE}/lab/benchmark/pagination`, { headers: getHeaders() });
    return res.json();
  },

  benchmarkSearch: async (term: string) => {
    const res = await fetch(`${API_BASE}/lab/benchmark/search?term=${encodeURIComponent(term)}`, { headers: getHeaders() });
    return res.json();
  },

  scaleData: async (count: number = 100) => {
    const res = await fetch(`${API_BASE}/lab/scale`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ count })
    });
    return res.json();
  }
};
