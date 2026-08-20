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
    serial_number: 'LF-10001',
    uid: 'UID-9A4B8C12',
    category: 'Electronics',
    who_found: 'Library Staff',
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
    serial_number: 'LF-10002',
    uid: 'UID-8B3C7D34',
    category: 'Clothing',
    who_found: 'Sports Coach Verma',
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
    serial_number: 'LF-10003',
    uid: 'UID-7C2D6E56',
    category: 'ID / Cards',
    who_found: 'Cafeteria Supervisor',
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
    serial_number: 'LF-10004',
    uid: 'UID-6D1E5F78',
    category: 'Accessories',
    who_found: 'Priya Singh (Student)',
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
    serial_number: 'LF-10005',
    uid: 'UID-5E0F4A90',
    category: 'Bags',
    who_found: 'Auditorium Guard Ramesh',
    location_found: 'Auditorium Row 4',
    date_found: '2026-08-18T00:00:00.000Z',
    time_found: '09:10',
    description: 'Black backpack with red Nike swoosh. Contains a geometry box and spiral notebook.',
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
    status: 'PUBLISHED',
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
  
  const storedItems = getStoredData(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
  const existingIds = new Set((storedItems || []).map((i) => String(i._id || i.id)));
  let updated = false;
  for (const initItem of INITIAL_ITEMS) {
    if (!existingIds.has(String(initItem._id))) {
      storedItems.push(initItem);
      updated = true;
    }
  }
  if (updated || !storedItems.length) {
    setStoredData(STORAGE_KEYS.ITEMS, storedItems.length ? storedItems : INITIAL_ITEMS);
  }

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

  // Simulate fast network delay
  await new Promise((r) => setTimeout(r, 80));

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
    if (username === 'superadmin' && password === 'superadmin123') {
      const token = 'mock_token_superadmin';
      return { token, username: 'superadmin', role: 'superadmin' };
    }
    if (username === 'admin' && password === 'admin123') {
      const token = 'mock_token_admin_super';
      return { token, username: 'admin', role: 'admin' };
    }
    throw { status: 401, message: 'Invalid admin or superadmin credentials. (Use admin / admin123 or superadmin / superadmin123)' };
  }

  if (path === '/auth/me') {
    const token = localStorage.getItem('lf_token');
    const user = JSON.parse(localStorage.getItem('lf_user') || 'null');
    if (token && user) {
      return { valid: true, user };
    }
    throw { status: 401, message: 'Invalid session' };
  }

  const ensureItemIdentifiers = (itemList) => {
    let updated = false;
    const list = (itemList || []).map((item, idx) => {
      const newItem = { ...item };
      if (!newItem.serial_number) {
        newItem.serial_number = `LF-${10001 + idx}`;
        updated = true;
      }
      if (!newItem.uid) {
        newItem.uid = `UID-${(10001 + idx).toString(16).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        updated = true;
      }
      return newItem;
    });
    if (updated) {
      setStoredData(STORAGE_KEYS.ITEMS, list);
    }
    return list;
  };

  // 2. ITEMS ROUTES
  if (path === '/items' && method === 'GET') {
    const rawItems = getStoredData(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
    const items = ensureItemIdentifiers(rawItems);
    let filtered = (items || []).filter((i) => i.status === 'PUBLISHED');

    const category = query.get('category');
    const location_found = query.get('location_found');
    const q = query.get('q');

    if (category) {
      const cats = category.split(',').map(s => s.trim());
      filtered = filtered.filter((i) => cats.includes(i.category));
    }
    if (location_found) {
      const locs = location_found.split(',').map(s => s.trim());
      filtered = filtered.filter((i) => locs.includes(i.location_found));
    }
    if (q) {
      const lq = q.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          (i.serial_number && i.serial_number.toLowerCase().includes(lq)) ||
          (i.uid && i.uid.toLowerCase().includes(lq)) ||
          i.category.toLowerCase().includes(lq) ||
          (i.who_found && i.who_found.toLowerCase().includes(lq)) ||
          i.description.toLowerCase().includes(lq) ||
          i.location_found.toLowerCase().includes(lq)
      );
    }

    return { items: filtered };
  }

  if (path === '/items/admin/all' && method === 'GET') {
    const rawItems = getStoredData(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
    const items = ensureItemIdentifiers(rawItems);
    const status = query.get('status');
    const category = query.get('category');
    const location_found = query.get('location_found');
    const reported_by = query.get('reported_by');
    const serial_number = query.get('serial_number');
    const date_from = query.get('date_from');
    const date_to = query.get('date_to');

    let resItems = items;

    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      resItems = resItems.filter((i) => statuses.includes(i.status));
    }
    if (category) {
      const cats = category.split(',').map(s => s.trim());
      resItems = resItems.filter((i) => cats.includes(i.category));
    }
    if (location_found) {
      const locs = location_found.split(',').map(s => s.trim());
      resItems = resItems.filter((i) => locs.includes(i.location_found));
    }
    if (reported_by) {
      const reporters = reported_by.split(',').map(s => s.trim());
      resItems = resItems.filter((i) => reporters.includes(i.student_name));
    }
    if (serial_number) {
      const serials = serial_number.split(',').map(s => s.trim());
      resItems = resItems.filter((i) => serials.includes(i.serial_number) || serials.includes(i.uid));
    }
    if (date_from) {
      const df = new Date(date_from).getTime();
      resItems = resItems.filter((i) => new Date(i.date_found).getTime() >= df);
    }
    if (date_to) {
      const dt = new Date(date_to).getTime();
      resItems = resItems.filter((i) => new Date(i.date_found).getTime() <= dt);
    }

    return { items: resItems };
  }

  if (path.startsWith('/items/') && method === 'GET') {
    const id = path.replace('/items/', '');
    const items = getStoredData(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
    let found = items.find((i) => String(i._id || i.id) === String(id));
    if (!found) {
      found = INITIAL_ITEMS.find((i) => String(i._id || i.id) === String(id));
    }
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

    const serial_number = `LF-${Math.floor(10000 + Math.random() * 90000)}`;
    const uid = `UID-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const newItem = {
      _id: `item_${Date.now()}`,
      serial_number,
      uid,
      category: body.category || 'Other',
      who_found: body.who_found || '',
      location_found: body.location_found || '',
      date_found: body.date_found ? new Date(body.date_found).toISOString() : new Date().toISOString(),
      time_found: body.time_found || '',
      description: body.description || '',
      image_url: imageUrl,
      status: 'PUBLISHED',
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

  if (path.match(/\/items\/admin\/[^/]+\/handover-form/) && (method === 'POST' || method === 'PATCH')) {
    const parts = path.split('/');
    const id = parts[3];

    const items = getStoredData(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
    const idx = items.findIndex((i) => String(i._id || i.id) === String(id));
    if (idx === -1) throw { status: 404, message: 'Item not found.' };

    let formUrl = 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80';
    if (body.handover_form && body.handover_form instanceof File) {
      formUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(body.handover_form);
      });
    } else if (body.handover_form_url) {
      formUrl = body.handover_form_url;
    }

    items[idx].handover_form_url = formUrl;
    items[idx].handover_date = body.handover_date || new Date().toISOString();
    items[idx].handover_notes = body.handover_notes || 'Handed over to student after identity & physical form verification.';
    items[idx].handover_student_name = body.handover_student_name || body.student_name || '';
    items[idx].handover_reg_number = body.handover_reg_number || body.registration_number || '';
    items[idx].handover_phone = body.handover_phone || body.phone || '';
    items[idx].handover_department = body.handover_department || body.department || '';
    items[idx].status = 'CLAIMED';

    setStoredData(STORAGE_KEYS.ITEMS, items);
    return { message: 'Physical handover form uploaded successfully.', item: items[idx] };
  }

  if (path.match(/\/items\/admin\/[^/]+\/edit/) && (method === 'PUT' || method === 'PATCH')) {
    const parts = path.split('/');
    const id = parts[3];

    const items = getStoredData(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
    const idx = items.findIndex((i) => String(i._id || i.id) === String(id));
    if (idx === -1) throw { status: 404, message: 'Item not found.' };

    const fields = ['serial_number', 'uid', 'category', 'who_found', 'location_found', 'date_found', 'time_found', 'description', 'student_name', 'registration_number', 'status', 'handover_notes'];
    fields.forEach(f => {
      if (body[f] !== undefined) items[idx][f] = body[f];
    });

    if (body.image && body.image instanceof File) {
      items[idx].image_url = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(body.image);
      });
    }

    setStoredData(STORAGE_KEYS.ITEMS, items);
    return { message: 'Item updated successfully by SuperAdmin.', item: items[idx] };
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
