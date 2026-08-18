// Client-side mock backend persistence using localStorage

const STORAGE_KEYS = {
  ITEMS: 'lf_mock_items',
  CLAIMS: 'lf_mock_claims',
  MESSAGES: 'lf_mock_messages',
  STUDENTS: 'lf_mock_students',
};

const INITIAL_STUDENTS = [
  { id: 'st_1', registration_number: 'REG001', name: 'Aarav Sharma', email: 'aarav.s@school.edu', class: '10', section: 'A' },
  { id: 'st_2', registration_number: 'REG002', name: 'Ananya Patel', email: 'ananya.p@school.edu', class: '9', section: 'B' },
  { id: 'st_3', registration_number: 'REG003', name: 'Rohan Verma', email: 'rohan.v@school.edu', class: '11', section: 'C' },
  { id: 'st_4', registration_number: 'REG004', name: 'Priya Singh', email: 'priya.s@school.edu', class: '8', section: 'A' },
  { id: 'st_5', registration_number: 'REG005', name: 'Kabir Mehta', email: 'kabir.m@school.edu', class: '12', section: 'A' },
];

const INITIAL_ITEMS = [
  {
    _id: 'item_101',
    category: 'Electronics',
    brand: 'Apple',
    color: 'Space Gray',
    size: '14-inch',
    location_found: 'Library Study Room 3',
    date_found: '2026-08-15T00:00:00.000Z',
    time_found: '14:30',
    description: 'Found on the corner desk near the window. Has a sticker of ReactJS on the lid lid.',
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
    status: 'PUBLISHED',
    registration_number: 'REG001',
    student_name: 'Aarav Sharma',
    uploaded_at: '2026-08-15T14:35:00.000Z',
  },
  {
    _id: 'item_102',
    category: 'Clothing',
    brand: "Levi's",
    color: 'Blue',
    size: 'Medium',
    location_found: 'Sports Pavilion Bench',
    date_found: '2026-08-16T00:00:00.000Z',
    time_found: '16:00',
    description: 'Dark wash denim jacket with brass buttons. Left pocket has a black fountain pen.',
    image_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
    status: 'PUBLISHED',
    registration_number: 'REG002',
    student_name: 'Ananya Patel',
    uploaded_at: '2026-08-16T16:10:00.000Z',
  },
  {
    _id: 'item_103',
    category: 'ID / Cards',
    brand: 'School Board',
    color: 'Navy Blue',
    size: 'Standard',
    location_found: 'Main Cafeteria Counter',
    date_found: '2026-08-17T00:00:00.000Z',
    time_found: '12:45',
    description: 'Student ID card found inside a transparent blue lanyard holder.',
    image_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
    status: 'PUBLISHED',
    registration_number: 'REG003',
    student_name: 'Rohan Verma',
    uploaded_at: '2026-08-17T12:50:00.000Z',
  },
  {
    _id: 'item_104',
    category: 'Accessories',
    brand: 'Fossil',
    color: 'Black',
    size: 'One Size',
    location_found: 'Basketball Court',
    date_found: '2026-08-14T00:00:00.000Z',
    time_found: '17:15',
    description: 'Black silicone strap smart watch with minor scratch on top right glass.',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
    status: 'PUBLISHED',
    registration_number: 'REG004',
    student_name: 'Priya Singh',
    uploaded_at: '2026-08-14T17:20:00.000Z',
  },
  {
    _id: 'item_105',
    category: 'Bags',
    brand: 'Nike',
    color: 'Black/Red',
    size: 'Large',
    location_found: 'Auditorium Row 4',
    date_found: '2026-08-18T00:00:00.000Z',
    time_found: '09:10',
    description: 'Black backpack with red Nike swoosh. Contains a geometry box and spiral notebook.',
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
    status: 'PENDING',
    registration_number: 'REG005',
    student_name: 'Kabir Mehta',
    uploaded_at: '2026-08-18T09:15:00.000Z',
  },
];

const INITIAL_CLAIMS = [
  {
    _id: 'req_201',
    item_id: 'item_101',
    student_id: 'st_1',
    student_name: 'Aarav Sharma',
    registration_number: 'REG001',
    proof_description: 'I lost my MacBook Pro M2 in the library yesterday afternoon. It has a ReactJS sticker on top.',
    security_question_answer: 'Serial number ends in 8892 and wallpaper is an abstract mountain dusk image.',
    status: 'PENDING',
    createdAt: '2026-08-16T10:00:00.000Z',
  },
];

