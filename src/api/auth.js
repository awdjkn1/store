/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on 2025-11-11T19:57:07.772Z */
// src/api/auth.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export async function register({ username, email, password, role }) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, email, password, role })
  });
  return res.json();
}

export async function login({ email, password }) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

export async function logout() {
  const res = await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
  return res.json();
}

export async function getProfile() {
  // Profile endpoint reads token from cookie (HttpOnly). Send credentials so cookie is included.
  const res = await fetch(`${API_URL}/profile`, {
    credentials: 'include'
  });
  return res.json();
}
