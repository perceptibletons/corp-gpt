const DB = {
  users: [
    { id: 'u1', name: 'Alice HR', email: 'alice@corp.com', password: 'password', role: 'hr' },
    { id: 'u2', name: 'Bob Finance', email: 'bob@corp.com', password: 'password', role: 'finance' }
  ]
};

export async function login(email, password) {
  await sleep(300);
  const u = DB.users.find(x => x.email === email && x.password === password);
  if (!u) return { ok: false, message: 'Invalid credentials' };
  return { ok: true, user: { id: u.id, name: u.name, email: u.email, role: u.role } };
}

export async function signup({ name, email, password, role }) {
  await sleep(300);
  if (DB.users.find(x => x.email === email)) return { ok: false, message: 'Email already exists' };
  const newUser = { id: `u${Date.now()}`, name, email, password, role };
  DB.users.push(newUser);
  return { ok: true, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
