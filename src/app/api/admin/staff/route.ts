import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDbAsync, saveDbAsync, logAudit } from '@/lib/db';
import {
  getSession,
  hashPassword,
  validatePasswordStrength,
  sanitizeUser,
  sendDevEmail,
  SESSION_COOKIE_NAME,
} from '@/lib/auth';
import { UserAccount, UserRole } from '@/types';

// Helper to ensure caller is Super Admin
function requireAdmin() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) return null;
  const sessionData = getSession(sessionCookie.value);
  if (!sessionData || sessionData.user.role !== 'admin') return null;
  return sessionData.user;
}

export async function GET() {
  const admin = requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Akses ditolak: Hanya Super Admin' }, { status: 403 });
  }

  const db = await getDbAsync();
  const staffUsers = db.users
    .filter((u) => u.role !== 'patient')
    .map((u) => sanitizeUser(u));

  return NextResponse.json({ success: true, data: staffUsers });
}

export async function POST(request: Request) {
  const admin = requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Akses ditolak: Hanya Super Admin' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, email, phone, role, password, doctorId } = body;

    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { error: 'Nama lengkap, email, peran staf, dan kata sandi wajib diisi' },
        { status: 400 }
      );
    }

    if (!['front_desk', 'doctor', 'nurse', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Peran staf tidak valid' }, { status: 400 });
    }

    // Passwords: at least 12 characters for staff
    const pwCheck = validatePasswordStrength(password, role as UserRole);
    if (!pwCheck.valid) {
      return NextResponse.json({ error: pwCheck.message }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = await getDbAsync();

    // Check duplicate email
    if (db.users.some((u) => u.email?.toLowerCase().trim() === cleanEmail && !u.isMerged)) {
      return NextResponse.json(
        { error: `Email ${cleanEmail} sudah terdaftar dalam sistem.` },
        { status: 409 }
      );
    }

    const { hash, salt } = hashPassword(password);
    const newStaffId = `usr-${role}-${Date.now()}`;

    const newStaff: UserAccount = {
      id: newStaffId,
      name: name.trim(),
      email: cleanEmail,
      phone: phone?.trim() || '08000000000',
      role: role as UserRole,
      doctorId: role === 'doctor' ? doctorId : undefined,
      password: password, // preserved for demo
      passwordHash: hash,
      passwordSalt: salt,
      emailVerified: true, // Staff accounts pre-verified by admin
      failedLoginAttempts: 0,
      lockedUntil: null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newStaff);
    await saveDbAsync(db);

    sendDevEmail({
      to: cleanEmail,
      subject: 'Akun Staf Baru Dibuat - Poliklinik Umum',
      title: 'Selamat Datang di Portal Staf Poliklinik',
      body: `Halo ${name},\n\nAkun staf Anda untuk peran ${role} telah berhasil dibuat oleh Super Admin (${admin.name}). Anda dapat masuk melalui portal khusus staf (/staff) dengan kredensial yang telah diberikan.`,
      link: 'http://localhost:3000/staff',
      type: 'staff_welcome',
    });

    logAudit(
      admin.name,
      admin.role,
      'STAFF_CREATED',
      'system',
      `Super Admin membuat akun staf baru: ${newStaff.name} (${newStaff.role}, ${newStaff.email})`
    );

    return NextResponse.json({ success: true, user: sanitizeUser(newStaff) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Akses ditolak: Hanya Super Admin' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, name, role, isActive, password, unlock } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID akun staf wajib diisi' }, { status: 400 });
    }

    const db = await getDbAsync();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Akun staf tidak ditemukan' }, { status: 404 });
    }

    const staff = db.users[idx];

    if (name) staff.name = name.trim();
    if (role && ['front_desk', 'doctor', 'nurse', 'admin'].includes(role)) {
      const oldRole = staff.role;
      staff.role = role as UserRole;
      logAudit(
        admin.name,
        admin.role,
        'STAFF_ROLE_CHANGED',
        'system',
        `Perubahan peran staf ${staff.name} dari ${oldRole} menjadi ${role}`
      );
    }

    if (typeof isActive === 'boolean') {
      staff.isActive = isActive;
      if (!isActive) {
        // Destroy all active sessions for deactivated staff
        if (db.sessions) {
          db.sessions = db.sessions.filter((s) => s.userId !== id);
        }
        logAudit(
          admin.name,
          admin.role,
          'STAFF_DEACTIVATED',
          'system',
          `Akun staf dinonaktifkan oleh Super Admin: ${staff.name} (${staff.email})`
        );
      } else {
        logAudit(
          admin.name,
          admin.role,
          'STAFF_ACTIVATED',
          'system',
          `Akun staf diaktifkan kembali oleh Super Admin: ${staff.name} (${staff.email})`
        );
      }
    }

    if (unlock) {
      staff.failedLoginAttempts = 0;
      staff.lockedUntil = null;
      logAudit(
        admin.name,
        admin.role,
        'STAFF_UNLOCKED',
        'system',
        `Akun staf dibuka kuncinya oleh Super Admin: ${staff.name}`
      );
    }

    if (password) {
      const pwCheck = validatePasswordStrength(password, staff.role);
      if (!pwCheck.valid) {
        return NextResponse.json({ error: pwCheck.message }, { status: 400 });
      }
      const { hash, salt } = hashPassword(password);
      staff.passwordHash = hash;
      staff.passwordSalt = salt;
      staff.password = password;
      logAudit(
        admin.name,
        admin.role,
        'STAFF_PASSWORD_RESET',
        'system',
        `Kata sandi staf diperbarui oleh Super Admin: ${staff.name}`
      );
    }

    db.users[idx] = staff;
    await saveDbAsync(db);

    return NextResponse.json({ success: true, user: sanitizeUser(staff) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