const INITIAL_MESSAGES = [
  {
    _id: 'msg_301',
    request_id: 'req_201',
    sender_id: 'st_1',
    sender_role: 'student',
    sender_name: 'Aarav Sharma',
    message: 'Hello Admin, I have submitted a claim for the MacBook Pro. Can we schedule verification?',
    createdAt: '2026-08-16T10:05:00.000Z',
  },
  {
    _id: 'msg_302',
    request_id: 'req_201',
    sender_id: 'admin',
    sender_role: 'admin',
    sender_name: 'Admin',
    message: 'Hi Aarav! Please specify the exact wallpaper color scheme and any unique scratches on the chassis.',
    createdAt: '2026-08-16T10:12:00.000Z',
  },
];

// Helper functions for localStorage initialization
function getStoredData(key, initialValue) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initialValue));
      return initialValue;
    }
    return JSON.parse(raw);
  } catch (err) {
    return initialValue;
  }
}

function setStoredData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Global Event Emitter for live mock chat updates
export function broadcastMockMessage(requestId, messageObj) {
  window.dispatchEvent(new CustomEvent('mock_chat_message', {
    detail: { requestId, messageObj }
  }));
}

export function initMockStorage() {
  getStoredData(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  getStoredData(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
  getStoredData(STORAGE_KEYS.CLAIMS, INITIAL_CLAIMS);
  getStoredData(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
}

// Run init immediately
initMockStorage();

// ─── CLIENT-SIDE MOCK HANDLERS ───────────────────────────────────────────────

export async function handleMockApi(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const urlParts = endpoint.split('?');
  const path = urlParts[0];
  const queryString = urlParts[1] || '';
  const query = new URLSearchParams(queryString);

  let body = {};
  if (options.body) {
    if (typeof options.body === 'string') {
      try { body = JSON.parse(options.body); } catch { body = {}; }
    } else if (options.body instanceof FormData) {
      body = {};
      for (const [key, value] of options.body.entries()) {
        body[key] = value;
      }
    } else {
      body = options.body;
    }
  }

  // Simulate network delay
  await new Promise((r) => setTimeout(r, 150));

  // 1. AUTH ROUTES
  if (path === '/auth/verify' && method === 'POST') {
    const { registration_number, name } = body;
    if (!registration_number || !name) {
      throw { status: 400, message: 'Registration number and name are required.' };
    }
    const students = getStoredData(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const found = students.find(
      (s) => s.registration_number.toUpperCase() === registration_number.trim().toUpperCase()
    );

    if (!found) {
      throw { status: 404, message: 'Student not found. Use REG001 - Aarav Sharma.' };
    }
    if (found.name.toLowerCase() !== name.trim().toLowerCase()) {
      throw { status: 401, message: 'Name does not match our records.' };
    }

    const token = `mock_token_student_${found.id}`;
    return {
      token,
      student: {
        id: found.id,
        registration_number: found.registration_number,
        name: found.name,
        email: found.email,
        class: found.class,
        section: found.section,
        role: 'student',
      },
    };
  }

  if (path === '/auth/admin-login' && method === 'POST') {
    const { username, password } = body;
    if (username === 'admin' && password === 'admin123') {
      const token = 'mock_token_admin_super';
      return { token, username: 'admin', role: 'admin' };
    }
    throw { status: 401, message: 'Invalid admin credentials. (Use admin / admin123)' };
  }

  if (path === '/auth/me') {
    const token = localStorage.getItem('lf_token');
    const user = JSON.parse(localStorage.getItem('lf_user') || 'null');
    if (token && user) {
      return { valid: true, user };
    }
    throw { status: 401, message: 'Invalid session' };
  }

  // 2. ITEMS ROUTES
  if (path === '/items' && method === 'GET') {
    const items = getStoredData(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
    let filtered = items.filter((i) => i.status === 'PUBLISHED');

    const category = query.get('category');
    const location_found = query.get('location_found');
    const color = query.get('color');
    const brand = query.get('brand');
    const q = query.get('q');

    if (category) filtered = filtered.filter((i) => i.category === category);
    if (location_found) filtered = filtered.filter((i) => i.location_found === location_found);
    if (color) filtered = filtered.filter((i) => i.color.toLowerCase().includes(color.toLowerCase()));
    if (brand) filtered = filtered.filter((i) => i.brand.toLowerCase().includes(brand.toLowerCase()));
    if (q) {
      const lq = q.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.category.toLowerCase().includes(lq) ||
          i.brand.toLowerCase().includes(lq) ||
          i.color.toLowerCase().includes(lq) ||
          i.description.toLowerCase().includes(lq) ||
          i.location_found.toLowerCase().includes(lq)
      );
    }

    return { items: filtered };
  }

  if (path === '/items/admin/all' && method === 'GET') {
    const items = getStoredData(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
    const status = query.get('status');
    let resItems = items;
    if (status) {
      resItems = items.filter((i) => i.status === status);
    }
    return { items: resItems };
  }

  if (path.startsWith('/items/') && method === 'GET') {
    const id = path.replace('/items/', '');
    const items = getStoredData(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
    const found = items.find((i) => i._id === id);
    if (!found) throw { status: 404, message: 'Item not found.' };
    return { item: found };
  }

  if (path === '/items' && method === 'POST') {
    const user = JSON.parse(localStorage.getItem('lf_user') || '{}');
    const items = getStoredData(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);

    let imageUrl = 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=80';

    if (body.image && body.image instanceof File) {
      imageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(body.image);
      });
    }

    const newItem = {
      _id: `item_${Date.now()}`,
      category: body.category || 'Other',
      brand: body.brand || '',
      color: body.color || '',
      size: body.size || '',
      location_found: body.location_found || '',
      date_found: body.date_found ? new Date(body.date_found).toISOString() : new Date().toISOString(),
      time_found: body.time_found || '',
      description: body.description || '',
      image_url: imageUrl,
      status: 'PENDING',
      submitted_by: user.id || 'st_1',
      registration_number: user.registration_number || 'REG001',
      student_name: user.name || 'Student',
      uploaded_at: new Date().toISOString(),
    };

    items.unshift(newItem);
    setStoredData(STORAGE_KEYS.ITEMS, items);
    return { message: 'Item submitted successfully.', item: newItem };
  }

  if (path.match(/\/items\/admin\/[^/]+\/status/) && method === 'PATCH') {
    const parts = path.split('/');
    const id = parts[3];
    const { status } = body;

    const items = getStoredData(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
    const idx = items.findIndex((i) => i._id === id);
    if (idx === -1) throw { status: 404, message: 'Item not found.' };

    items[idx].status = status;
    setStoredData(STORAGE_KEYS.ITEMS, items);
    return { message: 'Status updated.', item: items[idx] };
  }

  if (path.match(/\/items\/admin\/[^/]+$/) && method === 'DELETE') {
    const parts = path.split('/');
    const id = parts[3];
    let items = getStoredData(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
    items = items.filter((i) => i._id !== id);
    setStoredData(STORAGE_KEYS.ITEMS, items);
    return { message: 'Item deleted successfully.' };
  }

  // 3. CLAIMS ROUTES
  if (path === '/claims' && method === 'POST') {
    const user = JSON.parse(localStorage.getItem('lf_user') || '{}');
    const claims = getStoredData(STORAGE_KEYS.CLAIMS, INITIAL_CLAIMS);

    const newClaim = {
      _id: `req_${Date.now()}`,
      item_id: body.item_id,
      student_id: user.id || 'st_1',
      student_name: user.name || 'Student',
      registration_number: user.registration_number || 'REG001',
      proof_description: body.proof_description,
      security_question_answer: body.security_question_answer,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    claims.unshift(newClaim);
    setStoredData(STORAGE_KEYS.CLAIMS, claims);
    return { message: 'Claim submitted successfully.', claim: newClaim };
  }

  if (path === '/claims/admin/all' && method === 'GET') {
    const claims = getStoredData(STORAGE_KEYS.CLAIMS, INITIAL_CLAIMS);
    const items = getStoredData(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
    const status = query.get('status');

    let resClaims = claims;
    if (status) resClaims = claims.filter((c) => c.status === status);

    const populated = resClaims.map((c) => ({
      ...c,
      item_id: items.find((i) => i._id === (c.item_id?._id || c.item_id)) || c.item_id,
    }));

    return { claims: populated };
  }

  if (path.match(/\/claims\/admin\/[^/]+$/) && method === 'GET') {
    const id = path.replace('/claims/admin/', '');
    const claims = getStoredData(STORAGE_KEYS.CLAIMS, INITIAL_CLAIMS);
    const items = getStoredData(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
    const claim = claims.find((c) => c._id === id);
    if (!claim) throw { status: 404, message: 'Claim not found.' };

    const item = items.find((i) => i._id === (claim.item_id?._id || claim.item_id)) || claim.item_id;
    return { claim: { ...claim, item_id: item } };
  }

  if (path.match(/\/claims\/[^/]+$/) && method === 'GET') {
    const id = path.replace('/claims/', '');
    const claims = getStoredData(STORAGE_KEYS.CLAIMS, INITIAL_CLAIMS);
    const items = getStoredData(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
    const claim = claims.find((c) => c._id === id);
    if (!claim) throw { status: 404, message: 'Claim not found.' };

    const item = items.find((i) => i._id === (claim.item_id?._id || claim.item_id)) || claim.item_id;
    return { claim: { ...claim, item_id: item } };
  }

  if (path.match(/\/claims\/admin\/[^/]+\/status/) && method === 'PATCH') {
    const parts = path.split('/');
    const id = parts[3];
    const { status } = body;

    const claims = getStoredData(STORAGE_KEYS.CLAIMS, INITIAL_CLAIMS);
    const idx = claims.findIndex((c) => c._id === id);
    if (idx === -1) throw { status: 404, message: 'Claim not found.' };

    claims[idx].status = status;
    setStoredData(STORAGE_KEYS.CLAIMS, claims);

    if (status === 'APPROVED') {
      const items = getStoredData(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
      const itemIdx = items.findIndex((i) => i._id === (claims[idx].item_id?._id || claims[idx].item_id));
      if (itemIdx !== -1) {
        items[itemIdx].status = 'RETURNED';
        setStoredData(STORAGE_KEYS.ITEMS, items);
      }
    }

    return { message: 'Status updated.', claim: claims[idx] };
  }

  if (path.match(/\/claims\/admin\/[^/]+\/meeting/) && method === 'PATCH') {
    const parts = path.split('/');
    const id = parts[3];
    const { meeting_time, meeting_location } = body;

    const claims = getStoredData(STORAGE_KEYS.CLAIMS, INITIAL_CLAIMS);
    const idx = claims.findIndex((c) => c._id === id);
    if (idx === -1) throw { status: 404, message: 'Claim not found.' };

    claims[idx].meeting_time = meeting_time;
    claims[idx].meeting_location = meeting_location;
    claims[idx].status = 'VERIFICATION_REQUIRED';
    setStoredData(STORAGE_KEYS.CLAIMS, claims);

    return { message: 'Meeting scheduled.', claim: claims[idx] };
  }

  if (path.match(/\/claims\/[^/]+\/inperson/) && method === 'POST') {
    const parts = path.split('/');
    const id = parts[2];
    const claims = getStoredData(STORAGE_KEYS.CLAIMS, INITIAL_CLAIMS);
    const idx = claims.findIndex((c) => c._id === id);
    if (idx === -1) throw { status: 404, message: 'Claim not found.' };

    claims[idx].in_person_requested = true;
    claims[idx].status = 'VERIFICATION_REQUIRED';
    setStoredData(STORAGE_KEYS.CLAIMS, claims);

    return { message: 'In-person verification requested.', claim: claims[idx] };
  }

  // 4. MESSAGES ROUTES
  if (path.match(/\/messages\/[^/]+$/) && method === 'GET') {
    const requestId = path.replace('/messages/', '');
    const messages = getStoredData(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    const filtered = messages.filter((m) => m.request_id === requestId);
    return { messages: filtered };
  }

  if (path.match(/\/messages\/[^/]+$/) && method === 'POST') {
    const requestId = path.replace('/messages/', '');
    const user = JSON.parse(localStorage.getItem('lf_user') || '{}');
    const messages = getStoredData(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);

    const newMsg = {
      _id: `msg_${Date.now()}`,
      request_id: requestId,
      sender_id: user.id || 'user',
      sender_role: user.role || 'student',
      sender_name: user.name || user.username || 'User',
      message: body.message,
      createdAt: new Date().toISOString(),
    };

    messages.push(newMsg);
    setStoredData(STORAGE_KEYS.MESSAGES, messages);
    broadcastMockMessage(requestId, newMsg);

    return { message: newMsg };
  }

  // 5. ADMIN DASHBOARD STATS
  if (path === '/admin/stats') {
    const items = getStoredData(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
    const claims = getStoredData(STORAGE_KEYS.CLAIMS, INITIAL_CLAIMS);

    return {
      stats: {
        totalItems: items.length,
        pendingItems: items.filter((i) => i.status === 'PENDING').length,
        publishedItems: items.filter((i) => i.status === 'PUBLISHED').length,
        returnedItems: items.filter((i) => i.status === 'RETURNED').length,
        activeClaims: claims.length,
        pendingClaims: claims.filter((c) => c.status === 'PENDING').length,
      },
    };
  }

  throw { status: 404, message: `Endpoint ${path} not found.` };
}
